import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateChordDto } from './dto/create-chord.dto';
import { ChordDto } from './dto/chord.dto';

@Injectable()
export class ChordsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(search?: string): Promise<ChordDto[]> {
    let query = 'SELECT * FROM chords ORDER BY name';
    let params: any[] = [];

    if (search) {
      query = 'SELECT * FROM chords WHERE LOWER(name) LIKE $1 ORDER BY name';
      params = [`%${search.toLowerCase()}%`];
    }

    const result = await this.db.query(query, params);
    return result.rows;
  }

  async findOne(id: number): Promise<ChordDto> {
    const result = await this.db.query('SELECT * FROM chords WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      throw new NotFoundException('Chord not found');
    }

    return result.rows[0];
  }

  async findByIds(ids: number[]): Promise<ChordDto[]> {
    if (ids.length === 0) return [];

    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    const result = await this.db.query(
      `SELECT * FROM chords WHERE id IN (${placeholders}) ORDER BY name`,
      ids
    );
    return result.rows;
  }

  async create(createChordDto: CreateChordDto): Promise<ChordDto> {
    const { name, strings, start_fret = 1 } = createChordDto;

    const result = await this.db.query(
      'INSERT INTO chords (name, strings, start_fret) VALUES ($1, $2, $3) RETURNING *',
      [name, JSON.stringify(strings), start_fret]
    );

    return result.rows[0];
  }

  async update(id: number, updateChordDto: Partial<CreateChordDto>): Promise<ChordDto> {
    const { name, strings, start_fret } = updateChordDto;

    const result = await this.db.query(
      `UPDATE chords
       SET name = COALESCE($1, name),
           strings = COALESCE($2, strings),
           start_fret = COALESCE($3, start_fret)
       WHERE id = $4
       RETURNING *`,
      [name, strings ? JSON.stringify(strings) : null, start_fret, id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Chord not found');
    }

    return result.rows[0];
  }

  async delete(id: number): Promise<ChordDto> {
    const result = await this.db.query('DELETE FROM chords WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      throw new NotFoundException('Chord not found');
    }

    return result.rows[0];
  }
}
