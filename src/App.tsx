import { useState, useEffect, useCallback } from 'react'
import { Chord, Song, Tag, StringData } from './types'
import { useAuth } from './hooks/useAuth'
import { useApi } from './hooks/useApi'
import ChordDiagram from './components/ChordDiagram'
import AuthModal from './components/AuthModal'
import TabNav, { TabType } from './components/TabNav'
import SongCard from './components/SongCard'
import SongModal from './components/SongModal'
import AddSongModal from './components/AddSongModal'
import TagChip from './components/TagChip'

function App() {
  const { user, loading: authLoading, logout } = useAuth()
  const api = useApi()

  const [activeTab, setActiveTab] = useState<TabType>('chords')
  const [chords, setChords] = useState<Chord[]>([])
  const [songs, setSongs] = useState<Song[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null)

  // Modals
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showAddChordModal, setShowAddChordModal] = useState(false)
  const [showAddSongModal, setShowAddSongModal] = useState(false)
  const [selectedSong, setSelectedSong] = useState<Song | null>(null)

  // New chord form
  const [newChord, setNewChord] = useState<{
    name: string
    strings: StringData[]
  }>({
    name: '',
    strings: Array(6).fill({ fret: 0 }),
  })

  const fetchChords = useCallback(async (search = '') => {
    try {
      const url = search
        ? `/api/chords?search=${encodeURIComponent(search)}`
        : '/api/chords'
      const data = await api.get<Chord[]>(url)
      setChords(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch chords')
    }
  }, [api])

  const fetchSongs = useCallback(async (search = '', tagId: number | null = null, favorites = false) => {
    try {
      let url = '/api/songs?'
      const params: string[] = []
      if (search) params.push(`search=${encodeURIComponent(search)}`)
      if (tagId) params.push(`tag=${tagId}`)
      if (favorites) params.push('favorites=true')
      url += params.join('&')

      const data = await api.get<Song[]>(url)
      setSongs(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch songs')
    }
  }, [api])

  const fetchTags = useCallback(async () => {
    try {
      const data = await api.get<Tag[]>('/api/tags')
      setTags(data)
    } catch (err) {
      console.error('Failed to fetch tags:', err)
    }
  }, [api])

  useEffect(() => {
    if (!authLoading) {
      setLoading(true)
      Promise.all([fetchChords(), fetchTags()]).finally(() => setLoading(false))
    }
  }, [authLoading])

  // Debounced search for chords
  useEffect(() => {
    if (activeTab === 'chords') {
      const timer = setTimeout(() => fetchChords(searchTerm), 300)
      return () => clearTimeout(timer)
    }
  }, [searchTerm, activeTab])

  // Debounced search for songs
  useEffect(() => {
    if (activeTab === 'songs' || activeTab === 'favorites') {
      const timer = setTimeout(() => {
        fetchSongs(searchTerm, selectedTagId, activeTab === 'favorites')
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [searchTerm, selectedTagId, activeTab])

  const parseStringInput = (value: string): StringData => {
    const trimmed = value.trim().toLowerCase()
    if (trimmed === '' || trimmed === '0') return { fret: 0 }
    if (trimmed.includes('x')) return { fret: 'x' }

    const parts = trimmed.split('-')
    const fret = parseInt(parts[0], 10)
    if (isNaN(fret)) return { fret: 0 }

    if (parts.length > 1) {
      const finger = parseInt(parts[1], 10)
      return { fret, finger: isNaN(finger) ? undefined : finger }
    }
    return { fret }
  }

  const handleStringChange = (index: number, value: string) => {
    const newStrings = [...newChord.strings]
    newStrings[index] = parseStringInput(value)
    setNewChord({ ...newChord, strings: newStrings })
  }

  const getStringDisplayValue = (stringData: StringData): string => {
    if (stringData.fret === 'x') return 'x'
    if (stringData.fret === 0) return '0'
    if (stringData.finger) return `${stringData.fret}-${stringData.finger}`
    return String(stringData.fret)
  }

  const handleAddChord = async () => {
    if (!newChord.name.trim()) return

    try {
      await api.post('/api/chords', {
        name: newChord.name.trim(),
        strings: newChord.strings,
      })

      setNewChord({
        name: '',
        strings: Array(6).fill({ fret: 0 }),
      })
      setShowAddChordModal(false)
      fetchChords(searchTerm)
    } catch (err) {
      alert('Failed to add chord: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  const handleDeleteChord = async (id: number) => {
    try {
      await api.del(`/api/chords/${id}`)
      fetchChords(searchTerm)
    } catch (err) {
      alert('Failed to delete chord: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  const handleDeleteSong = async (id: number) => {
    try {
      await api.del(`/api/songs/${id}`)
      setSelectedSong(null)
      fetchSongs(searchTerm, selectedTagId, activeTab === 'favorites')
    } catch (err) {
      alert('Failed to delete song: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  const handleToggleFavorite = async (song: Song) => {
    if (!user) {
      setShowAuthModal(true)
      return
    }

    try {
      if (song.is_favorite) {
        await api.del(`/api/songs/${song.id}/favorite`)
      } else {
        await api.post(`/api/songs/${song.id}/favorite`, {})
      }
      fetchSongs(searchTerm, selectedTagId, activeTab === 'favorites')
      if (selectedSong?.id === song.id) {
        setSelectedSong({ ...selectedSong, is_favorite: !selectedSong.is_favorite })
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err)
    }
  }

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    setSearchTerm('')
    setSelectedTagId(null)
  }

  if (authLoading || loading) {
    return (
      <div className="app">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  return (
    <div className="app">
      <header>
        <div className="header-content">
          <div>
            <h1>Pick Chords</h1>
            <p>Your personal guitar chord library</p>
          </div>
          <div className="auth-section">
            {user ? (
              <>
                <span className="username">{user.username}</span>
                <button className="btn btn-secondary" onClick={logout}>
                  Logout
                </button>
              </>
            ) : (
              <button className="btn btn-primary" onClick={() => setShowAuthModal(true)}>
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      <TabNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        showFavorites={!!user}
      />

      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder={activeTab === 'chords' ? 'Search chords...' : 'Search songs...'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {(activeTab === 'songs' || activeTab === 'favorites') && tags.length > 0 && (
        <div className="tag-filter">
          <span className="filter-label">Filter by tag:</span>
          <button
            className={`filter-btn ${selectedTagId === null ? 'active' : ''}`}
            onClick={() => setSelectedTagId(null)}
          >
            All
          </button>
          {tags.map((tag) => (
            <TagChip
              key={tag.id}
              tag={tag}
              selected={selectedTagId === tag.id}
              onClick={() => setSelectedTagId(selectedTagId === tag.id ? null : tag.id)}
            />
          ))}
        </div>
      )}

      {error && (
        <div className="error-message">Error: {error}</div>
      )}

      {activeTab === 'chords' && (
        <>
          {chords.length === 0 ? (
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
        </>
      )}

      {(activeTab === 'songs' || activeTab === 'favorites') && (
        <>
          {songs.length === 0 ? (
            <div className="no-results">
              {activeTab === 'favorites'
                ? 'No favorite songs yet. Star some songs to add them here!'
                : 'No songs found. Add some songs to get started!'}
            </div>
          ) : (
            <div className="songs-grid">
              {songs.map((song) => (
                <SongCard
                  key={song.id}
                  song={song}
                  onClick={() => setSelectedSong(song)}
                  onFavorite={user ? () => handleToggleFavorite(song) : undefined}
                  isFavorite={song.is_favorite}
                />
              ))}
            </div>
          )}
        </>
      )}

      <button
        className="add-chord-btn"
        onClick={() => activeTab === 'chords' ? setShowAddChordModal(true) : setShowAddSongModal(true)}
      >
        +
      </button>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

      {showAddChordModal && (
        <div className="modal-overlay" onClick={() => setShowAddChordModal(false)}>
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
              <button className="btn btn-secondary" onClick={() => setShowAddChordModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleAddChord}>
                Add Chord
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddSongModal && (
        <AddSongModal
          onClose={() => setShowAddSongModal(false)}
          onAdd={() => fetchSongs(searchTerm, selectedTagId, activeTab === 'favorites')}
        />
      )}

      {selectedSong && (
        <SongModal
          song={selectedSong}
          onClose={() => setSelectedSong(null)}
          onDelete={() => handleDeleteSong(selectedSong.id)}
          onFavorite={user ? () => handleToggleFavorite(selectedSong) : undefined}
          isFavorite={selectedSong.is_favorite}
        />
      )}
    </div>
  )
}

export default App
