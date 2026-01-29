import { StrokeType, StrummingPattern } from '../types'

interface StrummingPatternDisplayProps {
  pattern: StrummingPattern
  onEdit?: () => void
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
function StrokeDisplay({ stroke }: { stroke: StrokeType }) {
  const baseClasses = 'text-xl font-bold text-deep-navy'
  const accentClasses = 'text-xs font-bold text-deep-navy'

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

export default function StrummingPatternDisplay({
  pattern,
  onEdit,
}: StrummingPatternDisplayProps) {
  const subdivision = getSubdivision(pattern.noteLength)

  return (
    <div className="bg-off-white rounded-xl p-5 border-2 border-[#D4C9BC]">
      <div className="flex justify-between items-start mb-3">
        <h4 className="text-lg font-semibold text-deep-navy">
          Strumming Pattern
          {pattern.songPart && (
            <span className="text-light-gray font-normal ml-2">({pattern.songPart})</span>
          )}
        </h4>
        {onEdit && (
          <button
            className="px-3 py-1 text-sm rounded-lg font-medium bg-off-white text-deep-navy border-2 border-[#D4C9BC] transition-all duration-200 hover:border-deep-navy cursor-pointer"
            onClick={onEdit}
          >
            Edit
          </button>
        )}
      </div>

      {/* Pattern display */}
      <div className="overflow-x-auto mb-3">
        <div className="flex items-end gap-0 min-w-fit">
          {pattern.strokes.map((stroke, index) => (
            <div key={index} className="flex flex-col items-center min-w-[28px]">
              <StrokeDisplay stroke={stroke} />
            </div>
          ))}
        </div>

        {/* Beat numbers */}
        <div className="flex gap-0 mt-1">
          {Array.from({ length: 4 }).map((_, beatIndex) => (
            <div
              key={beatIndex}
              className="flex items-center"
              style={{ width: `${(subdivision * 28)}px` }}
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
              style={{ width: `${(subdivision * 28)}px` }}
            >
              {subdivision > 1 ? subdivision : ''}
            </div>
          ))}
        </div>
      </div>

      {/* Tempo and note length info */}
      <div className="flex gap-4 text-sm text-light-gray">
        <span>
          <strong className="text-deep-navy">{pattern.tempo}</strong> bpm
        </span>
        <span>
          <strong className="text-deep-navy">{pattern.noteLength}</strong> notes
        </span>
      </div>
    </div>
  )
}
