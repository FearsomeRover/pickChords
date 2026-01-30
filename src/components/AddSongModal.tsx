import { useState, useEffect } from 'react'
import { Chord, Tag } from '../types'
import { useApi } from '../hooks/useApi'
import TagChip from './TagChip'
import { Modal, ModalFooter, FormInput, FormTextarea, Button } from './ui'

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
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Add New Song"
      size="lg"
    >
      <FormInput
        label="Song Name"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter song name"
      />

      <FormInput
        label="Artist"
        value={artist}
        onChange={(e) => setArtist(e.target.value)}
        placeholder="Enter artist name"
      />

      <FormTextarea
        label="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add notes, lyrics, or instructions..."
        rows={3}
      />

      <div className="mb-5">
        <label className="block mb-2 font-medium text-deep-navy">Select Chords</label>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-2 max-h-[200px] overflow-y-auto p-2 bg-cream rounded-lg border-2 border-[#D4C9BC]">
          {chords.map((chord) => (
            <button
              key={chord.id}
              type="button"
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 border-2 cursor-pointer ${
                selectedChordIds.includes(chord.id)
                  ? 'bg-teal-green text-off-white border-teal-green'
                  : 'bg-off-white text-deep-navy border-[#D4C9BC] hover:border-teal-green'
              }`}
              onClick={() => toggleChord(chord.id)}
            >
              {chord.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5">
        <label className="block mb-2 font-medium text-deep-navy">Tags</label>
        <div className="flex flex-wrap gap-1.5 mb-3 p-2 bg-cream rounded-lg border-2 border-[#D4C9BC] min-h-[48px]">
          {tags.map((tag) => (
            <TagChip
              key={tag.id}
              tag={tag}
              selected={selectedTagIds.includes(tag.id)}
              onClick={() => toggleTag(tag.id)}
            />
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="New tag name"
            className="flex-1 px-3.5 py-2 text-sm border-2 border-[#D4C9BC] rounded-lg bg-off-white text-deep-navy outline-none focus:border-deep-navy focus:shadow-[0_0_0_3px_rgba(0,22,45,0.1)] placeholder:text-light-gray"
          />
          <input
            type="color"
            value={newTagColor}
            onChange={(e) => setNewTagColor(e.target.value)}
            className="w-12 h-10 border-2 border-[#D4C9BC] rounded-lg cursor-pointer"
          />
          <Button variant="secondary" onClick={handleAddTag} className="text-sm px-4 py-2">
            Add Tag
          </Button>
        </div>
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} loading={loading} disabled={!name.trim()}>
          Add Song
        </Button>
      </ModalFooter>
    </Modal>
  )
}
