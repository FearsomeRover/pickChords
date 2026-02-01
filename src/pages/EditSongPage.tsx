import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, X } from 'lucide-react'
import { Chord, StrummingPattern, SongTablature } from '../types'
import { useAuth } from '../hooks/useAuth'
import {
  useSong,
  useChords,
  useTags,
  useUpdateSong,
  useDeleteSong,
} from '../hooks/useQueries'
import ChordDiagram from '../components/ChordDiagram'
import StrummingPatternEditor from '../components/StrummingPatternEditor'
import TabEditor from '../components/TabEditor'
import TagChip from '../components/TagChip'
import { FormInput, FormTextarea, Button, ErrorCard, LoadingSpinner } from '../components/ui'

interface SortableChordProps {
  chord: Chord
  index: number
  onRemove: () => void
}

function SortableChord({ chord, index, onRemove }: SortableChordProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `chord-${chord.id}-${index}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="transition-all duration-200 cursor-move"
      {...attributes}
      {...listeners}
    >
      <ChordDiagram chord={chord} width={150} height={180} onRemove={onRemove} />
    </div>
  )
}

function ChordCard({ chord }: { chord: Chord }) {
  return (
    <ChordDiagram chord={chord} width={150} height={180} />
  )
}

export default function EditSongPage() {
  const { user } = useAuth()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const songId = id ? parseInt(id, 10) : undefined

  const { data: song, isLoading, error } = useSong(songId)
  const { data: allChords = [] } = useChords()
  const { data: allTags = [] } = useTags()
  const updateSongMutation = useUpdateSong()
  const deleteSongMutation = useDeleteSong()

  // Local state for editing
  const [name, setName] = useState('')
  const [artist, setArtist] = useState('')
  const [notes, setNotes] = useState('')
  const [capo, setCapo] = useState<number | undefined>(undefined)
  const [links, setLinks] = useState<string[]>([])
  const [newLink, setNewLink] = useState('')
  const [tablature, setTablature] = useState<SongTablature | undefined>(undefined)
  const [chordIds, setChordIds] = useState<number[]>([])
  const [chords, setChords] = useState<Chord[]>([])
  const [tagIds, setTagIds] = useState<number[]>([])
  const [strummingPattern, setStrummingPattern] = useState<StrummingPattern | undefined>(undefined)
  const [hasChanges, setHasChanges] = useState(false)
  const [showChordPicker, setShowChordPicker] = useState(false)
  const [showTagPicker, setShowTagPicker] = useState(false)
  const [activeChord, setActiveChord] = useState<Chord | null>(null)
  const isInitialLoad = useRef(true)

  // Check if user can edit this song (owner or admin)
  const canEdit = user && song && (song.user_id === user.id || user.is_admin === true)

  // Sync state when song loads
  useEffect(() => {
    if (song) {
      isInitialLoad.current = true
      setName(song.name || '')
      setArtist(song.artist || '')
      setNotes(song.notes || '')
      setCapo(song.capo)
      setLinks(song.links || [])
      setTablature(song.tablature)
      setChordIds(song.chord_ids || [])
      setChords(song.chords || [])
      setTagIds(song.tag_ids || [])
      setStrummingPattern(song.strumming_pattern)
      // Allow a brief moment for StrummingPatternEditor to initialize
      setTimeout(() => {
        isInitialLoad.current = false
      }, 100)
    }
  }, [song])

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string
    const index = parseInt(id.split('-').pop() || '0')
    setActiveChord(chords[index] || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveChord(null)

    if (!over || active.id === over.id) return

    const oldIndex = parseInt((active.id as string).split('-').pop() || '0')
    const newIndex = parseInt((over.id as string).split('-').pop() || '0')

    const newChords = arrayMove(chords, oldIndex, newIndex)
    const newChordIds = arrayMove(chordIds, oldIndex, newIndex)

    setChords(newChords)
    setChordIds(newChordIds)
    setHasChanges(true)
  }

  const handleAddChord = (chord: Chord) => {
    setChordIds([...chordIds, chord.id])
    setChords([...chords, chord])
    setHasChanges(true)
  }

  const handleRemoveChord = (index: number) => {
    setChordIds(chordIds.filter((_, i) => i !== index))
    setChords(chords.filter((_, i) => i !== index))
    setHasChanges(true)
  }

  const handlePatternChange = (pattern: StrummingPattern) => {
    setStrummingPattern(pattern)
    if (!isInitialLoad.current) {
      setHasChanges(true)
    }
  }

  const handleToggleTag = (tagId: number) => {
    if (tagIds.includes(tagId)) {
      setTagIds(tagIds.filter(id => id !== tagId))
    } else {
      setTagIds([...tagIds, tagId])
    }
    setHasChanges(true)
  }

  const handleRemoveTag = (tagId: number) => {
    setTagIds(tagIds.filter(id => id !== tagId))
    setHasChanges(true)
  }

  const handleDeletePattern = () => {
    if (!confirm('Remove strumming pattern from this song?')) return
    setStrummingPattern(undefined)
    setHasChanges(true)
  }

  const handleAddLink = () => {
    if (!newLink.trim()) return
    try {
      // Validate URL
      new URL(newLink.trim())
      setLinks([...links, newLink.trim()])
      setNewLink('')
      setHasChanges(true)
    } catch {
      alert('Please enter a valid URL')
    }
  }

  const handleRemoveLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index))
    setHasChanges(true)
  }

  const handleTablatureChange = (newTablature: SongTablature | undefined) => {
    setTablature(newTablature)
    if (!isInitialLoad.current) {
      setHasChanges(true)
    }
  }

  const handleSave = () => {
    if (!song || !name.trim()) return

    updateSongMutation.mutate(
      {
        id: song.id,
        name: name.trim(),
        artist: artist.trim() || undefined,
        notes: notes.trim() || undefined,
        capo: capo,
        links: links,
        tablature: tablature,
        chord_ids: chordIds,
        tag_ids: tagIds,
        strumming_pattern: strummingPattern || null,
      },
      {
        onSuccess: () => {
          setHasChanges(false)
          navigate(`/songs/${song.id}`)
        },
        onError: (err) => alert('Failed to save: ' + (err instanceof Error ? err.message : 'Unknown error')),
      }
    )
  }

  const handleDelete = () => {
    if (!song || !confirm('Delete this song? This cannot be undone.')) return
    deleteSongMutation.mutate(song.id, {
      onSuccess: () => navigate('/songs'),
      onError: (err) => alert('Failed to delete song: ' + (err instanceof Error ? err.message : 'Unknown error')),
    })
  }

  // Get chords that aren't already in the song
  const availableChords = allChords.filter(
    chord => !chords.some(c => c.id === chord.id)
  )

  // Get selected tags
  const selectedTags = allTags.filter(tag => tagIds.includes(tag.id))
  const availableTags = allTags.filter(tag => !tagIds.includes(tag.id))

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error || !song) {
    return (
      <div className="text-center">
        <ErrorCard message={error instanceof Error ? error.message : 'Song not found'} />
        <Button className="mt-4" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    )
  }

  if (!canEdit) {
    return (
      <div className="text-center">
        <ErrorCard message="You don't have permission to edit this song." />
        <Button className="mt-4" onClick={() => navigate(`/songs/${song.id}`)}>Go Back</Button>
      </div>
    )
  }

  return (
    <div className="max-w-[1000px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <button
            className="text-light-gray hover:text-deep-navy transition-colors mb-2"
            onClick={() => navigate(`/songs/${song.id}`)}
          >
            &larr; Back to song
          </button>
          <h1 className="text-3xl font-bold text-deep-navy">Edit Song</h1>
        </div>
        <Button variant="danger" onClick={handleDelete}>Delete Song</Button>
      </div>

      {/* Song Details Section */}
      <div className="bg-off-white rounded-xl p-6 border-2 border-[#D4C9BC] mb-6">
        <h2 className="text-xl font-semibold text-deep-navy mb-4">Song Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormInput
            label="Song Name"
            required
            value={name}
            onChange={(e) => { setName(e.target.value); setHasChanges(true) }}
            placeholder="Enter song name"
          />
          <FormInput
            label="Artist"
            value={artist}
            onChange={(e) => { setArtist(e.target.value); setHasChanges(true) }}
            placeholder="Enter artist name"
          />
          <div>
            <label className="block text-sm font-medium text-deep-navy mb-1">Capo Position</label>
            <select
              className="w-full px-4 py-3 text-base border-2 border-[#D4C9BC] rounded-lg bg-off-white text-deep-navy outline-none transition-all duration-200 focus:border-deep-navy"
              value={capo || ''}
              onChange={(e) => {
                const val = e.target.value ? parseInt(e.target.value, 10) : undefined
                setCapo(val)
                setHasChanges(true)
              }}
            >
              <option value="">No capo</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((fret) => (
                <option key={fret} value={fret}>
                  {fret}{fret === 1 ? 'st' : fret === 2 ? 'nd' : fret === 3 ? 'rd' : 'th'} fret
                </option>
              ))}
            </select>
          </div>
        </div>

        <FormTextarea
          label="Notes / Description"
          value={notes}
          onChange={(e) => { setNotes(e.target.value); setHasChanges(true) }}
          placeholder="Add notes, lyrics, or instructions..."
          rows={4}
        />

        {/* Links Section */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-deep-navy mb-2">
            External Links
            <span className="text-light-gray font-normal ml-2">(Songsterr, Ultimate Guitar, YouTube)</span>
          </label>

          {/* Current links */}
          {links.length > 0 && (
            <div className="space-y-2 mb-3">
              {links.map((link, index) => (
                <div key={index} className="flex items-center gap-2 bg-cream rounded-lg px-3 py-2">
                  <span className="flex-1 text-sm text-deep-navy truncate">{link}</span>
                  <button
                    type="button"
                    className="p-1 text-light-gray hover:text-coral transition-colors"
                    onClick={() => handleRemoveLink(index)}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add new link */}
          <div className="flex gap-2">
            <input
              type="url"
              className="flex-1 px-4 py-2 text-base border-2 border-[#D4C9BC] rounded-lg bg-off-white text-deep-navy outline-none transition-all duration-200 focus:border-deep-navy placeholder:text-light-gray"
              placeholder="Paste a link here..."
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddLink()
                }
              }}
            />
            <button
              type="button"
              className="px-3 py-2 bg-teal-green text-off-white rounded-lg transition-all duration-200 hover:opacity-80 flex items-center gap-1"
              onClick={handleAddLink}
            >
              <Plus size={18} />
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Tags Section */}
      <div className="bg-off-white rounded-xl p-6 border-2 border-[#D4C9BC] mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-deep-navy">Tags</h2>
          <Button
            variant={showTagPicker ? 'primary' : 'secondary'}
            onClick={() => setShowTagPicker(!showTagPicker)}
            className="text-sm px-4 py-2"
          >
            {showTagPicker ? 'Done' : 'Edit Tags'}
          </Button>
        </div>

        {/* Current tags */}
        {selectedTags.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedTags.map(tag => (
              <TagChip
                key={tag.id}
                tag={tag}
                selected
                onRemove={() => handleRemoveTag(tag.id)}
              />
            ))}
          </div>
        ) : (
          <p className="text-light-gray text-sm mb-4">No tags added to this song yet.</p>
        )}

        {/* Tag picker */}
        {showTagPicker && availableTags.length > 0 && (
          <div className="bg-cream rounded-lg p-4 border-2 border-[#D4C9BC]">
            <p className="text-deep-navy font-medium mb-3 text-sm">Click to add tags:</p>
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => (
                <TagChip
                  key={tag.id}
                  tag={tag}
                  onClick={() => handleToggleTag(tag.id)}
                />
              ))}
            </div>
          </div>
        )}
        {showTagPicker && availableTags.length === 0 && (
          <p className="text-light-gray text-sm">All tags are already added to this song.</p>
        )}
      </div>

      {/* Strumming Pattern Section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-deep-navy mb-4">Strumming Pattern</h2>
        <StrummingPatternEditor
          pattern={strummingPattern}
          onChange={handlePatternChange}
          onDelete={strummingPattern ? handleDeletePattern : undefined}
        />
      </div>

      {/* Tablature Section */}
      <div className="bg-off-white rounded-xl p-6 border-2 border-[#D4C9BC] mb-6">
        <h2 className="text-xl font-semibold text-deep-navy mb-4">Tablature</h2>
        <TabEditor
          tablature={tablature}
          onChange={handleTablatureChange}
        />
      </div>

      {/* Chords Section */}
      <div className="bg-off-white rounded-xl p-6 border-2 border-[#D4C9BC] mb-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-semibold text-deep-navy">Chords</h2>
          <Button
            variant={showChordPicker ? 'primary' : 'secondary'}
            onClick={() => setShowChordPicker(!showChordPicker)}
            className="text-sm px-4 py-2"
          >
            {showChordPicker ? 'Done' : 'Add Chords'}
          </Button>
        </div>

        <p className="text-sm text-light-gray mb-4">
          Drag and drop to reorder chords. Click the &times; to remove a chord.
        </p>

        {/* Chord picker */}
        {showChordPicker && (
          <div className="bg-cream rounded-lg p-4 mb-5 border-2 border-[#D4C9BC]">
            <p className="text-deep-navy font-medium mb-3">Select chords to add:</p>
            {availableChords.length === 0 ? (
              <p className="text-light-gray text-sm">All chords are already added to this song.</p>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-2">
                {availableChords.map((chord) => (
                  <button
                    key={chord.id}
                    className="px-3 py-2 text-sm font-medium bg-teal-green text-off-white rounded-lg transition-all duration-200 hover:opacity-80 border-0 cursor-pointer"
                    onClick={() => handleAddChord(chord)}
                  >
                    {chord.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Chords grid with drag and drop */}
        {chords.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={chords.map((c, i) => `chord-${c.id}-${i}`)}
              strategy={horizontalListSortingStrategy}
            >
              <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
                {chords.map((chord, index) => (
                  <SortableChord
                    key={`${chord.id}-${index}`}
                    chord={chord}
                    index={index}
                    onRemove={() => handleRemoveChord(index)}
                  />
                ))}
              </div>
            </SortableContext>

            <DragOverlay dropAnimation={null}>
              {activeChord && <ChordCard chord={activeChord} />}
            </DragOverlay>
          </DndContext>
        ) : (
          <div className="text-center text-light-gray text-lg py-6">
            No chords added to this song yet. Click "Add Chords" to get started.
          </div>
        )}
      </div>

      {/* Save bar */}
      {hasChanges && (
        <div className="flex justify-between items-center bg-mustard-yellow rounded-lg p-4 sticky bottom-4">
          <span className="text-deep-navy font-medium">You have unsaved changes</span>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate(`/songs/${song.id}`)}>
              Discard
            </Button>
            <Button
              onClick={handleSave}
              loading={updateSongMutation.isPending}
              disabled={!name.trim()}
            >
              Save Changes
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
