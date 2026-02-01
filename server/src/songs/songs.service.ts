import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { ChordsService } from '../chords/chords.service';
import { TagsService } from '../tags/tags.service';
import { CreateSongDto } from './dto/create-song.dto';

export interface StrummingPattern {
  strokes: string[];
  tempo: number;
  noteLength: string;
  songPart?: string;
}

export interface Song {
  id: number;
  name: string;
  artist?: string;
  notes?: string;
  chord_ids: number[];
  tag_ids: number[];
  strumming_pattern?: StrummingPattern;
  capo?: number;
  links?: string[];
  tablature?: any;
  user_id?: number;
  created_at: string;
}

export interface SongWithExpanded extends Song {
  chords?: any[];
  tags?: any[];
}

@Injectable()
export class SongsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chordsService: ChordsService,
    private readonly tagsService: TagsService,
  ) {}

  private toSong(dbSong: any): Song {
    return {
      id: dbSong.id,
      name: dbSong.name,
      artist: dbSong.artist || undefined,
      notes: dbSong.notes || undefined,
      chord_ids: (dbSong.chordIds as number[]) || [],
      tag_ids: (dbSong.tagIds as number[]) || [],
      strumming_pattern: dbSong.strummingPattern as StrummingPattern | undefined,
      capo: dbSong.capo || undefined,
      links: (dbSong.links as string[]) || [],
      tablature: dbSong.tablature || undefined,
      user_id: dbSong.userId || undefined,
      created_at: dbSong.createdAt.toISOString(),
    };
  }

  async findAll(options: {
    search?: string;
    tagId?: number;
  }): Promise<SongWithExpanded[]> {
    // Build where clause
    const where: any = {};

    if (options.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { artist: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    if (options.tagId) {
      // Use raw query for JSONB array contains
      where.tagIds = { array_contains: options.tagId };
    }

    const dbSongs = await this.prisma.song.findMany({
      where: options.tagId
        ? {
            ...where,
            tagIds: { array_contains: options.tagId },
          }
        : where,
      orderBy: { name: 'asc' },
    });

    const songs: SongWithExpanded[] = dbSongs.map(s => this.toSong(s));

    // Batch load all chords and tags to avoid N+1 queries
    const allChordIds = [...new Set(songs.flatMap(s => s.chord_ids || []))];
    const allTagIds = [...new Set(songs.flatMap(s => s.tag_ids || []))];

    const [allChords, allTags] = await Promise.all([
      allChordIds.length > 0 ? this.chordsService.findByIds(allChordIds) : [],
      allTagIds.length > 0 ? this.tagsService.findByIds(allTagIds) : [],
    ]);

    // Create lookup maps for O(1) access
    const chordsMap = new Map(allChords.map(c => [c.id, c]));
    const tagsMap = new Map(allTags.map(t => [t.id, t]));

    // Map chords and tags to each song
    for (const song of songs) {
      song.chords = (song.chord_ids || []).map(id => chordsMap.get(id)).filter(Boolean);
      song.tags = (song.tag_ids || []).map(id => tagsMap.get(id)).filter(Boolean);
    }

    return songs;
  }

  async findOne(id: number): Promise<SongWithExpanded> {
    const dbSong = await this.prisma.song.findUnique({
      where: { id },
    });

    if (!dbSong) {
      throw new NotFoundException('Song not found');
    }

    const song: SongWithExpanded = this.toSong(dbSong);

    // Expand chords and tags
    song.chords = await this.chordsService.findByIds(song.chord_ids || []);
    song.tags = await this.tagsService.findByIds(song.tag_ids || []);

    return song;
  }

  async findOneRaw(id: number): Promise<Song | null> {
    const dbSong = await this.prisma.song.findUnique({
      where: { id },
    });
    return dbSong ? this.toSong(dbSong) : null;
  }

  async create(createSongDto: CreateSongDto, userId: number): Promise<Song> {
    const { name, artist, notes, chord_ids = [], tag_ids = [], strumming_pattern, capo, links = [], tablature } = createSongDto;

    const dbSong = await this.prisma.song.create({
      data: {
        name,
        artist: artist || null,
        notes: notes || null,
        chordIds: chord_ids,
        tagIds: tag_ids,
        strummingPattern: strumming_pattern ? (strumming_pattern as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
        capo: capo || null,
        links: links,
        tablature: tablature ? (tablature as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
        userId,
      },
    });

    // Increment usage count for all chords in this song
    if (chord_ids.length > 0) {
      await this.chordsService.incrementUsageCount(chord_ids);
    }

    return this.toSong(dbSong);
  }

  async update(id: number, updateSongDto: Partial<CreateSongDto>): Promise<Song> {
    const { name, artist, notes, chord_ids, tag_ids, strumming_pattern, capo, links, tablature } = updateSongDto;

    // Get the old chord_ids if we're updating chords
    let oldChordIds: number[] = [];
    if (chord_ids !== undefined) {
      const oldSong = await this.prisma.song.findUnique({
        where: { id },
        select: { chordIds: true },
      });
      if (oldSong) {
        oldChordIds = (oldSong.chordIds as number[]) || [];
      }
    }

    try {
      const dbSong = await this.prisma.song.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(artist !== undefined && { artist: artist || null }),
          ...(notes !== undefined && { notes: notes || null }),
          ...(chord_ids !== undefined && { chordIds: chord_ids }),
          ...(tag_ids !== undefined && { tagIds: tag_ids }),
          ...(strumming_pattern !== undefined && {
            strummingPattern: strumming_pattern
              ? (strumming_pattern as unknown as Prisma.InputJsonValue)
              : Prisma.JsonNull,
          }),
          ...(capo !== undefined && { capo: capo || null }),
          ...(links !== undefined && { links }),
          ...(tablature !== undefined && {
            tablature: tablature
              ? (tablature as unknown as Prisma.InputJsonValue)
              : Prisma.JsonNull,
          }),
        },
      });

      // Update usage counts if chords changed
      if (chord_ids !== undefined) {
        // Find chords that were removed
        const removedChords = oldChordIds.filter(cid => !chord_ids.includes(cid));
        if (removedChords.length > 0) {
          await this.chordsService.decrementUsageCount(removedChords);
        }

        // Find chords that were added
        const addedChords = chord_ids.filter(cid => !oldChordIds.includes(cid));
        if (addedChords.length > 0) {
          await this.chordsService.incrementUsageCount(addedChords);
        }
      }

      return this.toSong(dbSong);
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Song not found');
      }
      throw error;
    }
  }

  async delete(id: number): Promise<Song> {
    try {
      const dbSong = await this.prisma.song.delete({
        where: { id },
      });

      const deletedSong = this.toSong(dbSong);

      // Decrement usage count for all chords in this song
      if (deletedSong.chord_ids && deletedSong.chord_ids.length > 0) {
        await this.chordsService.decrementUsageCount(deletedSong.chord_ids);
      }

      return deletedSong;
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Song not found');
      }
      throw error;
    }
  }
}
