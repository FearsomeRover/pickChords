import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, Navigate, useNavigate } from 'react-router-dom'
import { Song, Tag } from '../types'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../hooks/useAuth'
import SongCard from '../components/SongCard'
import TagChip from '../components/TagChip'

function FavoritesPage() {
  const api = useApi()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const searchTerm = searchParams.get('search') || ''
  const tagIdParam = searchParams.get('tag')
  const selectedTagId = tagIdParam ? parseInt(tagIdParam, 10) : null

  const [songs, setSongs] = useState<Song[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Redirect if not logged in
  if (!user) {
    return <Navigate to="/songs" replace />
  }

  const fetchSongs = useCallback(async (search = '', tagId: number | null = null) => {
    try {
      setLoading(true)
      let url = '/api/songs?favorites=true'
      const params: string[] = []
      if (search) params.push(`search=${encodeURIComponent(search)}`)
      if (tagId) params.push(`tag=${tagId}`)
      if (params.length > 0) {
        url += '&' + params.join('&')
      }

      const data = await api.get<Song[]>(url)
      setSongs(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch favorites')
    } finally {
      setLoading(false)
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

  // Fetch songs and tags on mount
  useEffect(() => {
    Promise.all([fetchSongs(searchTerm, selectedTagId), fetchTags()])
  }, [])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => fetchSongs(searchTerm, selectedTagId), 300)
    return () => clearTimeout(timer)
  }, [searchTerm, selectedTagId, fetchSongs])

  const handleToggleFavorite = async (song: Song) => {
    try {
      if (song.is_favorite) {
        await api.del(`/api/songs/${song.id}/favorite`)
      } else {
        await api.post(`/api/songs/${song.id}/favorite`, {})
      }
      fetchSongs(searchTerm, selectedTagId)
    } catch (err) {
      console.error('Failed to toggle favorite:', err)
    }
  }

  const handleSearchChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams)
    if (value) {
      newParams.set('search', value)
    } else {
      newParams.delete('search')
    }
    setSearchParams(newParams)
  }

  const handleTagSelect = (tagId: number | null) => {
    const newParams = new URLSearchParams(searchParams)
    if (tagId) {
      newParams.set('tag', tagId.toString())
    } else {
      newParams.delete('tag')
    }
    setSearchParams(newParams)
  }

  if (loading && songs.length === 0) {
    return <div className="text-center py-10 text-light-gray">Loading...</div>
  }

  return (
    <>
      <div className="mb-5">
        <input
          type="text"
          className="w-full max-w-md px-4 py-3 text-base border-2 border-[#D4C9BC] rounded-lg bg-off-white text-deep-navy outline-none transition-all duration-200 focus:border-deep-navy focus:shadow-[0_0_0_3px_rgba(0,22,45,0.1)] placeholder:text-light-gray"
          placeholder="Search favorites..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <span className="text-deep-navy font-medium mr-1">Filter by tag:</span>
          <button
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-all duration-200 border-2 ${
              selectedTagId === null
                ? 'bg-deep-navy text-off-white border-deep-navy'
                : 'bg-off-white text-deep-navy border-[#D4C9BC] hover:border-deep-navy'
            }`}
            onClick={() => handleTagSelect(null)}
          >
            All
          </button>
          {tags.map((tag) => (
            <TagChip
              key={tag.id}
              tag={tag}
              selected={selectedTagId === tag.id}
              onClick={() => handleTagSelect(selectedTagId === tag.id ? null : tag.id)}
            />
          ))}
        </div>
      )}

      {error && (
        <div className="text-[#D64545] bg-[rgba(214,69,69,0.1)] border-2 border-[#D64545] rounded-lg text-center p-5">
          Error: {error}
        </div>
      )}

      {songs.length === 0 ? (
        <div className="text-center text-light-gray text-xl py-10">
          No favorite songs yet. Star some songs to add them here!
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
          {songs.map((song) => (
            <SongCard
              key={song.id}
              song={song}
              onFavorite={() => handleToggleFavorite(song)}
              isFavorite={song.is_favorite}
            />
          ))}
        </div>
      )}

      <button
        className="fixed bottom-[30px] right-[30px] w-[60px] h-[60px] rounded-full border-0 bg-deep-navy text-off-white text-3xl cursor-pointer shadow-[0_4px_12px_rgba(0,22,45,0.4)] transition-all duration-200 hover:scale-110 hover:bg-[#001a3d]"
        onClick={() => navigate('/songs/new')}
      >
        +
      </button>
    </>
  )
}

export default FavoritesPage
