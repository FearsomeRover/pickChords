import { useState, useEffect, useCallback, useRef } from 'react'
import { StrokeType, StrummingPattern } from '../types'

interface StrummingPatternEditorProps {
  pattern?: StrummingPattern
  onChange: (pattern: StrummingPattern) => void
  onPlay?: () => void
  onDelete?: () => void
  readOnly?: boolean
}

const NOTE_LENGTHS = ['1/4', '1/8', '1/8 triplet', '1/16', '1/16 triplet'] as const

// Get beats per bar based on note length
function getBeatsPerBar(noteLength: string): number {
  switch (noteLength) {
    case '1/4': return 4
    case '1/8': return 8
    case '1/8 triplet': return 12
    case '1/16': return 16
    case '1/16 triplet': return 24
    default: return 8
  }
}

// Get subdivision grouping
function getSubdivision(noteLength: string): number {
  switch (noteLength) {
    case '1/4': return 1
    case '1/8': return 2
    case '1/8 triplet': return 3
    case '1/16': return 4
    case '1/16 triplet': return 6
    default: return 2
  }
}

// Stroke display
function StrokeDisplay({ stroke, isSelected }: { stroke: StrokeType; isSelected?: boolean }) {
  const baseClasses = `text-2xl font-bold transition-all duration-150 ${isSelected ? 'text-coral scale-110' : 'text-deep-navy'}`
  const accentClasses = `text-xs font-bold ${isSelected ? 'text-coral' : 'text-deep-navy'}`

  switch (stroke) {
    case 'down':
      return <span className={baseClasses}>&#8595;</span>
    case 'up':
      return <span className={baseClasses}>&#8593;</span>
    case 'mute_down':
      return <span className={`${baseClasses} opacity-60`}>&#8595;</span>
    case 'mute_up':
      return <span className={`${baseClasses} opacity-60`}>&#8593;</span>
    case 'accent_down':
      return (
        <span className="flex flex-col items-center">
          <span className={accentClasses}>&gt;</span>
          <span className={baseClasses}>&#8595;</span>
        </span>
      )
    case 'accent_up':
      return (
        <span className="flex flex-col items-center">
          <span className={accentClasses}>&gt;</span>
          <span className={baseClasses}>&#8593;</span>
        </span>
      )
    case 'rest':
      return <span className={`${baseClasses} text-light-gray`}>R</span>
    case 'skip':
    default:
      return <span className={`${baseClasses} text-light-gray`}>&middot;</span>
  }
}

export default function StrummingPatternEditor({
  pattern,
  onChange,
  onPlay,
  onDelete,
  readOnly = false,
}: StrummingPatternEditorProps) {
  const [strokes, setStrokes] = useState<StrokeType[]>(pattern?.strokes || [])
  const [tempo, setTempo] = useState(pattern?.tempo || 90)
  const [noteLength, setNoteLength] = useState<typeof NOTE_LENGTHS[number]>(
    (pattern?.noteLength as typeof NOTE_LENGTHS[number]) || '1/8 triplet'
  )
  const [songPart, setSongPart] = useState(pattern?.songPart || '')
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isEditing, setIsEditing] = useState(!readOnly && (!pattern || pattern.strokes.length === 0))
  const containerRef = useRef<HTMLDivElement>(null)

  const beatsPerBar = getBeatsPerBar(noteLength)
  const subdivision = getSubdivision(noteLength)

  // Initialize strokes when note length changes
  useEffect(() => {
    const newBeatsPerBar = getBeatsPerBar(noteLength)
    if (strokes.length !== newBeatsPerBar) {
      const newStrokes: StrokeType[] = new Array(newBeatsPerBar).fill('skip')
      // Copy over existing strokes
      for (let i = 0; i < Math.min(strokes.length, newBeatsPerBar); i++) {
        newStrokes[i] = strokes[i]
      }
      setStrokes(newStrokes)
    }
  }, [noteLength])

  // Emit changes
  useEffect(() => {
    if (strokes.length > 0) {
      onChange({
        strokes,
        tempo,
        noteLength,
        songPart: songPart || undefined,
      })
    }
  }, [strokes, tempo, noteLength, songPart])

  // Keyboard handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (readOnly || !isEditing) return

      // Auto-select first beat if none selected
      let currentIndex = selectedIndex
      if (currentIndex === null) {
        // Only auto-select for stroke keys, not navigation
        if (['ArrowDown', 'ArrowUp', 'r', 'R', 'x', 'X', ' '].includes(e.key)) {
          currentIndex = 0
          setSelectedIndex(0)
        } else {
          return
        }
      }

      const newStrokes = [...strokes]
      let newStroke: StrokeType | null = null

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          if (e.ctrlKey || e.metaKey) {
            newStroke = 'mute_down'
          } else if (e.shiftKey) {
            newStroke = 'accent_down'
          } else {
            newStroke = 'down'
          }
          break
        case 'ArrowUp':
          e.preventDefault()
          if (e.ctrlKey || e.metaKey) {
            newStroke = 'mute_up'
          } else if (e.shiftKey) {
            newStroke = 'accent_up'
          } else {
            newStroke = 'up'
          }
          break
        case 'r':
        case 'R':
          e.preventDefault()
          newStroke = 'rest'
          break
        case 'x':
        case 'X':
        case ' ':
          e.preventDefault()
          newStroke = 'skip'
          break
        case 'ArrowLeft':
          e.preventDefault()
          setSelectedIndex(Math.max(0, currentIndex - 1))
          return
        case 'ArrowRight':
          e.preventDefault()
          setSelectedIndex(Math.min(strokes.length - 1, currentIndex + 1))
          return
        default:
          return
      }

      if (newStroke !== null) {
        newStrokes[currentIndex] = newStroke
        setStrokes(newStrokes)
        // Auto advance to next stroke
        if (currentIndex < strokes.length - 1) {
          setSelectedIndex(currentIndex + 1)
        }
      }
    },
    [readOnly, isEditing, selectedIndex, strokes]
  )

  useEffect(() => {
    if (isEditing) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, isEditing])

  // Focus container when editing starts
  useEffect(() => {
    if (isEditing && containerRef.current) {
      containerRef.current.focus()
    }
  }, [isEditing])

  // Click on stroke to select
  const handleStrokeClick = (index: number) => {
    if (readOnly || !isEditing) return
    setSelectedIndex(index)
  }

  // Load default preset
  const loadPreset = (preset: 'basic_down' | 'down_up' | 'folk' | 'rock') => {
    let newStrokes: StrokeType[] = []

    switch (preset) {
      case 'basic_down':
        // Simple downstrokes on beats
        newStrokes = new Array(beatsPerBar).fill('skip').map((_, i) =>
          i % subdivision === 0 ? 'down' : 'skip'
        )
        break
      case 'down_up':
        // Alternating down-up
        newStrokes = new Array(beatsPerBar).fill('skip').map((_, i) =>
          i % 2 === 0 ? 'down' : 'up'
        )
        break
      case 'folk':
        // Classic folk pattern: D D U U D U
        if (beatsPerBar >= 8) {
          newStrokes = ['down', 'skip', 'down', 'up', 'skip', 'up', 'down', 'up']
          while (newStrokes.length < beatsPerBar) {
            newStrokes.push('skip')
          }
        }
        break
      case 'rock':
        // Rock pattern with accents
        if (beatsPerBar >= 8) {
          newStrokes = ['accent_down', 'skip', 'down', 'up', 'accent_down', 'skip', 'down', 'up']
          while (newStrokes.length < beatsPerBar) {
            newStrokes.push('skip')
          }
        }
        break
    }

    if (newStrokes.length > 0) {
      setStrokes(newStrokes.slice(0, beatsPerBar))
    }
  }

  return (
    <div
      ref={containerRef}
      className="bg-off-white rounded-xl p-6 border-2 border-[#D4C9BC]"
      tabIndex={0}
    >
      {/* Header with title and controls */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-deep-navy">
            Strumming pattern
            {songPart && <span className="text-light-gray ml-2">({songPart})</span>}
          </h3>
        </div>
        {isEditing && (
          <p className="text-xs text-light-gray">
            Use <kbd className="px-1 bg-cream rounded">&#8593;</kbd>,{' '}
            <kbd className="px-1 bg-cream rounded">&#8595;</kbd>,{' '}
            <kbd className="px-1 bg-cream rounded">x</kbd> and{' '}
            <kbd className="px-1 bg-cream rounded">SPACE</kbd> for strokes,{' '}
            <kbd className="px-1 bg-cream rounded">R</kbd> for rest,{' '}
            <kbd className="px-1 bg-cream rounded">CTRL</kbd>+arrow for mute and{' '}
            <kbd className="px-1 bg-cream rounded">SHIFT</kbd>+arrow for accent
          </p>
        )}
      </div>

      {/* Preset dropdown (only in edit mode) */}
      {isEditing && (
        <div className="mb-4">
          <label className="text-sm text-light-gray mr-2">Add default preset</label>
          <select
            className="px-3 py-1 text-sm rounded-lg border-2 border-[#D4C9BC] bg-cream text-deep-navy cursor-pointer"
            onChange={(e) => {
              if (e.target.value) {
                loadPreset(e.target.value as any)
                e.target.value = ''
              }
            }}
            defaultValue=""
          >
            <option value="">Select...</option>
            <option value="basic_down">Basic Downstrokes</option>
            <option value="down_up">Alternating Down-Up</option>
            <option value="folk">Folk Pattern (D D U U D U)</option>
            <option value="rock">Rock Pattern (accented)</option>
          </select>
        </div>
      )}

      {/* Strumming pattern display */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex items-end gap-0 min-w-fit">
          {strokes.map((stroke, index) => (
            <div
              key={index}
              className={`flex flex-col items-center min-w-[32px] cursor-pointer transition-all duration-150 ${
                isEditing && selectedIndex === index ? 'bg-cream rounded' : ''
              }`}
              onClick={() => handleStrokeClick(index)}
            >
              <StrokeDisplay stroke={stroke} isSelected={isEditing && selectedIndex === index} />
            </div>
          ))}
        </div>

        {/* Beat numbers */}
        <div className="flex gap-0 mt-1">
          {Array.from({ length: 4 }).map((_, beatIndex) => (
            <div
              key={beatIndex}
              className="flex items-center"
              style={{ width: `${(subdivision * 32)}px` }}
            >
              <span className="text-sm text-coral font-semibold">{beatIndex + 1}</span>
              {subdivision > 1 && (
                <div className="flex-1 flex justify-center items-center mx-1">
                  <div className="border-b border-light-gray flex-1" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Subdivision indicator */}
        <div className="flex gap-0 mt-0.5">
          {Array.from({ length: 4 }).map((_, beatIndex) => (
            <div
              key={beatIndex}
              className="text-xs text-light-gray text-center"
              style={{ width: `${(subdivision * 32)}px` }}
            >
              {subdivision > 1 ? subdivision : ''}
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-end">
        {isEditing && (
          <div className="flex flex-col">
            <label className="text-sm text-deep-navy mb-1">Song part</label>
            <input
              type="text"
              value={songPart}
              onChange={(e) => setSongPart(e.target.value)}
              placeholder="e.g. Verse, Chorus"
              className="px-3 py-2 text-sm rounded-lg border-2 border-[#D4C9BC] bg-cream text-deep-navy w-32"
            />
          </div>
        )}

        <div className="flex flex-col">
          <label className="text-sm text-deep-navy mb-1">Tempo (bpm)</label>
          <input
            type="number"
            value={tempo}
            onChange={(e) => setTempo(Math.max(30, Math.min(300, parseInt(e.target.value) || 90)))}
            className="px-3 py-2 text-sm rounded-lg border-2 border-[#D4C9BC] bg-cream text-deep-navy w-24"
            disabled={readOnly && !isEditing}
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-deep-navy mb-1">Note length</label>
          <select
            value={noteLength}
            onChange={(e) => setNoteLength(e.target.value as typeof NOTE_LENGTHS[number])}
            className="px-3 py-2 text-sm rounded-lg border-2 border-[#D4C9BC] bg-cream text-deep-navy cursor-pointer"
            disabled={readOnly && !isEditing}
          >
            {NOTE_LENGTHS.map((nl) => (
              <option key={nl} value={nl}>
                {nl}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 ml-auto">
          {onPlay && (
            <button
              className="px-4 py-2 text-sm rounded-lg font-medium bg-deep-navy text-off-white transition-all duration-200 hover:bg-[#001a3d] border-0 cursor-pointer"
              onClick={onPlay}
            >
              Play
            </button>
          )}
          {!readOnly && (
            <button
              className="px-4 py-2 text-sm rounded-lg font-medium bg-off-white text-deep-navy border-2 border-[#D4C9BC] transition-all duration-200 hover:border-deep-navy cursor-pointer"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Done' : 'Edit'}
            </button>
          )}
          {onDelete && (
            <button
              className="px-4 py-2 text-sm rounded-lg font-medium bg-off-white text-[#D64545] border-2 border-[#D4C9BC] transition-all duration-200 hover:border-[#D64545] cursor-pointer"
              onClick={onDelete}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
