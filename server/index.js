import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import pool, { initDb } from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// Serve static files from the React build
app.use(express.static(path.join(__dirname, '../dist')))

// API Routes

// Get all chords (with optional search)
app.get('/api/chords', async (req, res) => {
  try {
    const { search } = req.query
    let query = 'SELECT * FROM chords ORDER BY name'
    let params = []

    if (search) {
      query = 'SELECT * FROM chords WHERE LOWER(name) LIKE $1 ORDER BY name'
      params = [`%${search.toLowerCase()}%`]
    }

    const result = await pool.query(query, params)
    res.json(result.rows)
  } catch (err) {
    console.error('Error fetching chords:', err)
    res.status(500).json({ error: 'Failed to fetch chords' })
  }
})

// Get a single chord by ID
app.get('/api/chords/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query('SELECT * FROM chords WHERE id = $1', [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chord not found' })
    }

    res.json(result.rows[0])
  } catch (err) {
    console.error('Error fetching chord:', err)
    res.status(500).json({ error: 'Failed to fetch chord' })
  }
})

// Create a new chord
app.post('/api/chords', async (req, res) => {
  try {
    const { name, strings, start_fret = 1 } = req.body

    if (!name || !strings) {
      return res.status(400).json({ error: 'Name and strings are required' })
    }

    if (!Array.isArray(strings) || strings.length !== 6) {
      return res.status(400).json({ error: 'Strings must be an array of 6 elements' })
    }

    const result = await pool.query(
      'INSERT INTO chords (name, strings, start_fret) VALUES ($1, $2, $3) RETURNING *',
      [name, JSON.stringify(strings), start_fret]
    )

    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('Error creating chord:', err)
    res.status(500).json({ error: 'Failed to create chord' })
  }
})

// Update a chord
app.put('/api/chords/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, strings, start_fret } = req.body

    const result = await pool.query(
      `UPDATE chords
       SET name = COALESCE($1, name),
           strings = COALESCE($2, strings),
           start_fret = COALESCE($3, start_fret)
       WHERE id = $4
       RETURNING *`,
      [name, strings ? JSON.stringify(strings) : null, start_fret, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chord not found' })
    }

    res.json(result.rows[0])
  } catch (err) {
    console.error('Error updating chord:', err)
    res.status(500).json({ error: 'Failed to update chord' })
  }
})

// Delete a chord
app.delete('/api/chords/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query('DELETE FROM chords WHERE id = $1 RETURNING *', [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chord not found' })
    }

    res.json({ message: 'Chord deleted', chord: result.rows[0] })
  } catch (err) {
    console.error('Error deleting chord:', err)
    res.status(500).json({ error: 'Failed to delete chord' })
  }
})

// Catch-all: serve React app for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'))
})

// Start server
async function start() {
  try {
    await initDb()
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`)
    })
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

start()
