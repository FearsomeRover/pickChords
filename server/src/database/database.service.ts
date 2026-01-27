import { Injectable, OnModuleInit } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  async onModuleInit() {
    await this.initDb();
  }

  async query(text: string, params?: any[]) {
    return this.pool.query(text, params);
  }

  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  private async initDb() {
    const client = await this.pool.connect();
    try {
      // Create chords table
      await client.query(`
        CREATE TABLE IF NOT EXISTS chords (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          strings JSONB NOT NULL,
          start_fret INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_chords_name ON chords(LOWER(name))
      `);

      // Create users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(100) NOT NULL UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create tags table
      await client.query(`
        CREATE TABLE IF NOT EXISTS tags (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL UNIQUE,
          color VARCHAR(7) NOT NULL DEFAULT '#5b8bd4',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create songs table
      await client.query(`
        CREATE TABLE IF NOT EXISTS songs (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          artist VARCHAR(255),
          notes TEXT,
          chord_ids JSONB NOT NULL DEFAULT '[]',
          tag_ids JSONB NOT NULL DEFAULT '[]',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create favorites table
      await client.query(`
        CREATE TABLE IF NOT EXISTS favorites (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          song_id INTEGER NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, song_id)
        )
      `);

      // Check if we have any chords, if not insert defaults
      const result = await client.query('SELECT COUNT(*) FROM chords');
      if (parseInt(result.rows[0].count) === 0) {
        await this.insertDefaultChords(client);
      }

      console.log('Database initialized');
    } finally {
      client.release();
    }
  }

  private async insertDefaultChords(client: PoolClient) {
    const defaultChords = [
      {
        name: 'A',
        strings: [
          { fret: 'x' },
          { fret: 0 },
          { fret: 2, finger: 1 },
          { fret: 2, finger: 2 },
          { fret: 2, finger: 3 },
          { fret: 0 },
        ],
      },
      {
        name: 'Am',
        strings: [
          { fret: 'x' },
          { fret: 0 },
          { fret: 2, finger: 2 },
          { fret: 2, finger: 3 },
          { fret: 1, finger: 1 },
          { fret: 0 },
        ],
      },
      {
        name: 'C',
        strings: [
          { fret: 'x' },
          { fret: 3, finger: 3 },
          { fret: 2, finger: 2 },
          { fret: 0 },
          { fret: 1, finger: 1 },
          { fret: 0 },
        ],
      },
      {
        name: 'D',
        strings: [
          { fret: 'x' },
          { fret: 'x' },
          { fret: 0 },
          { fret: 2, finger: 1 },
          { fret: 3, finger: 3 },
          { fret: 2, finger: 2 },
        ],
      },
      {
        name: 'Dm',
        strings: [
          { fret: 'x' },
          { fret: 'x' },
          { fret: 0 },
          { fret: 2, finger: 2 },
          { fret: 3, finger: 3 },
          { fret: 1, finger: 1 },
        ],
      },
      {
        name: 'E',
        strings: [
          { fret: 0 },
          { fret: 2, finger: 2 },
          { fret: 2, finger: 3 },
          { fret: 1, finger: 1 },
          { fret: 0 },
          { fret: 0 },
        ],
      },
      {
        name: 'Em',
        strings: [
          { fret: 0 },
          { fret: 2, finger: 2 },
          { fret: 2, finger: 3 },
          { fret: 0 },
          { fret: 0 },
          { fret: 0 },
        ],
      },
      {
        name: 'G',
        strings: [
          { fret: 3, finger: 2 },
          { fret: 2, finger: 1 },
          { fret: 0 },
          { fret: 0 },
          { fret: 0 },
          { fret: 3, finger: 3 },
        ],
      },
    ];

    for (const chord of defaultChords) {
      await client.query(
        'INSERT INTO chords (name, strings) VALUES ($1, $2)',
        [chord.name, JSON.stringify(chord.strings)]
      );
    }
    console.log('Inserted default chords');
  }
}
