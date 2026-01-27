import React, { useState, useEffect } from 'react'
import { Chord, Tag } from '../types'
import { useApi } from '../hooks/useApi'
import TagChip from './TagChip'

interface AddSongModalProps {
  onClose: () => void
  onAdd: () => void
}

export default function AddSongModal({ onClose, onAdd }: AddSongModalProps) {
  const [name, setName] = useState('')
  const [artist, setArtist] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedChordIds, setSelectedChordIds] = useState<number[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  const [chords, setChords] = useState<Chord[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#5b8bd4')
  const [loading, setLoading] = useState(false)
  const api = useApi()

  useEffect(() => {
    loadChordsAndTags()
  }, [])

  const loadChordsAndTags = async () => {
    try {
      const [chordsData, tagsData] = await Promise.all([
        api.get<Chord[]>('/api/chords'),
        api.get<Tag[]>('/api/tags'),
      ])
      setChords(chordsData)
      setTags(tagsData)
    } catch (err) {
      console.error('Failed to load chords/tags:', err)
    }
  }

  const handleAddTag = async () => {
    if (!newTagName.trim()) return
    try {
      const tag = await api.post<Tag>('/api/tags', { name: newTagName.trim(), color: newTagColor })
      setTags([...tags, tag])
      setSelectedTagIds([...selectedTagIds, tag.id])
      setNewTagName('')
    } catch (err) {
      console.error('Failed to add tag:', err)
    }
  }

  const toggleChord = (chordId: number) => {
    setSelectedChordIds((prev) =>
      prev.includes(chordId)
        ? prev.filter((id) => id !== chordId)
        : [...prev, chordId]
    )
  }

  const toggleTag = (tagId: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    )
  }

  const handleSubmit = async () => {
    if (!name.trim()) return
    setLoading(true)
    try {
      await api.post('/api/songs', {
        name: name.trim(),
        artist: artist.trim() || undefined,
        notes: notes.trim() || undefined,
        chord_ids: selectedChordIds,
        tag_ids: selectedTagIds,
      })
      onAdd()
      onClose()
    } catch (err) {
      console.error('Failed to add song:', err)
      alert('Failed to add song')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal add-song-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Add New Song</h2>

        <div className="form-group">
          <label>Song Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter song name"
          />
        </div>

        <div className="form-group">
          <label>Artist</label>
          <input
            type="text"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="Enter artist name"
          />
        </div>

        <div className="form-group">
          <label>Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes, lyrics, or instructions..."
            rows={3}
          />
        </div>

        <div className="form-group">
          <label>Select Chords</label>
          <div className="chord-selector">
            {chords.map((chord) => (
              <button
                key={chord.id}
                type="button"
                className={`chord-select-btn ${selectedChordIds.includes(chord.id) ? 'selected' : ''}`}
                onClick={() => toggleChord(chord.id)}
              >
                {chord.name}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Tags</label>
          <div className="tag-selector">
            {tags.map((tag) => (
              <TagChip
                key={tag.id}
                tag={tag}
                selected={selectedTagIds.includes(tag.id)}
                onClick={() => toggleTag(tag.id)}
              />
            ))}
          </div>
          <div className="add-tag-row">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="New tag name"
            />
            <input
              type="color"
              value={newTagColor}
              onChange={(e) => setNewTagColor(e.target.value)}
            />
            <button type="button" className="btn btn-secondary" onClick={handleAddTag}>
              Add Tag
            </button>
          </div>
        </div>

        <div className="button-group">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading || !name.trim()}>
            {loading ? 'Adding...' : 'Add Song'}
          </button>
        </div>
      </div>
    </div>
  )
}
