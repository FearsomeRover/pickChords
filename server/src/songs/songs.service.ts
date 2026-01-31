import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
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
    private readonly db: DatabaseService,
    private readonly chordsService: ChordsService,
    private readonly tagsService: TagsService,
  ) {}

  async findAll(options: {
    search?: string;
    tagId?: number;
  }): Promise<SongWithExpanded[]> {
    let query = 'SELECT s.* FROM songs s';
    const params: any[] = [];
    const conditions: string[] = [];

    if (options.search) {
      params.push(`%${options.search.toLowerCase()}%`);
      conditions.push(`(LOWER(s.name) LIKE $${params.length} OR LOWER(s.artist) LIKE $${params.length})`);
    }

    if (options.tagId) {
      params.push(options.tagId);
      conditions.push(`s.tag_ids @> $${params.length}::jsonb`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY s.name';

    const result = await this.db.query(query, params);
    const songs: SongWithExpanded[] = result.rows;

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
    const result = await this.db.query('SELECT * FROM songs WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      throw new NotFoundException('Song not found');
    }

    const song: SongWithExpanded = result.rows[0];

    // Expand chords and tags
    song.chords = await this.chordsService.findByIds(song.chord_ids || []);
    song.tags = await this.tagsService.findByIds(song.tag_ids || []);

    return song;
  }

  async findOneRaw(id: number): Promise<Song | null> {
    const result = await this.db.query('SELECT * FROM songs WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async create(createSongDto: CreateSongDto, userId: number): Promise<Song> {
    const { name, artist, notes, chord_ids = [], tag_ids = [], strumming_pattern, capo, links = [] } = createSongDto;

    const result = await this.db.query(
      `INSERT INTO songs (name, artist, notes, chord_ids, tag_ids, strumming_pattern, capo, links, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        name,
        artist || null,
        notes || null,
        JSON.stringify(chord_ids),
        JSON.stringify(tag_ids),
        strumming_pattern ? JSON.stringify(strumming_pattern) : null,
        capo || null,
        JSON.stringify(links),
        userId
      ]
    );

    // Increment usage count for all chords in this song
    if (chord_ids.length > 0) {
      await this.chordsService.incrementUsageCount(chord_ids);
    }

    return result.rows[0];
  }

  async update(id: number, updateSongDto: Partial<CreateSongDto>): Promise<Song> {
    const { name, artist, notes, chord_ids, tag_ids, strumming_pattern, capo, links } = updateSongDto;

    // Get the old chord_ids if we're updating chords
    let oldChordIds: number[] = [];
    if (chord_ids !== undefined) {
      const oldSong = await this.db.query('SELECT chord_ids FROM songs WHERE id = $1', [id]);
      if (oldSong.rows.length > 0) {
        oldChordIds = oldSong.rows[0].chord_ids || [];
      }
    }

    const result = await this.db.query(
      `UPDATE songs
       SET name = COALESCE($1, name),
           artist = COALESCE($2, artist),
           notes = COALESCE($3, notes),
           chord_ids = COALESCE($4, chord_ids),
           tag_ids = COALESCE($5, tag_ids),
           strumming_pattern = COALESCE($6, strumming_pattern),
           capo = CASE WHEN $7::boolean THEN $8 ELSE capo END,
           links = COALESCE($9, links)
       WHERE id = $10
       RETURNING *`,
      [
        name,
        artist,
        notes,
        chord_ids ? JSON.stringify(chord_ids) : null,
        tag_ids ? JSON.stringify(tag_ids) : null,
        strumming_pattern !== undefined ? JSON.stringify(strumming_pattern) : null,
        capo !== undefined, // $7: whether to update capo
        capo || null,       // $8: the new capo value
        links ? JSON.stringify(links) : null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Song not found');
    }

    // Update usage counts if chords changed
    if (chord_ids !== undefined) {
      // Find chords that were removed
      const removedChords = oldChordIds.filter(id => !chord_ids.includes(id));
      if (removedChords.length > 0) {
        await this.chordsService.decrementUsageCount(removedChords);
      }

      // Find chords that were added
      const addedChords = chord_ids.filter(id => !oldChordIds.includes(id));
      if (addedChords.length > 0) {
        await this.chordsService.incrementUsageCount(addedChords);
      }
    }

    return result.rows[0];
  }

  async delete(id: number): Promise<Song> {
    const result = await this.db.query('DELETE FROM songs WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      throw new NotFoundException('Song not found');
    }

    // Decrement usage count for all chords in this song
    const deletedSong = result.rows[0];
    if (deletedSong.chord_ids && deletedSong.chord_ids.length > 0) {
      await this.chordsService.decrementUsageCount(deletedSong.chord_ids);
    }

    return result.rows[0];
  }
}
