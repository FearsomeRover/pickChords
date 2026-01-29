import { Tag } from '../types'

interface TagChipProps {
  tag: Tag
  onClick?: () => void
  selected?: boolean
  onRemove?: () => void
}

export default function TagChip({ tag, onClick, selected, onRemove }: TagChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-2xl text-xs border transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:opacity-80' : ''
      }`}
      style={{
        backgroundColor: selected ? tag.color : 'transparent',
        borderColor: tag.color,
        color: selected ? '#fff' : tag.color,
      }}
      onClick={onClick}
    >
      {tag.name}
      {onRemove && (
        <button
          type="button"
          className="bg-transparent border-0 text-inherit cursor-pointer text-sm px-0.5 opacity-70 hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
        >
          ×
        </button>
      )}
    </span>
  )
}
