import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { StrummingPattern } from '../types'
import { useSong, useUpdateSong } from '../hooks/useQueries'
import StrummingPatternEditor from '../components/StrummingPatternEditor'

export default function StrummingPatternPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const songId = id ? parseInt(id, 10) : undefined

  const { data: song, isLoading, error } = useSong(songId)
  const updateSongMutation = useUpdateSong()

  const [pattern, setPattern] = useState<StrummingPattern | undefined>(undefined)
  const [hasChanges, setHasChanges] = useState(false)

  // Sync pattern state when song loads
  useEffect(() => {
    if (song) {
      setPattern(song.strumming_pattern)
    }
  }, [song])

  const handlePatternChange = (newPattern: StrummingPattern) => {
    setPattern(newPattern)
    setHasChanges(true)
  }

  const handleSave = () => {
    if (!song || !pattern) return

    updateSongMutation.mutate(
      {
        id: song.id,
        name: song.name,
        artist: song.artist,
        notes: song.notes,
        chord_ids: song.chord_ids,
        tag_ids: song.tag_ids,
        strumming_pattern: pattern,
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
    if (!song || !confirm('Remove strumming pattern from this song?')) return

    updateSongMutation.mutate(
      {
        id: song.id,
        name: song.name,
        artist: song.artist,
        notes: song.notes,
        chord_ids: song.chord_ids,
        tag_ids: song.tag_ids,
        strumming_pattern: null,
      },
      {
        onSuccess: () => navigate(`/songs/${song.id}`),
        onError: (err) => alert('Failed to delete: ' + (err instanceof Error ? err.message : 'Unknown error')),
      }
    )
  }

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
    <div className="max-w-[900px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <button
            className="text-light-gray hover:text-deep-navy transition-colors mb-2"
            onClick={() => navigate(`/songs/${song.id}`)}
          >
            &larr; Back to {song.name}
          </button>
          <h1 className="text-3xl font-bold text-deep-navy">Edit Strumming Pattern</h1>
          <p className="text-light-gray">{song.name} {song.artist && `- ${song.artist}`}</p>
        </div>
      </div>

      <StrummingPatternEditor
        pattern={pattern}
        onChange={handlePatternChange}
        onDelete={song.strumming_pattern ? handleDelete : undefined}
      />

      {/* Save bar */}
      {hasChanges && (
        <div className="flex justify-between items-center bg-mustard-yellow rounded-lg p-4 mt-5">
          <span className="text-deep-navy font-medium">You have unsaved changes</span>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 text-sm rounded-lg font-medium bg-off-white text-deep-navy border-2 border-[#D4C9BC] transition-all duration-200 hover:border-deep-navy cursor-pointer"
              onClick={() => navigate(`/songs/${song.id}`)}
            >
              Cancel
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
