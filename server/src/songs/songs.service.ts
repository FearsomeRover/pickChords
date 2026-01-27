import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ChordsService } from '../chords/chords.service';
import { TagsService } from '../tags/tags.service';
import { CreateSongDto } from './dto/create-song.dto';

export interface Song {
  id: number;
  name: string;
  artist?: string;
  notes?: string;
  chord_ids: number[];
  tag_ids: number[];
  created_at: string;
}

export interface SongWithExpanded extends Song {
  chords?: any[];
  tags?: any[];
  is_favorite?: boolean;
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
    favorites?: boolean;
    userId?: number;
  }): Promise<SongWithExpanded[]> {
    let query = 'SELECT s.* FROM songs s';
    const params: any[] = [];
    const conditions: string[] = [];

    if (options.favorites && options.userId) {
      query += ' INNER JOIN favorites f ON s.id = f.song_id AND f.user_id = $1';
      params.push(options.userId);
    }

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

    // Expand chords and tags for each song
    for (const song of songs) {
      song.chords = await this.chordsService.findByIds(song.chord_ids || []);
      song.tags = await this.tagsService.findByIds(song.tag_ids || []);

      if (options.userId) {
        const favResult = await this.db.query(
          'SELECT 1 FROM favorites WHERE user_id = $1 AND song_id = $2',
          [options.userId, song.id]
        );
        song.is_favorite = favResult.rows.length > 0;
      }
    }

    return songs;
  }

  async findOne(id: number, userId?: number): Promise<SongWithExpanded> {
    const result = await this.db.query('SELECT * FROM songs WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      throw new NotFoundException('Song not found');
    }

    const song: SongWithExpanded = result.rows[0];

    // Expand chords and tags
    song.chords = await this.chordsService.findByIds(song.chord_ids || []);
    song.tags = await this.tagsService.findByIds(song.tag_ids || []);

    if (userId) {
      const favResult = await this.db.query(
        'SELECT 1 FROM favorites WHERE user_id = $1 AND song_id = $2',
        [userId, id]
      );
      song.is_favorite = favResult.rows.length > 0;
    }

    return song;
  }

  async create(createSongDto: CreateSongDto): Promise<Song> {
    const { name, artist, notes, chord_ids = [], tag_ids = [] } = createSongDto;

    const result = await this.db.query(
      `INSERT INTO songs (name, artist, notes, chord_ids, tag_ids)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, artist || null, notes || null, JSON.stringify(chord_ids), JSON.stringify(tag_ids)]
    );

    return result.rows[0];
  }

  async update(id: number, updateSongDto: Partial<CreateSongDto>): Promise<Song> {
    const { name, artist, notes, chord_ids, tag_ids } = updateSongDto;

    const result = await this.db.query(
      `UPDATE songs
       SET name = COALESCE($1, name),
           artist = COALESCE($2, artist),
           notes = COALESCE($3, notes),
           chord_ids = COALESCE($4, chord_ids),
           tag_ids = COALESCE($5, tag_ids)
       WHERE id = $6
       RETURNING *`,
      [
        name,
        artist,
        notes,
        chord_ids ? JSON.stringify(chord_ids) : null,
        tag_ids ? JSON.stringify(tag_ids) : null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Song not found');
    }

    return result.rows[0];
  }

  async delete(id: number): Promise<Song> {
    const result = await this.db.query('DELETE FROM songs WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      throw new NotFoundException('Song not found');
    }

    return result.rows[0];
  }
}
