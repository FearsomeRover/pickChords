import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type ProgressStatus = 'want_to_learn' | 'learning' | 'practicing' | 'mastered';

export interface SongProgress {
  id: number;
  user_id: number;
  song_id: number;
  status: ProgressStatus;
  position: number;
  created_at: string;
  updated_at: string;
  // Joined song data
  song_name?: string;
  song_artist?: string;
  chord_count?: number;
}

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  private toSongProgress(dbProgress: any): SongProgress {
    return {
      id: dbProgress.id,
      user_id: dbProgress.userId,
      song_id: dbProgress.songId,
      status: dbProgress.status as ProgressStatus,
      position: dbProgress.position,
      created_at: dbProgress.createdAt.toISOString(),
      updated_at: dbProgress.updatedAt.toISOString(),
      song_name: dbProgress.song?.name,
      song_artist: dbProgress.song?.artist,
      chord_count: dbProgress.song?.chordIds ? (dbProgress.song.chordIds as any[]).length : 0,
    };
  }

  async findAllByUser(userId: number): Promise<SongProgress[]> {
    const progressList = await this.prisma.songProgress.findMany({
      where: { userId },
      include: { song: true },
      orderBy: [{ status: 'asc' }, { position: 'asc' }],
    });
    return progressList.map(this.toSongProgress);
  }

  async findOne(userId: number, songId: number): Promise<SongProgress | null> {
    const progress = await this.prisma.songProgress.findUnique({
      where: {
        userId_songId: { userId, songId },
      },
      include: { song: true },
    });
    return progress ? this.toSongProgress(progress) : null;
  }

  async addToProgress(
    userId: number,
    songId: number,
    status: ProgressStatus = 'want_to_learn',
  ): Promise<SongProgress> {
    // Get the max position for this status
    const maxPositionResult = await this.prisma.songProgress.aggregate({
      where: { userId, status },
      _max: { position: true },
    });
    const position = (maxPositionResult._max.position ?? -1) + 1;

    await this.prisma.songProgress.upsert({
      where: {
        userId_songId: { userId, songId },
      },
      create: {
        userId,
        songId,
        status,
        position,
      },
      update: {
        status,
        position,
        updatedAt: new Date(),
      },
    });

    return this.findOne(userId, songId) as Promise<SongProgress>;
  }

  async updateProgress(
    userId: number,
    songId: number,
    status: ProgressStatus,
    position: number,
  ): Promise<SongProgress> {
    // First, get the current progress to check if it exists
    const existing = await this.findOne(userId, songId);
    if (!existing) {
      throw new NotFoundException('Progress entry not found');
    }

    const oldStatus = existing.status;
    const oldPosition = existing.position;

    // If status changed, we need to reorder both columns
    if (oldStatus !== status) {
      // Remove from old column (shift positions down)
      await this.prisma.songProgress.updateMany({
        where: {
          userId,
          status: oldStatus,
          position: { gt: oldPosition },
        },
        data: { position: { decrement: 1 } },
      });

      // Make room in new column (shift positions up)
      await this.prisma.songProgress.updateMany({
        where: {
          userId,
          status,
          position: { gte: position },
        },
        data: { position: { increment: 1 } },
      });
    } else {
      // Same column, just reorder
      if (oldPosition < position) {
        // Moving down: shift items between old and new position up
        await this.prisma.songProgress.updateMany({
          where: {
            userId,
            status,
            position: { gt: oldPosition, lte: position },
          },
          data: { position: { decrement: 1 } },
        });
      } else if (oldPosition > position) {
        // Moving up: shift items between new and old position down
        await this.prisma.songProgress.updateMany({
          where: {
            userId,
            status,
            position: { gte: position, lt: oldPosition },
          },
          data: { position: { increment: 1 } },
        });
      }
    }

    // Update the item itself
    await this.prisma.songProgress.update({
      where: {
        userId_songId: { userId, songId },
      },
      data: {
        status,
        position,
        updatedAt: new Date(),
      },
    });

    return this.findOne(userId, songId) as Promise<SongProgress>;
  }

  async removeFromProgress(userId: number, songId: number): Promise<void> {
    const existing = await this.findOne(userId, songId);
    if (!existing) {
      throw new NotFoundException('Progress entry not found');
    }

    // Delete the entry
    await this.prisma.songProgress.delete({
      where: {
        userId_songId: { userId, songId },
      },
    });

    // Shift positions down for remaining items in the same column
    await this.prisma.songProgress.updateMany({
      where: {
        userId,
        status: existing.status,
        position: { gt: existing.position },
      },
      data: { position: { decrement: 1 } },
    });
  }
}
