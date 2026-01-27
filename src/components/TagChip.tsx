import React from 'react'
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
      className={`tag-chip ${selected ? 'selected' : ''} ${onClick ? 'clickable' : ''}`}
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
          className="tag-remove"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
        >
          x
        </button>
      )}
    </span>
  )
}
