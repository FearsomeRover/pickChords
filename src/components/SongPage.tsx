import { useState, useEffect } from 'react'
import { Song, Chord } from '../types'
import { useApi } from '../hooks/useApi'
import ChordDiagram from './ChordDiagram'
import TagChip from './TagChip'

interface SongPageProps {
  song: Song
  onBack: () => void
  onDelete: () => void
  onUpdate: (song: Song) => void
  onFavorite?: () => void
  isFavorite?: boolean
}

export default function SongPage({ song, onBack, onDelete, onUpdate, onFavorite, isFavorite }: SongPageProps) {
  const api = useApi()
  const [chords, setChords] = useState<Chord[]>(song.chords || [])
  const [allChords, setAllChords] = useState<Chord[]>([])
  const [showChordPicker, setShowChordPicker] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)

  useEffect(() => {
    fetchAllChords()
  }, [])

  const fetchAllChords = async () => {
    try {
      const data = await api.get<Chord[]>('/api/chords')
      setAllChords(data)
    } catch (err) {
      console.error('Failed to fetch chords:', err)
    }
  }

  const hasChanges = () => {
    const originalIds = song.chords?.map(c => c.id) || []
    const currentIds = chords.map(c => c.id)
    return JSON.stringify(originalIds) !== JSON.stringify(currentIds)
  }

  const moveChord = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= chords.length) return
    const newChords = [...chords]
    const [moved] = newChords.splice(fromIndex, 1)
    newChords.splice(toIndex, 0, moved)
    setChords(newChords)
  }

  const removeChord = (index: number) => {
    const newChords = [...chords]
    newChords.splice(index, 1)
    setChords(newChords)
  }

  const addChord = (chord: Chord) => {
    setChords([...chords, chord])
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return
    moveChord(draggedIndex, index)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const saveChanges = async () => {
    setSaving(true)
    try {
      const newChordIds = chords.map(c => c.id)
      await api.put(`/api/songs/${song.id}`, {
        name: song.name,
        artist: song.artist,
        notes: song.notes,
        chord_ids: newChordIds,
        tag_ids: song.tag_ids,
      })
      onUpdate({ ...song, chords, chord_ids: newChordIds })
    } catch (err) {
      alert('Failed to save: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  // Get chords that aren't already in the song
  const availableChords = allChords.filter(
    chord => !chords.some(c => c.id === chord.id)
  )

  return (
    <div className="song-page">
      <div className="song-page-header">
        <button className="btn btn-secondary" onClick={onBack}>
          Back
        </button>
        <div className="song-page-actions">
          {onFavorite && (
            <button
              className={`favorite-btn large ${isFavorite ? 'active' : ''}`}
              onClick={onFavorite}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              {isFavorite ? '\u2605' : '\u2606'}
            </button>
          )}
          <button className="btn btn-secondary" onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>

      <div className="song-page-title">
        <h1>{song.name}</h1>
        {song.artist && <p className="song-artist">{song.artist}</p>}
      </div>

      {song.tags && song.tags.length > 0 && (
        <div className="song-tags" style={{ marginBottom: '24px' }}>
          {song.tags.map((tag) => (
            <TagChip key={tag.id} tag={tag} />
          ))}
        </div>
      )}

      {song.notes && (
        <div className="song-notes">
          <h4>Notes</h4>
          <p>{song.notes}</p>
        </div>
      )}

      <div className="song-chords-section">
        <div className="song-chords-header">
          <h4>Chords</h4>
          <div className="song-chords-header-actions">
            <div className="view-toggle">
              <button
                className={`view-toggle-btn ${!editMode ? 'active' : ''}`}
                onClick={() => setEditMode(false)}
              >
                View
              </button>
              <button
                className={`view-toggle-btn ${editMode ? 'active' : ''}`}
                onClick={() => setEditMode(true)}
              >
                Edit
              </button>
            </div>
            {editMode && (
              <button
                className="btn btn-primary"
                onClick={() => setShowChordPicker(!showChordPicker)}
              >
                {showChordPicker ? 'Done' : 'Add Chords'}
              </button>
            )}
          </div>
        </div>

        {editMode && showChordPicker && (
          <div className="chord-picker">
            <p className="chord-picker-label">Select chords to add:</p>
            {availableChords.length === 0 ? (
              <p className="help-text">All chords are already added to this song.</p>
            ) : (
              <div className="chord-picker-list">
                {availableChords.map((chord) => (
                  <button
                    key={chord.id}
                    className="chord-picker-item-simple"
                    onClick={() => addChord(chord)}
                  >
                    {chord.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {chords.length > 0 ? (
          editMode ? (
            <div className="song-chords-reorderable">
              {chords.map((chord, index) => (
                <div
                  key={`${chord.id}-${index}`}
                  className={`chord-card-draggable ${draggedIndex === index ? 'dragging' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  <div className="chord-card-drag-handle">
                    <span className="drag-icon">&#x2630;</span>
                  </div>
                  <div className="chord-card-content">
                    <h3>{chord.name}</h3>
                    <ChordDiagram chord={chord} width={140} height={170} />
                  </div>
                  <div className="chord-card-actions">
                    <div className="chord-card-reorder-buttons">
                      <button
                        className="reorder-btn"
                        onClick={() => moveChord(index, index - 1)}
                        disabled={index === 0}
                        title="Move up"
                      >
                        &#9650;
                      </button>
                      <button
                        className="reorder-btn"
                        onClick={() => moveChord(index, index + 1)}
                        disabled={index === chords.length - 1}
                        title="Move down"
                      >
                        &#9660;
                      </button>
                    </div>
                    <button
                      className="remove-btn"
                      onClick={() => removeChord(index)}
                      title="Remove chord"
                    >
                      &#x2715;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="song-chords-grid">
              {chords.map((chord, index) => (
                <div key={`${chord.id}-${index}`} className="chord-card">
                  <h3>{chord.name}</h3>
                  <ChordDiagram chord={chord} width={160} height={200} />
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="no-results">
            No chords added to this song yet.{editMode && " Click \"Add Chords\" to get started."}
          </div>
        )}

        {editMode && hasChanges() && (
          <div className="save-order-bar">
            <span>You have unsaved changes</span>
            <button className="btn btn-primary" onClick={saveChanges} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
