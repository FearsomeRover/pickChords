import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useIsMobile } from '../hooks/useIsMobile'
import { useSongs, useTags } from '../hooks/useQueries'
import SongCard from '../components/SongCard'
import TagChip from '../components/TagChip'
import ExpandableSearch from '../components/ExpandableSearch'
import { ErrorCard, LoadingSpinner } from '../components/ui'

function SongsPage() {
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const searchTerm = searchParams.get('search') || ''
  const tagIdParam = searchParams.get('tag')
  const selectedTagId = tagIdParam ? parseInt(tagIdParam, 10) : null

  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm)

  // Debounce search
  useState(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300)
    return () => clearTimeout(timer)
  })

  const { data: songs = [], isLoading, error } = useSongs({
    search: debouncedSearch,
    tag: selectedTagId,
  })
  const { data: tags = [] } = useTags()

  const handleSearchChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams)
    if (value) {
      newParams.set('search', value)
    } else {
      newParams.delete('search')
    }
    setSearchParams(newParams)
    // Update debounced search after a delay
    setTimeout(() => setDebouncedSearch(value), 300)
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

  if (isLoading && songs.length === 0) {
    return <LoadingSpinner />
  }

  const selectedTag = tags.find(t => t.id === selectedTagId)

  return (
    <>
      {/* Tag Filter Bar */}
      {tags.length > 0 && (
        <div className="bg-cream rounded-xl p-4 mb-5 border-2 border-[#D4C9BC]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-deep-navy font-semibold text-sm">Filter:</span>
            <button
              className={`px-3 py-1.5 text-sm rounded-full font-medium transition-all duration-200 border-2 ${
                selectedTagId === null
                  ? 'bg-deep-navy text-off-white border-deep-navy shadow-sm'
                  : 'bg-off-white text-deep-navy border-[#D4C9BC] hover:border-deep-navy'
              }`}
              onClick={() => handleTagSelect(null)}
            >
              All Songs
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
          {selectedTag && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="text-light-gray">
                Showing songs tagged with
              </span>
              <TagChip tag={selectedTag} selected />
              <button
                className="text-light-gray hover:text-deep-navy underline ml-1"
                onClick={() => handleTagSelect(null)}
              >
                Clear filter
              </button>
            </div>
          )}
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-5">
        <ExpandableSearch
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search songs..."
        />
      </div>

      {error && (
        <ErrorCard
          message={error instanceof Error ? error.message : 'Failed to load songs'}
        />
      )}

      {songs.length === 0 ? (
        <div className="text-center text-light-gray text-xl py-10">
          No songs found. Add some songs to get started!
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
          {songs.map((song) => (
            <SongCard
              key={song.id}
              song={song}
            />
          ))}
        </div>
      )}

      {/* Add song button (hidden on mobile) */}
      {!isMobile && (
        <button
          className="fixed bottom-[30px] right-[30px] w-[60px] h-[60px] rounded-full border-0 bg-deep-navy text-off-white cursor-pointer shadow-[0_4px_12px_rgba(0,22,45,0.4)] transition-all duration-200 hover:scale-110 hover:bg-[#001a3d] flex items-center justify-center"
          onClick={() => navigate('/songs/new')}
          title="Add new song"
        >
          <Plus size={28} />
        </button>
      )}
    </>
  )
}

export default SongsPage
