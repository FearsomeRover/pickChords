import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ProgressStatus } from '../types'
import { useAuth } from '../hooks/useAuth'
import { useIsMobile } from '../hooks/useIsMobile'
import {
  useSong,
  useProgressItem,
  useAddToProgress,
} from '../hooks/useQueries'
import ChordDiagram from './ChordDiagram'
import TagChip from './TagChip'
import StrummingPatternDisplay from './StrummingPatternDisplay'
import SongLinks from './SongLinks'
import TabViewer from './TabViewer'

export default function SongPage() {
  const { user } = useAuth()
  const isMobile = useIsMobile()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const songId = id ? parseInt(id, 10) : undefined

  const { data: song, isLoading, error } = useSong(songId)

  // Progress tracking
  const { data: progressItem } = useProgressItem(songId)
  const addToProgressMutation = useAddToProgress()

  const [showProgressMenu, setShowProgressMenu] = useState(false)

  // Check if user can edit this song (owner or admin)
  const canEdit = user && song && (song.user_id === user.id || user.is_admin === true)

  useEffect(() => {
    const handleClickOutside = () => {
      if (showProgressMenu) {
        setShowProgressMenu(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showProgressMenu])

  const chords = song?.chords || []

  const handleAddToProgress = (status: ProgressStatus) => {
    if (!song || !user) return
    addToProgressMutation.mutate({
      songId: song.id,
      status,
    })
    setShowProgressMenu(false)
  }

  const progressStatusConfig: Record<ProgressStatus, { label: string; color: string }> = {
    want_to_learn: { label: 'Want to Learn', color: 'bg-[#6366F1]' },
    learning: { label: 'Learning', color: 'bg-[#F59E0B]' },
    practicing: { label: 'Practicing', color: 'bg-[#10B981]' },
    mastered: { label: 'Mastered', color: 'bg-teal-green' },
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
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold text-deep-navy">{song.name}</h1>
            {user && progressItem && (
              <span className={`px-3 py-1 text-sm font-medium text-white rounded-full ${progressStatusConfig[progressItem.status].color}`}>
                {progressStatusConfig[progressItem.status].label}
              </span>
            )}
          </div>
          {song.artist && <p className="text-deep-navy/70 text-lg">{song.artist}</p>}
          {song.capo && (
            <p className="text-deep-navy/70 text-sm mt-1">
              Capo: {song.capo}{song.capo === 1 ? 'st' : song.capo === 2 ? 'nd' : song.capo === 3 ? 'rd' : 'th'} fret
            </p>
          )}
          {song.links && song.links.length > 0 && (
            <div className="mt-2">
              <SongLinks links={song.links} />
            </div>
          )}
        </div>
        <div className="flex gap-2 items-center">
          {/* Add to Progress and Edit buttons hidden on mobile */}
          {!isMobile && user && !progressItem && (
            <div className="relative">
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
                  {(Object.keys(progressStatusConfig) as ProgressStatus[]).map((status) => (
                    <button
                      key={status}
                      className="w-full px-4 py-2 text-left text-sm text-deep-navy hover:bg-cream transition-all duration-200 border-0 cursor-pointer flex items-center gap-2"
                      onClick={() => handleAddToProgress(status)}
                    >
                      <span className={`w-3 h-3 rounded-full ${progressStatusConfig[status].color}`} />
                      {progressStatusConfig[status].label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {!isMobile && canEdit && (
            <button
              className="px-4 py-2 text-base rounded-lg font-medium bg-deep-navy text-off-white transition-all duration-200 hover:bg-[#001a3d] border-0 cursor-pointer"
              onClick={() => navigate(`/songs/${song.id}/edit`)}
            >
              Edit
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
      {song.strumming_pattern && (
        <div className="mb-6">
          <StrummingPatternDisplay
            pattern={song.strumming_pattern}
            onEdit={!isMobile && canEdit ? () => navigate(`/songs/${song.id}/edit`) : undefined}
          />
        </div>
      )}

      {/* Desktop split view: Chords on left, Tabs on right */}
      {!isMobile && song.tablature && chords.length > 0 ? (
        <div className="grid grid-cols-[minmax(280px,1fr)_2fr] gap-6">
          {/* Chords Panel */}
          <div className="bg-off-white rounded-xl border-2 border-[#D4C9BC] p-6">
            <h4 className="text-lg font-semibold text-deep-navy mb-5">Chords</h4>
            <div className="grid grid-cols-2 gap-3">
              {chords.map((chord, index) => (
                <div key={`${chord.id}-${index}`} className="flex justify-center">
                  <ChordDiagram chord={chord} width={120} height={150} />
                </div>
              ))}
            </div>
          </div>

          {/* Tablature Panel */}
          <div className="bg-off-white rounded-xl border-2 border-[#D4C9BC] p-6">
            <h4 className="text-lg font-semibold text-deep-navy mb-5">Tablature</h4>
            <TabViewer alphaTex={song.tablature} />
          </div>
        </div>
      ) : (
        <>
          {/* Chords Section (full width) */}
          <div className={`bg-off-white rounded-xl border-2 border-[#D4C9BC] ${isMobile ? 'p-4' : 'p-6'} mb-6`}>
            <h4 className="text-lg font-semibold text-deep-navy mb-5">Chords</h4>

            {chords.length > 0 ? (
              <div className={`grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-[repeat(auto-fill,minmax(200px,1fr))]'}`}>
                {chords.map((chord, index) => (
                  <div key={`${chord.id}-${index}`} className="flex justify-center">
                    <ChordDiagram chord={chord} width={isMobile ? 110 : 180} height={isMobile ? 140 : 220} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-light-gray text-lg py-6">
                No chords added to this song yet.{canEdit && ' Click "Edit" to add chords.'}
              </div>
            )}
          </div>

          {/* Tablature Section (full width, below chords) */}
          {song.tablature && (
            <div className={`bg-off-white rounded-xl border-2 border-[#D4C9BC] ${isMobile ? 'p-4' : 'p-6'}`}>
              <h4 className="text-lg font-semibold text-deep-navy mb-5">Tablature</h4>
              <TabViewer alphaTex={song.tablature} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
