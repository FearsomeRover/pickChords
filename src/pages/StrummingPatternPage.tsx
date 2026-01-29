import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Song, StrummingPattern } from '../types'
import { useApi } from '../hooks/useApi'
import StrummingPatternEditor from '../components/StrummingPatternEditor'

export default function StrummingPatternPage() {
  const api = useApi()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [song, setSong] = useState<Song | null>(null)
  const [pattern, setPattern] = useState<StrummingPattern | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (id) {
      fetchSong()
    }
  }, [id])

  const fetchSong = async () => {
    try {
      setLoading(true)
      const data = await api.get<Song>(`/api/songs/${id}`)
      setSong(data)
      setPattern(data.strumming_pattern)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch song')
    } finally {
      setLoading(false)
    }
  }

  const handlePatternChange = (newPattern: StrummingPattern) => {
    setPattern(newPattern)
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!song || !pattern) return

    setSaving(true)
    try {
      await api.put(`/api/songs/${song.id}`, {
        name: song.name,
        artist: song.artist,
        notes: song.notes,
        chord_ids: song.chord_ids,
        tag_ids: song.tag_ids,
        strumming_pattern: pattern,
      })
      setHasChanges(false)
      navigate(`/songs/${song.id}`)
    } catch (err) {
      alert('Failed to save: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!song || !confirm('Remove strumming pattern from this song?')) return

    setSaving(true)
    try {
      await api.put(`/api/songs/${song.id}`, {
        name: song.name,
        artist: song.artist,
        notes: song.notes,
        chord_ids: song.chord_ids,
        tag_ids: song.tag_ids,
        strumming_pattern: null,
      })
      navigate(`/songs/${song.id}`)
    } catch (err) {
      alert('Failed to delete: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-10 text-light-gray">Loading...</div>
  }

  if (error || !song) {
    return (
      <div className="text-[#D64545] bg-[rgba(214,69,69,0.1)] border-2 border-[#D64545] rounded-lg text-center p-5">
        {error || 'Song not found'}
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
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
