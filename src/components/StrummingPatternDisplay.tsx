import { StrummingPattern } from '../types'
import StrokeDisplay, { getSubdivision } from './strumming/StrokeDisplay'
import { Button } from './ui'

interface StrummingPatternDisplayProps {
  pattern: StrummingPattern
  onEdit?: () => void
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
          <Button variant="secondary" onClick={onEdit} className="px-3 py-1 text-sm">
            Edit
          </Button>
        )}
      </div>

      {/* Pattern display */}
      <div className="overflow-x-auto mb-3">
        <div className="flex items-end gap-0 min-w-fit">
          {pattern.strokes.map((stroke, index) => (
            <div key={index} className="flex flex-col items-center min-w-[28px]">
              <StrokeDisplay stroke={stroke} size="md" />
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
