import { Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
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

  async findById<T>(table: string, id: number): Promise<T | null> {
    const result = await this.query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  async findByIdOrThrow<T>(table: string, id: number, entityName?: string): Promise<T> {
    const result = await this.findById<T>(table, id);
    if (!result) {
      throw new NotFoundException(`${entityName || table} not found`);
    }
    return result;
  }

  async findByIds<T>(table: string, ids: number[]): Promise<T[]> {
    if (ids.length === 0) return [];
    const result = await this.query(
      `SELECT * FROM ${table} WHERE id = ANY($1::int[])`,
      [ids]
    );
    return result.rows;
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
          usage_count INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_chords_name ON chords(LOWER(name))
      `);

      // Add usage_count column if it doesn't exist (for existing databases)
      await client.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name='chords' AND column_name='usage_count'
          ) THEN
            ALTER TABLE chords ADD COLUMN usage_count INTEGER DEFAULT 0;
          END IF;
        END $$;
      `);

      // Create users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(100) NOT NULL UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          is_admin BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Add is_admin column if it doesn't exist (for existing databases)
      await client.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name='users' AND column_name='is_admin'
          ) THEN
            ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
          END IF;
        END $$;
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
          strumming_pattern JSONB,
          capo INTEGER,
          links JSONB NOT NULL DEFAULT '[]',
          user_id INTEGER REFERENCES users(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Add strumming_pattern column if it doesn't exist (for existing databases)
      await client.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name='songs' AND column_name='strumming_pattern'
          ) THEN
            ALTER TABLE songs ADD COLUMN strumming_pattern JSONB;
          END IF;
        END $$;
      `);

      // Add user_id column if it doesn't exist (for existing databases)
      await client.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name='songs' AND column_name='user_id'
          ) THEN
            ALTER TABLE songs ADD COLUMN user_id INTEGER REFERENCES users(id);
          END IF;
        END $$;
      `);

      // Add capo column if it doesn't exist (for existing databases)
      await client.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name='songs' AND column_name='capo'
          ) THEN
            ALTER TABLE songs ADD COLUMN capo INTEGER;
          END IF;
        END $$;
      `);

      // Add links column if it doesn't exist (for existing databases)
      await client.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name='songs' AND column_name='links'
          ) THEN
            ALTER TABLE songs ADD COLUMN links JSONB NOT NULL DEFAULT '[]';
          END IF;
        END $$;
      `);

      // Create logs table
      await client.query(`
        CREATE TABLE IF NOT EXISTS logs (
          id SERIAL PRIMARY KEY,
          level VARCHAR(20) NOT NULL,
          action VARCHAR(100) NOT NULL,
          message TEXT NOT NULL,
          user_id INTEGER REFERENCES users(id),
          username VARCHAR(100),
          ip_address VARCHAR(45),
          user_agent TEXT,
          metadata JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at DESC)
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level)
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_logs_action ON logs(action)
      `);

      // Create song_progress table for Kanban board
      await client.query(`
        CREATE TABLE IF NOT EXISTS song_progress (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          song_id INTEGER NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
          status VARCHAR(50) NOT NULL DEFAULT 'want_to_learn',
          position INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, song_id)
        )
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_song_progress_user ON song_progress(user_id)
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_song_progress_status ON song_progress(status)
      `);

      // Additional indexes for performance
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_songs_user_id ON songs(user_id)
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_songs_created_at ON songs(created_at DESC)
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_song_progress_song_id ON song_progress(song_id)
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
