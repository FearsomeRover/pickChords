import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface Favorite {
  id: number;
  user_id: number;
  song_id: number;
  created_at: string;
}

@Injectable()
export class FavoritesService {
  constructor(private readonly db: DatabaseService) {}

  async addFavorite(userId: number, songId: number): Promise<Favorite> {
    // Check if song exists
    const songResult = await this.db.query('SELECT id FROM songs WHERE id = $1', [songId]);
    if (songResult.rows.length === 0) {
      throw new NotFoundException('Song not found');
    }

    // Check if already favorited
    const existing = await this.db.query(
      'SELECT id FROM favorites WHERE user_id = $1 AND song_id = $2',
      [userId, songId]
    );

    if (existing.rows.length > 0) {
      throw new ConflictException('Song already in favorites');
    }

    const result = await this.db.query(
      'INSERT INTO favorites (user_id, song_id) VALUES ($1, $2) RETURNING *',
      [userId, songId]
    );

    return result.rows[0];
  }

  async removeFavorite(userId: number, songId: number): Promise<void> {
    const result = await this.db.query(
      'DELETE FROM favorites WHERE user_id = $1 AND song_id = $2 RETURNING *',
      [userId, songId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Favorite not found');
    }
  }

  async isFavorite(userId: number, songId: number): Promise<boolean> {
    const result = await this.db.query(
      'SELECT 1 FROM favorites WHERE user_id = $1 AND song_id = $2',
      [userId, songId]
    );
    return result.rows.length > 0;
  }
}
