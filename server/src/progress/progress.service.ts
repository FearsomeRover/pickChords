import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

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
  constructor(private readonly db: DatabaseService) {}

  async findAllByUser(userId: number): Promise<SongProgress[]> {
    const result = await this.db.query(
      `SELECT
        sp.*,
        s.name as song_name,
        s.artist as song_artist,
        jsonb_array_length(s.chord_ids) as chord_count
       FROM song_progress sp
       JOIN songs s ON sp.song_id = s.id
       WHERE sp.user_id = $1
       ORDER BY sp.status, sp.position`,
      [userId],
    );
    return result.rows;
  }

  async findOne(userId: number, songId: number): Promise<SongProgress | null> {
    const result = await this.db.query(
      `SELECT
        sp.*,
        s.name as song_name,
        s.artist as song_artist,
        jsonb_array_length(s.chord_ids) as chord_count
       FROM song_progress sp
       JOIN songs s ON sp.song_id = s.id
       WHERE sp.user_id = $1 AND sp.song_id = $2`,
      [userId, songId],
    );
    return result.rows[0] || null;
  }

  async addToProgress(
    userId: number,
    songId: number,
    status: ProgressStatus = 'want_to_learn',
  ): Promise<SongProgress> {
    // Get the max position for this status
    const posResult = await this.db.query(
      `SELECT COALESCE(MAX(position), -1) + 1 as next_pos
       FROM song_progress
       WHERE user_id = $1 AND status = $2`,
      [userId, status],
    );
    const position = posResult.rows[0].next_pos;

    const result = await this.db.query(
      `INSERT INTO song_progress (user_id, song_id, status, position)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, song_id) DO UPDATE SET
         status = EXCLUDED.status,
         position = EXCLUDED.position,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, songId, status, position],
    );

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
      await this.db.query(
        `UPDATE song_progress
         SET position = position - 1
         WHERE user_id = $1 AND status = $2 AND position > $3`,
        [userId, oldStatus, oldPosition],
      );

      // Make room in new column (shift positions up)
      await this.db.query(
        `UPDATE song_progress
         SET position = position + 1
         WHERE user_id = $1 AND status = $2 AND position >= $3`,
        [userId, status, position],
      );
    } else {
      // Same column, just reorder
      if (oldPosition < position) {
        // Moving down: shift items between old and new position up
        await this.db.query(
          `UPDATE song_progress
           SET position = position - 1
           WHERE user_id = $1 AND status = $2 AND position > $3 AND position <= $4`,
          [userId, status, oldPosition, position],
        );
      } else if (oldPosition > position) {
        // Moving up: shift items between new and old position down
        await this.db.query(
          `UPDATE song_progress
           SET position = position + 1
           WHERE user_id = $1 AND status = $2 AND position >= $3 AND position < $4`,
          [userId, status, position, oldPosition],
        );
      }
    }

    // Update the item itself
    await this.db.query(
      `UPDATE song_progress
       SET status = $1, position = $2, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $3 AND song_id = $4`,
      [status, position, userId, songId],
    );

    return this.findOne(userId, songId) as Promise<SongProgress>;
  }

  async removeFromProgress(userId: number, songId: number): Promise<void> {
    const existing = await this.findOne(userId, songId);
    if (!existing) {
      throw new NotFoundException('Progress entry not found');
    }

    // Delete the entry
    await this.db.query(
      `DELETE FROM song_progress WHERE user_id = $1 AND song_id = $2`,
      [userId, songId],
    );

    // Shift positions down for remaining items in the same column
    await this.db.query(
      `UPDATE song_progress
       SET position = position - 1
       WHERE user_id = $1 AND status = $2 AND position > $3`,
      [userId, existing.status, existing.position],
    );
  }
}
