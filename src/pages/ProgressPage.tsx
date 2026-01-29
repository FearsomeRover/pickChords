import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAuth } from '../hooks/useAuth'
import { useProgress, useUpdateProgress, useRemoveFromProgress } from '../hooks/useQueries'
import { SongProgress, ProgressStatus } from '../types'

const COLUMNS: { id: ProgressStatus; title: string; color: string }[] = [
  { id: 'want_to_learn', title: 'Want to Learn', color: 'bg-[#6366F1]' },
  { id: 'learning', title: 'Learning', color: 'bg-[#F59E0B]' },
  { id: 'practicing', title: 'Practicing', color: 'bg-[#10B981]' },
  { id: 'mastered', title: 'Mastered', color: 'bg-teal-green' },
]

interface SongCardProps {
  item: SongProgress
  isDragging?: boolean
  onRemove?: () => void
  onClick?: () => void
}

function SongCard({ item, isDragging, onRemove, onClick }: SongCardProps) {
  return (
    <div
      className={`bg-off-white rounded-lg p-3 border-2 border-[#D4C9BC] cursor-grab transition-all duration-200 ${
        isDragging ? 'opacity-50 shadow-lg scale-105' : 'hover:border-deep-navy hover:shadow-md'
      }`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-deep-navy font-medium truncate">{item.song_name}</h4>
          {item.song_artist && (
            <p className="text-sm text-light-gray truncate">{item.song_artist}</p>
          )}
        </div>
        {onRemove && (
          <button
            className="text-light-gray hover:text-[#D64545] transition-colors p-1"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            title="Remove from board"
          >
            &times;
          </button>
        )}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-xs text-light-gray bg-cream px-2 py-0.5 rounded">
          {item.chord_count || 0} chords
        </span>
      </div>
    </div>
  )
}

function SortableCard({ item, onRemove, onClick }: { item: SongProgress; onRemove: () => void; onClick: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `song-${item.song_id}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <SongCard item={item} onRemove={onRemove} onClick={onClick} />
    </div>
  )
}

function Column({
  column,
  items,
  onRemove,
  onCardClick,
}: {
  column: typeof COLUMNS[number]
  items: SongProgress[]
  onRemove: (songId: number) => void
  onCardClick: (songId: number) => void
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  })

  return (
    <div className="flex-1 min-w-[250px] max-w-[350px]">
      <div className={`${column.color} rounded-t-lg px-4 py-2`}>
        <h3 className="text-off-white font-medium flex items-center justify-between">
          {column.title}
          <span className="bg-white/20 text-sm px-2 py-0.5 rounded">
            {items.length}
          </span>
        </h3>
      </div>
      <div
        ref={setNodeRef}
        className={`bg-cream/50 rounded-b-lg p-3 min-h-[400px] border-2 border-t-0 transition-colors ${
          isOver ? 'border-teal-green bg-teal-green/10' : 'border-[#D4C9BC]'
        }`}
      >
        <SortableContext
          items={items.map(i => `song-${i.song_id}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <SortableCard
                key={item.song_id}
                item={item}
                onRemove={() => onRemove(item.song_id)}
                onClick={() => onCardClick(item.song_id)}
              />
            ))}
            {items.length === 0 && (
              <div className={`text-center text-sm py-8 border-2 border-dashed rounded-lg transition-colors ${
                isOver ? 'border-teal-green text-teal-green' : 'border-[#D4C9BC] text-light-gray'
              }`}>
                Drop songs here
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  )
}

function ProgressPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: progress = [], isLoading, error } = useProgress()
  const updateProgressMutation = useUpdateProgress()
  const removeProgressMutation = useRemoveFromProgress()

  const [activeId, setActiveId] = useState<string | null>(null)

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

  // Group items by status
  const itemsByColumn = useMemo(() => {
    const grouped: Record<ProgressStatus, SongProgress[]> = {
      want_to_learn: [],
      learning: [],
      practicing: [],
      mastered: [],
    }

    progress.forEach((item) => {
      if (grouped[item.status]) {
        grouped[item.status].push(item)
      }
    })

    // Sort by position within each column
    Object.keys(grouped).forEach((status) => {
      grouped[status as ProgressStatus].sort((a, b) => a.position - b.position)
    })

    return grouped
  }, [progress])

  const activeItem = useMemo(() => {
    if (!activeId) return null
    const songId = parseInt(activeId.replace('song-', ''))
    return progress.find(p => p.song_id === songId) || null
  }, [activeId, progress])

  // Redirect if not logged in
  if (!user) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl text-deep-navy mb-4">Login Required</h2>
        <p className="text-light-gray mb-4">Please log in to track your progress.</p>
        <button
          className="px-5 py-2.5 text-base rounded-lg font-medium bg-deep-navy text-off-white transition-all duration-200 hover:bg-[#001a3d] border-0 cursor-pointer"
          onClick={() => navigate('/')}
        >
          Go Home
        </button>
      </div>
    )
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = () => {
    // This is called when dragging over a new container
    // We don't need to do anything here since we handle everything in dragEnd
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeSongId = parseInt(activeId.replace('song-', ''))
    const activeItem = progress.find(p => p.song_id === activeSongId)
    if (!activeItem) return

    let newStatus: ProgressStatus = activeItem.status
    let newPosition: number = activeItem.position

    // Determine target column
    if (overId.startsWith('song-')) {
      // Dropped on another card
      const overSongId = parseInt(overId.replace('song-', ''))
      const overItem = progress.find(p => p.song_id === overSongId)
      if (overItem) {
        newStatus = overItem.status
        newPosition = overItem.position
      }
    } else {
      // Dropped on a column (empty area)
      const columnStatus = COLUMNS.find(c => c.id === overId)?.id
      if (columnStatus) {
        newStatus = columnStatus
        // Position at the end of the column
        const columnItems = itemsByColumn[columnStatus]
        newPosition = columnItems.length
      }
    }

    // Only update if something changed
    if (newStatus !== activeItem.status || newPosition !== activeItem.position) {
      updateProgressMutation.mutate({
        songId: activeSongId,
        status: newStatus,
        position: newPosition,
      })
    }
  }

  const handleRemove = (songId: number) => {
    if (!confirm('Remove this song from your progress board?')) return
    removeProgressMutation.mutate(songId)
  }

  const handleCardClick = (songId: number) => {
    navigate(`/songs/${songId}`)
  }

  if (isLoading) {
    return <div className="text-center py-10 text-light-gray">Loading...</div>
  }

  if (error) {
    return (
      <div className="text-[#D64545] bg-[rgba(214,69,69,0.1)] border-2 border-[#D64545] rounded-lg text-center p-5">
        Error: {error instanceof Error ? error.message : 'Failed to load progress'}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl text-deep-navy mb-2">My Progress</h1>
        <p className="text-light-gray">
          Track your song learning journey. Drag songs between columns to update your progress.
        </p>
      </div>

      {progress.length === 0 ? (
        <div className="text-center py-16 bg-cream/50 rounded-xl border-2 border-[#D4C9BC]">
          <h2 className="text-xl text-deep-navy mb-3">No songs in progress</h2>
          <p className="text-light-gray mb-6">
            Add songs to your progress board from the song details page.
          </p>
          <button
            className="px-5 py-2.5 text-base rounded-lg font-medium bg-deep-navy text-off-white transition-all duration-200 hover:bg-[#001a3d] border-0 cursor-pointer"
            onClick={() => navigate('/songs')}
          >
            Browse Songs
          </button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {COLUMNS.map((column) => (
              <Column
                key={column.id}
                column={column}
                items={itemsByColumn[column.id]}
                onRemove={handleRemove}
                onCardClick={handleCardClick}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={null}>
            {activeItem && <SongCard item={activeItem} isDragging />}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  )
}

export default ProgressPage
