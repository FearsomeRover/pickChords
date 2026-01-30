import { StrokeType } from '../../types'

interface StrokeDisplayProps {
  stroke: StrokeType
  isSelected?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: { base: 'text-lg', accent: 'text-[10px]' },
  md: { base: 'text-xl', accent: 'text-xs' },
  lg: { base: 'text-2xl', accent: 'text-xs' },
}

export default function StrokeDisplay({
  stroke,
  isSelected = false,
  size = 'md',
}: StrokeDisplayProps) {
  const { base: baseSizeClass, accent: accentSizeClass } = sizeClasses[size]
  const baseClasses = `${baseSizeClass} font-bold transition-all duration-150 ${
    isSelected ? 'text-coral scale-110' : 'text-deep-navy'
  }`
  const accentClasses = `${accentSizeClass} font-bold ${
    isSelected ? 'text-coral' : 'text-deep-navy'
  }`

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

export function getSubdivision(noteLength: string): number {
  switch (noteLength) {
    case '1/4':
      return 1
    case '1/8':
      return 2
    case '1/8 triplet':
      return 3
    case '1/16':
      return 4
    case '1/16 triplet':
      return 6
    default:
      return 2
  }
}

export function getBeatsPerBar(noteLength: string): number {
  switch (noteLength) {
    case '1/4':
      return 4
    case '1/8':
      return 8
    case '1/8 triplet':
      return 12
    case '1/16':
      return 16
    case '1/16 triplet':
      return 24
    default:
      return 8
  }
}
