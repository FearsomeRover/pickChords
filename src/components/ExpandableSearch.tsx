import { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'

interface ExpandableSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

function ExpandableSearch({ value, onChange, placeholder = 'Search...' }: ExpandableSearchProps) {
  const [isExpanded, setIsExpanded] = useState(!!value)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-expand if there's a value
  useEffect(() => {
    if (value) {
      setIsExpanded(true)
    }
  }, [value])

  // Handle click outside to collapse (with delay to allow button clicks)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (!value) {
          setIsExpanded(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [value])

  const handleExpand = () => {
    setIsExpanded(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const handleClear = () => {
    onChange('')
    inputRef.current?.focus()
  }

  return (
    <div ref={containerRef} className="flex justify-end">
      <div
        className={`flex items-center transition-all duration-300 ease-out overflow-hidden ${
          isExpanded
            ? 'w-64 bg-off-white border-2 border-[#D4C9BC] rounded-lg shadow-sm'
            : 'w-10'
        }`}
      >
        <button
          className={`flex-shrink-0 flex items-center justify-center transition-colors cursor-pointer bg-transparent border-0 ${
            isExpanded ? 'w-10 h-10 text-light-gray' : 'w-10 h-10 text-deep-navy hover:text-light-gray'
          }`}
          onClick={!isExpanded ? handleExpand : undefined}
          title={!isExpanded ? 'Search' : undefined}
          tabIndex={isExpanded ? -1 : 0}
        >
          <Search size={isExpanded ? 18 : 20} />
        </button>

        <input
          ref={inputRef}
          type="text"
          className={`flex-1 min-w-0 py-2 pr-2 text-base bg-transparent text-deep-navy outline-none placeholder:text-light-gray transition-opacity duration-200 ${
            isExpanded ? 'opacity-100' : 'opacity-0 w-0'
          }`}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          tabIndex={isExpanded ? 0 : -1}
        />

        <button
          className={`flex-shrink-0 w-8 h-10 flex items-center justify-center text-light-gray hover:text-deep-navy transition-all cursor-pointer bg-transparent border-0 ${
            isExpanded && value ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={handleClear}
          tabIndex={isExpanded && value ? 0 : -1}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  )
}

export default ExpandableSearch
