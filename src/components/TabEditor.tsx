import { useState, useEffect } from 'react'
import { Trash2, Eye, EyeOff } from 'lucide-react'
import { Button } from './ui'
import TabViewer from './TabViewer'

interface TabEditorProps {
  tablature?: string | object // alphaTex format (string) or legacy format (object)
  onChange: (tablature: string | undefined) => void
}

// Convert tablature prop to string, handling legacy object format
function tablatureToString(tablature: string | object | undefined): string {
  if (!tablature) return ''
  if (typeof tablature === 'string') return tablature
  // Legacy format was an object - can't convert automatically
  return ''
}

export default function TabEditor({ tablature, onChange }: TabEditorProps) {
  const initialText = tablatureToString(tablature)
  const [text, setText] = useState(initialText)
  const [showPreview, setShowPreview] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasLegacyFormat = tablature && typeof tablature === 'object'

  // Sync with external changes
  useEffect(() => {
    setText(tablatureToString(tablature))
  }, [tablature])

  const handleTextChange = (value: string) => {
    setText(value)
    setError(null)

    // Update parent with the alphaTex string (or undefined if empty)
    const trimmed = value.trim()
    onChange(trimmed || undefined)
  }

  const handleClear = () => {
    if (!confirm('Clear all tablature?')) return
    setText('')
    onChange(undefined)
  }

  const defaultTemplate = `\\tempo 120
\\ts 4 4
\\track "Guitar"
\\staff {tabs}
\\tuning E4 B3 G3 D3 A2 E2

:8 0.1 0.2 2.3 2.4 | :4 r r`

  const handleLoadTemplate = () => {
    setText(defaultTemplate)
    onChange(defaultTemplate)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-deep-navy">AlphaTex Notation</span>
          <a
            href="https://alphatab.net/docs/alphatex/introduction"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-teal-green hover:underline"
          >
            Format Reference ↗
          </a>
        </div>
        <div className="flex items-center gap-2">
          {!text && (
            <button
              type="button"
              className="text-xs text-teal-green hover:underline"
              onClick={handleLoadTemplate}
            >
              Load Template
            </button>
          )}
          {text && (
            <button
              type="button"
              className="text-xs text-coral hover:underline"
              onClick={handleClear}
            >
              Clear
            </button>
          )}
          <button
            type="button"
            className="flex items-center gap-1 text-xs text-light-gray hover:text-deep-navy transition-colors"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? <EyeOff size={12} /> : <Eye size={12} />}
            {showPreview ? 'Hide' : 'Show'} Preview
          </button>
        </div>
      </div>

      {/* Legacy format warning */}
      {hasLegacyFormat && (
        <div className="bg-mustard-yellow/20 border border-mustard-yellow rounded-lg p-3 mb-3 text-sm text-deep-navy">
          <strong>Note:</strong> This song has tablature in an old format that can't be displayed.
          Please re-enter the tablature in alphaTex format below.
        </div>
      )}

      {/* Quick reference */}
      <div className="bg-cream rounded-lg p-3 mb-3 text-xs text-deep-navy">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div><strong>Note:</strong> <code className="bg-off-white px-1 rounded">fret.string</code> (e.g., 5.1)</div>
          <div><strong>Duration:</strong> <code className="bg-off-white px-1 rounded">:4</code> :8 :16</div>
          <div><strong>Chord:</strong> <code className="bg-off-white px-1 rounded">(0.1 0.2 2.3)</code></div>
          <div><strong>Rest:</strong> <code className="bg-off-white px-1 rounded">r</code></div>
          <div><strong>Bar:</strong> <code className="bg-off-white px-1 rounded">|</code></div>
          <div><strong>Hammer:</strong> <code className="bg-off-white px-1 rounded">5.1{'{h}'}</code></div>
          <div><strong>Pull:</strong> <code className="bg-off-white px-1 rounded">7.1{'{p}'}</code></div>
          <div><strong>Slide:</strong> <code className="bg-off-white px-1 rounded">5.1{'{s}'}</code></div>
        </div>
        <div className="mt-2 text-light-gray">
          Strings: 1=high E, 2=B, 3=G, 4=D, 5=A, 6=low E
        </div>
      </div>

      {/* Text input */}
      <textarea
        className="w-full px-4 py-3 text-sm font-mono border-2 border-[#D4C9BC] rounded-lg bg-off-white text-deep-navy outline-none focus:border-deep-navy resize-y"
        rows={10}
        placeholder={`\\tempo 120
\\ts 4 4
\\track "Guitar"
\\staff {tabs}
\\tuning E4 B3 G3 D3 A2 E2

:8 5.1{h} 7.1 7.1{p} 5.1 | :4 (0.1 0.2 2.3) r`}
        value={text}
        onChange={(e) => handleTextChange(e.target.value)}
      />

      {error && (
        <p className="text-coral text-sm mt-2">{error}</p>
      )}

      {/* Preview */}
      {showPreview && text.trim() && (
        <div className="mt-4 pt-4 border-t-2 border-[#D4C9BC]">
          <label className="block text-sm font-medium text-deep-navy mb-2">Preview</label>
          <TabViewer alphaTex={text} />
        </div>
      )}
    </div>
  )
}
