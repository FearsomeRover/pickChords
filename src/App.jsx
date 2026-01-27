import React, { useState, useEffect, useCallback } from 'react'
import ChordDiagram from './components/ChordDiagram'

const API_URL = import.meta.env.VITE_API_URL || ''

function App() {
  const [chords, setChords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [newChord, setNewChord] = useState({
    name: '',
    strings: Array(6).fill({ fret: 0, finger: '' }),
  })

  const fetchChords = useCallback(async (search = '') => {
    try {
      setLoading(true)
      const url = search
        ? `${API_URL}/api/chords?search=${encodeURIComponent(search)}`
        : `${API_URL}/api/chords`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch chords')
      const data = await res.json()
      setChords(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchChords()
  }, [fetchChords])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchChords(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm, fetchChords])

  const parseStringInput = (value) => {
    const trimmed = value.trim().toLowerCase()
    if (trimmed === 'x') return { fret: 'x' }
    if (trimmed === '' || trimmed === '0') return { fret: 0 }

    const parts = trimmed.split('-')
    const fret = parseInt(parts[0], 10)
    if (isNaN(fret)) return { fret: 0 }

    if (parts.length > 1) {
      const finger = parseInt(parts[1], 10)
      return { fret, finger: isNaN(finger) ? undefined : finger }
    }
    return { fret }
  }

  const handleStringChange = (index, value) => {
    const newStrings = [...newChord.strings]
    newStrings[index] = parseStringInput(value)
    setNewChord({ ...newChord, strings: newStrings })
  }

  const getStringDisplayValue = (stringData) => {
    if (stringData.fret === 'x') return 'x'
    if (stringData.fret === 0) return '0'
    if (stringData.finger) return `${stringData.fret}-${stringData.finger}`
    return String(stringData.fret)
  }

  const handleAddChord = async () => {
    if (!newChord.name.trim()) return

    try {
      const res = await fetch(`${API_URL}/api/chords`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newChord.name.trim(),
          strings: newChord.strings,
        }),
      })

      if (!res.ok) throw new Error('Failed to add chord')

      setNewChord({
        name: '',
        strings: Array(6).fill({ fret: 0, finger: '' }),
      })
      setShowModal(false)
      fetchChords(searchTerm)
    } catch (err) {
      alert('Failed to add chord: ' + err.message)
    }
  }

  const handleDeleteChord = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/chords/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete chord')
      fetchChords(searchTerm)
    } catch (err) {
      alert('Failed to delete chord: ' + err.message)
    }
  }

  return (
    <div className="app">
      <header>
        <h1>Pick Chords</h1>
        <p>Your personal guitar chord library</p>
      </header>

      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search chords..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {error && (
        <div className="error-message" style={{ color: '#f66', textAlign: 'center', padding: '20px' }}>
          Error: {error}
        </div>
      )}

      {loading ? (
        <div className="loading" style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
          Loading chords...
        </div>
      ) : chords.length === 0 ? (
        <div className="no-results">
          No chords found. Add some chords to get started!
        </div>
      ) : (
        <div className="chords-grid">
          {chords.map((chord) => (
            <div key={chord.id} className="chord-card">
              <h3>{chord.name}</h3>
              <ChordDiagram chord={chord} />
              <button
                className="btn btn-secondary"
                style={{ marginTop: '12px', fontSize: '0.85rem', padding: '6px 12px' }}
                onClick={() => handleDeleteChord(chord.id)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      <button className="add-chord-btn" onClick={() => setShowModal(true)}>
        +
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add New Chord</h2>

            <div className="form-group">
              <label>Chord Name</label>
              <input
                type="text"
                placeholder="e.g., Am7, Gmaj7, F#m"
                value={newChord.name}
                onChange={(e) => setNewChord({ ...newChord, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>String Positions (low E to high E)</label>
              <div className="string-inputs">
                {['E', 'A', 'D', 'G', 'B', 'e'].map((stringName, i) => (
                  <div key={i} className="string-input">
                    <label>{stringName}</label>
                    <input
                      type="text"
                      placeholder="0"
                      value={getStringDisplayValue(newChord.strings[i])}
                      onChange={(e) => handleStringChange(i, e.target.value)}
                    />
                  </div>
                ))}
              </div>
              <p className="help-text">
                Use: x = muted, 0 = open, or fret-finger (e.g., "2-1" for fret 2, finger 1)
              </p>
            </div>

            <div style={{ marginTop: '20px', marginBottom: '20px' }}>
              <p style={{ marginBottom: '10px', color: '#888' }}>Preview:</p>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <ChordDiagram chord={newChord} />
              </div>
            </div>

            <div className="button-group">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleAddChord}>
                Add Chord
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
