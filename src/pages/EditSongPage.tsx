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
import { Chord, StrummingPattern } from '../types'
import { useAuth } from '../hooks/useAuth'
import {
  useSong,
  useChords,
  useUpdateSong,
  useDeleteSong,
} from '../hooks/useQueries'
import ChordDiagram from '../components/ChordDiagram'
import StrummingPatternEditor from '../components/StrummingPatternEditor'

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
      className="bg-cream rounded-lg p-4 text-center border-2 border-[#D4C9BC] transition-all duration-200 relative cursor-move hover:border-teal-green"
      {...attributes}
      {...listeners}
    >
      <button
        className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-off-white text-[#D64545] rounded-lg border-2 border-[#D4C9BC] transition-all duration-200 hover:border-[#D64545] cursor-pointer text-lg"
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        &times;
      </button>
      <h3 className="text-xl font-semibold text-teal-green mb-3">{chord.name}</h3>
      <div className="flex justify-center pointer-events-none">
        <ChordDiagram chord={chord} width={150} height={180} />
      </div>
    </div>
  )
}

function ChordCard({ chord }: { chord: Chord }) {
  return (
    <div className="bg-cream rounded-lg p-4 text-center border-2 border-teal-green shadow-lg">
      <h3 className="text-xl font-semibold text-teal-green mb-3">{chord.name}</h3>
      <div className="flex justify-center">
        <ChordDiagram chord={chord} width={150} height={180} />
      </div>
    </div>
  )
}

export default function EditSongPage() {
  const { user } = useAuth()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const songId = id ? parseInt(id, 10) : undefined

  const { data: song, isLoading, error } = useSong(songId)
  const { data: allChords = [] } = useChords()
  const updateSongMutation = useUpdateSong()
  const deleteSongMutation = useDeleteSong()

  // Local state for editing
  const [chordIds, setChordIds] = useState<number[]>([])
  const [chords, setChords] = useState<Chord[]>([])
  const [strummingPattern, setStrummingPattern] = useState<StrummingPattern | undefined>(undefined)
  const [hasChanges, setHasChanges] = useState(false)
  const [showChordPicker, setShowChordPicker] = useState(false)
  const [activeChord, setActiveChord] = useState<Chord | null>(null)
  const isInitialLoad = useRef(true)

  // Check if user can edit this song (owner or admin)
  const canEdit = user && song && (song.user_id === user.id || user.is_admin === true)

  // Sync state when song loads
  useEffect(() => {
    if (song) {
      isInitialLoad.current = true
      setChordIds(song.chord_ids || [])
      setChords(song.chords || [])
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

  const handleDeletePattern = () => {
    if (!confirm('Remove strumming pattern from this song?')) return
    setStrummingPattern(undefined)
    setHasChanges(true)
  }

  const handleSave = () => {
    if (!song) return

    updateSongMutation.mutate(
      {
        id: song.id,
        name: song.name,
        artist: song.artist,
        notes: song.notes,
        chord_ids: chordIds,
        tag_ids: song.tag_ids,
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

  if (isLoading) {
    return <div className="text-center py-10 text-light-gray">Loading...</div>
  }

  if (error || !song) {
    return (
      <div className="text-[#D64545] bg-[rgba(214,69,69,0.1)] border-2 border-[#D64545] rounded-lg text-center p-5">
        {error instanceof Error ? error.message : 'Song not found'}
        <button
          className="mt-4 px-5 py-2.5 text-base rounded-lg font-medium bg-deep-navy text-off-white transition-all duration-200 hover:bg-[#001a3d] border-0 cursor-pointer"
          onClick={() => navigate(-1)}
        >
          Go Back
        </button>
      </div>
    )
  }

  if (!canEdit) {
    return (
      <div className="text-[#D64545] bg-[rgba(214,69,69,0.1)] border-2 border-[#D64545] rounded-lg text-center p-5">
        You don't have permission to edit this song.
        <button
          className="mt-4 px-5 py-2.5 text-base rounded-lg font-medium bg-deep-navy text-off-white transition-all duration-200 hover:bg-[#001a3d] border-0 cursor-pointer"
          onClick={() => navigate(`/songs/${song.id}`)}
        >
          Go Back
        </button>
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
            &larr; Back to {song.name}
          </button>
          <h1 className="text-3xl font-bold text-deep-navy">Edit Song</h1>
          <p className="text-light-gray">{song.name} {song.artist && `- ${song.artist}`}</p>
        </div>
        <button
          className="px-4 py-2 text-base rounded-lg font-medium bg-off-white text-[#D64545] border-2 border-[#D4C9BC] transition-all duration-200 hover:border-[#D64545] cursor-pointer"
          onClick={handleDelete}
        >
          Delete Song
        </button>
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

      {/* Chords Section */}
      <div className="bg-off-white rounded-xl p-6 border-2 border-[#D4C9BC] mb-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-semibold text-deep-navy">Chords</h2>
          <button
            className="px-4 py-2 text-base rounded-lg font-medium bg-deep-navy text-off-white transition-all duration-200 hover:bg-[#001a3d] border-0 cursor-pointer"
            onClick={() => setShowChordPicker(!showChordPicker)}
          >
            {showChordPicker ? 'Done' : 'Add Chords'}
          </button>
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
            <button
              className="px-4 py-2 text-sm rounded-lg font-medium bg-off-white text-deep-navy border-2 border-[#D4C9BC] transition-all duration-200 hover:border-deep-navy cursor-pointer"
              onClick={() => navigate(`/songs/${song.id}`)}
            >
              Discard
            </button>
            <button
              className="px-5 py-2.5 text-base rounded-lg font-medium bg-deep-navy text-off-white transition-all duration-200 hover:bg-[#001a3d] border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSave}
              disabled={updateSongMutation.isPending}
            >
              {updateSongMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
