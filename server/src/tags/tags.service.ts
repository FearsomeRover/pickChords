import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateTagDto } from './dto/create-tag.dto';

export interface Tag {
  id: number;
  name: string;
  color: string;
  created_at: string;
}

@Injectable()
export class TagsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(): Promise<Tag[]> {
    const result = await this.db.query('SELECT * FROM tags ORDER BY name');
    return result.rows;
  }

  async findByIds(ids: number[]): Promise<Tag[]> {
    if (ids.length === 0) return [];

    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    const result = await this.db.query(
      `SELECT * FROM tags WHERE id IN (${placeholders}) ORDER BY name`,
      ids
    );
    return result.rows;
  }

  async create(createTagDto: CreateTagDto): Promise<Tag> {
    const { name, color = '#5b8bd4' } = createTagDto;

    const result = await this.db.query(
      'INSERT INTO tags (name, color) VALUES ($1, $2) RETURNING *',
      [name, color]
    );

    return result.rows[0];
  }

  async delete(id: number): Promise<Tag> {
    const result = await this.db.query('DELETE FROM tags WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      throw new NotFoundException('Tag not found');
    }

    return result.rows[0];
  }
}
