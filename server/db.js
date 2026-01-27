import pg from 'pg'
const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// Initialize the database schema
export async function initDb() {
  const client = await pool.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS chords (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        strings JSONB NOT NULL,
        start_fret INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create index for name searches if it doesn't exist
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_chords_name ON chords(LOWER(name))
    `)

    // Check if we have any chords, if not insert defaults
    const result = await client.query('SELECT COUNT(*) FROM chords')
    if (parseInt(result.rows[0].count) === 0) {
      await insertDefaultChords(client)
    }

    console.log('Database initialized')
  } finally {
    client.release()
  }
}

async function insertDefaultChords(client) {
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
  ]

  for (const chord of defaultChords) {
    await client.query(
      'INSERT INTO chords (name, strings) VALUES ($1, $2)',
      [chord.name, JSON.stringify(chord.strings)]
    )
  }
  console.log('Inserted default chords')
}

export default pool
