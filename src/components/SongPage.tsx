import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Chord, ProgressStatus } from '../types'
import { useAuth } from '../hooks/useAuth'
import {
  useSong,
  useChords,
  useReorderChords,
  useAddChordToSong,
  useRemoveChordFromSong,
  useDeleteSong,
  useToggleFavorite,
  useProgressItem,
  useAddToProgress,
  useRemoveFromProgress,
} from '../hooks/useQueries'
import ChordDiagram from './ChordDiagram'
import TagChip from './TagChip'
import StrummingPatternDisplay from './StrummingPatternDisplay'

export default function SongPage() {
  const { user } = useAuth()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const songId = id ? parseInt(id, 10) : undefined

  const { data: song, isLoading, error } = useSong(songId)
  const { data: allChords = [] } = useChords()

  const reorderMutation = useReorderChords()
  const addChordMutation = useAddChordToSong()
  const removeChordMutation = useRemoveChordFromSong()
  const deleteSongMutation = useDeleteSong()
  const toggleFavoriteMutation = useToggleFavorite()

  // Progress tracking
  const { data: progressItem } = useProgressItem(songId)
  const addToProgressMutation = useAddToProgress()
  const removeFromProgressMutation = useRemoveFromProgress()

  const [showChordPicker, setShowChordPicker] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null)
  const [showProgressMenu, setShowProgressMenu] = useState(false)

  // Check if user can edit this song (owner or admin)
  const canEdit = user && song && (song.user_id === user.id || user.is_admin === true)

  useEffect(() => {
    const handleClickOutside = () => {
      if (openMenuIndex !== null) {
        setOpenMenuIndex(null)
      }
      if (showProgressMenu) {
        setShowProgressMenu(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [openMenuIndex, showProgressMenu])

  const chords = song?.chords || []

  const moveChord = (fromIndex: number, toIndex: number) => {
    if (!song || !canEdit || toIndex < 0 || toIndex >= chords.length) return

    const newChords = [...chords]
    const [moved] = newChords.splice(fromIndex, 1)
    newChords.splice(toIndex, 0, moved)
    const newChordIds = newChords.map(c => c.id)

    // Optimistic update - happens immediately
    reorderMutation.mutate({
      songId: song.id,
      song,
      newChordIds,
    })
  }

  const removeChord = (index: number) => {
    if (!song || !canEdit) return

    // Optimistic update
    removeChordMutation.mutate({
      songId: song.id,
      song,
      chordIndex: index,
    })
  }

  const addChord = (chord: Chord) => {
    if (!song || !canEdit) return

    // Optimistic update
    addChordMutation.mutate({
      songId: song.id,
      song,
      chord,
    })
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!canEdit) return
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (!canEdit) return
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return
    moveChord(draggedIndex, index)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const handleDelete = () => {
    if (!song || !canEdit || !confirm('Delete this song?')) return
    deleteSongMutation.mutate(song.id, {
      onSuccess: () => navigate(-1),
      onError: (err) => alert('Failed to delete song: ' + (err instanceof Error ? err.message : 'Unknown error')),
    })
  }

  const handleToggleFavorite = () => {
    if (!song || !user) return
    toggleFavoriteMutation.mutate({
      songId: song.id,
      isFavorite: !!song.is_favorite,
    })
  }

  const handleAddToProgress = (status: ProgressStatus) => {
    if (!song || !user) return
    addToProgressMutation.mutate({
      songId: song.id,
      status,
    })
    setShowProgressMenu(false)
  }

  const handleRemoveFromProgress = () => {
    if (!song || !user) return
    removeFromProgressMutation.mutate(song.id)
  }

  const progressStatusLabels: Record<ProgressStatus, string> = {
    want_to_learn: 'Want to Learn',
    learning: 'Learning',
    practicing: 'Practicing',
    mastered: 'Mastered',
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

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-4xl font-bold text-deep-navy mb-2">{song.name}</h1>
          {song.artist && <p className="text-light-gray text-lg">{song.artist}</p>}
        </div>
        <div className="flex gap-2 items-center">
          {user && (
            <button
              className={`bg-transparent border-0 text-3xl cursor-pointer p-1 transition-all duration-200 hover:scale-110 ${
                song.is_favorite ? 'text-mustard-yellow' : 'text-light-gray'
              }`}
              onClick={handleToggleFavorite}
              title={song.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              {song.is_favorite ? '\u2605' : '\u2606'}
            </button>
          )}
          {user && (
            <div className="relative">
              {progressItem ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-light-gray">
                    {progressStatusLabels[progressItem.status]}
                  </span>
                  <button
                    className="px-3 py-1.5 text-sm rounded-lg font-medium bg-cream text-deep-navy border-2 border-[#D4C9BC] transition-all duration-200 hover:border-deep-navy cursor-pointer"
                    onClick={handleRemoveFromProgress}
                    title="Remove from progress board"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <button
                    className="px-3 py-1.5 text-sm rounded-lg font-medium bg-teal-green text-off-white transition-all duration-200 hover:opacity-80 border-0 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowProgressMenu(!showProgressMenu)
                    }}
                  >
                    + Add to Progress
                  </button>
                  {showProgressMenu && (
                    <div className="absolute right-0 top-10 bg-off-white rounded-lg shadow-lg border-2 border-[#D4C9BC] z-10 min-w-[160px]">
                      {(Object.keys(progressStatusLabels) as ProgressStatus[]).map((status) => (
                        <button
                          key={status}
                          className="w-full px-4 py-2 text-left text-sm text-deep-navy hover:bg-cream transition-all duration-200 border-0 cursor-pointer"
                          onClick={() => handleAddToProgress(status)}
                        >
                          {progressStatusLabels[status]}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          {canEdit && (
            <button
              className="px-4 py-2 text-base rounded-lg font-medium bg-off-white text-deep-navy border-2 border-[#D4C9BC] transition-all duration-200 hover:border-deep-navy cursor-pointer"
              onClick={handleDelete}
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {song.tags && song.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-6">
          {song.tags.map((tag) => (
            <TagChip key={tag.id} tag={tag} />
          ))}
        </div>
      )}

      {song.notes && (
        <div className="bg-off-white rounded-xl p-5 border-2 border-[#D4C9BC] mb-6">
          <h4 className="text-lg font-semibold text-deep-navy mb-2">Notes</h4>
          <p className="text-deep-navy">{song.notes}</p>
        </div>
      )}

      {/* Strumming Pattern Section */}
      {song.strumming_pattern ? (
        <div className="mb-6">
          <StrummingPatternDisplay
            pattern={song.strumming_pattern}
            onEdit={canEdit ? () => navigate(`/songs/${song.id}/strumming`) : undefined}
          />
        </div>
      ) : canEdit ? (
        <div className="bg-off-white rounded-xl p-5 border-2 border-[#D4C9BC] mb-6 flex justify-between items-center">
          <span className="text-light-gray">No strumming pattern set</span>
          <button
            className="px-4 py-2 text-sm rounded-lg font-medium bg-deep-navy text-off-white transition-all duration-200 hover:bg-[#001a3d] border-0 cursor-pointer"
            onClick={() => navigate(`/songs/${song.id}/strumming`)}
          >
            Add Strumming Pattern
          </button>
        </div>
      ) : null}

      <div className="bg-off-white rounded-xl p-6 border-2 border-[#D4C9BC]">
        <div className="flex justify-between items-center mb-5">
          <h4 className="text-lg font-semibold text-deep-navy">Chords</h4>
          {canEdit && (
            <button
              className="px-4 py-2 text-base rounded-lg font-medium bg-deep-navy text-off-white transition-all duration-200 hover:bg-[#001a3d] border-0 cursor-pointer"
              onClick={() => setShowChordPicker(!showChordPicker)}
            >
              {showChordPicker ? 'Done' : 'Add Chords'}
            </button>
          )}
        </div>

        {showChordPicker && canEdit && (
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
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
            {chords.map((chord, index) => (
              <div
                key={`${chord.id}-${index}`}
                className={`bg-cream rounded-lg p-4 text-center border-2 border-[#D4C9BC] transition-all duration-200 relative ${canEdit ? 'cursor-move hover:border-teal-green' : ''}`}
                draggable={!!canEdit}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
              >
                {canEdit && (
                  <div className="absolute top-2 right-2">
                    <button
                      className="w-8 h-8 flex items-center justify-center bg-off-white text-deep-navy rounded-lg border-2 border-[#D4C9BC] transition-all duration-200 hover:border-deep-navy cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenMenuIndex(openMenuIndex === index ? null : index)
                      }}
                    >
                      &#x22EE;
                    </button>
                    {openMenuIndex === index && (
                      <div className="absolute right-0 top-10 bg-off-white rounded-lg shadow-lg border-2 border-[#D4C9BC] z-10 min-w-[140px]">
                        <button
                          className="w-full px-4 py-2 text-left text-sm text-deep-navy hover:bg-cream transition-all duration-200 border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => {
                            moveChord(index, index - 1)
                            setOpenMenuIndex(null)
                          }}
                          disabled={index === 0}
                        >
                          Move Up
                        </button>
                        <button
                          className="w-full px-4 py-2 text-left text-sm text-deep-navy hover:bg-cream transition-all duration-200 border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => {
                            moveChord(index, index + 1)
                            setOpenMenuIndex(null)
                          }}
                          disabled={index === chords.length - 1}
                        >
                          Move Down
                        </button>
                        <button
                          className="w-full px-4 py-2 text-left text-sm text-[#D64545] hover:bg-cream transition-all duration-200 border-0 cursor-pointer"
                          onClick={() => {
                            removeChord(index)
                            setOpenMenuIndex(null)
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
                <h3 className="text-xl font-semibold text-teal-green mb-3">{chord.name}</h3>
                <div className="flex justify-center">
                  <ChordDiagram chord={chord} width={180} height={220} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-light-gray text-lg py-6">
            No chords added to this song yet.{canEdit && ' Click "Add Chords" to get started.'}
          </div>
        )}
      </div>
    </div>
  )
}
