import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { SongTablature, TabSection } from '../types'
import { Button } from './ui'
import TabViewer from './TabViewer'

interface TabEditorProps {
  tablature?: SongTablature
  onChange: (tablature: SongTablature | undefined) => void
}

interface SectionEditorProps {
  section: TabSection
  index: number
  onChange: (section: TabSection) => void
  onDelete: () => void
  isExpanded: boolean
  onToggleExpand: () => void
}

function SectionEditor({ section, index, onChange, onDelete, isExpanded, onToggleExpand }: SectionEditorProps) {
  const handleNameChange = (name: string) => {
    onChange({ ...section, name })
  }

  const handleTempoChange = (tempo: string) => {
    const num = parseInt(tempo, 10)
    onChange({ ...section, tempo: isNaN(num) ? undefined : num })
  }

  const handleTimeSignatureChange = (timeSignature: string) => {
    onChange({ ...section, timeSignature: timeSignature || undefined })
  }

  const handleInstructionsChange = (instructions: string) => {
    onChange({
      ...section,
      instructions: instructions ? instructions.split(',').map(s => s.trim()).filter(Boolean) : undefined
    })
  }

  return (
    <div className="border-2 border-[#D4C9BC] rounded-lg mb-4">
      {/* Section header */}
      <div
        className="flex items-center justify-between p-3 bg-cream cursor-pointer"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-3">
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          <span className="font-medium text-deep-navy">
            {section.name || `Section ${index + 1}`}
          </span>
          {section.tempo && (
            <span className="text-sm text-light-gray">♩ = {section.tempo}</span>
          )}
        </div>
        <button
          type="button"
          className="p-1 text-light-gray hover:text-coral transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Section content */}
      {isExpanded && (
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <div>
              <label className="block text-sm font-medium text-deep-navy mb-1">Section Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm border-2 border-[#D4C9BC] rounded-lg bg-off-white text-deep-navy outline-none focus:border-deep-navy"
                placeholder="e.g., Verse 1, Chorus"
                value={section.name}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-deep-navy mb-1">Tempo (BPM)</label>
              <input
                type="number"
                className="w-full px-3 py-2 text-sm border-2 border-[#D4C9BC] rounded-lg bg-off-white text-deep-navy outline-none focus:border-deep-navy"
                placeholder="e.g., 120"
                value={section.tempo || ''}
                onChange={(e) => handleTempoChange(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-deep-navy mb-1">Time Signature</label>
              <select
                className="w-full px-3 py-2 text-sm border-2 border-[#D4C9BC] rounded-lg bg-off-white text-deep-navy outline-none focus:border-deep-navy"
                value={section.timeSignature || ''}
                onChange={(e) => handleTimeSignatureChange(e.target.value)}
              >
                <option value="">-</option>
                <option value="4/4">4/4</option>
                <option value="3/4">3/4</option>
                <option value="6/8">6/8</option>
                <option value="2/4">2/4</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-deep-navy mb-1">Instructions</label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm border-2 border-[#D4C9BC] rounded-lg bg-off-white text-deep-navy outline-none focus:border-deep-navy"
                placeholder="e.g., let ring, palm mute"
                value={section.instructions?.join(', ') || ''}
                onChange={(e) => handleInstructionsChange(e.target.value)}
              />
            </div>
          </div>

          {/* For now, sections are displayed as read-only preview */}
          {section.measures && section.measures.length > 0 && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-deep-navy mb-2">Preview</label>
              <TabViewer tablature={{ sections: [section] }} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function TabEditor({ tablature, onChange }: TabEditorProps) {
  const [rawTextInput, setRawTextInput] = useState(tablature?.rawText || '')
  const [showRawInput, setShowRawInput] = useState(!tablature?.sections?.length)
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]))

  const handleRawTextChange = (text: string) => {
    setRawTextInput(text)
  }

  const handleSaveRawText = () => {
    if (rawTextInput.trim()) {
      onChange({
        ...tablature,
        rawText: rawTextInput.trim(),
        sections: tablature?.sections || []
      })
    } else {
      // Clear tablature if empty
      onChange(undefined)
    }
  }

  const handleAddSection = () => {
    const newSection: TabSection = {
      name: `Section ${(tablature?.sections?.length || 0) + 1}`,
      measures: []
    }

    const newSections = [...(tablature?.sections || []), newSection]
    setExpandedSections(new Set([...expandedSections, newSections.length - 1]))

    onChange({
      ...tablature,
      sections: newSections
    })

    setShowRawInput(false)
  }

  const handleSectionChange = (index: number, section: TabSection) => {
    const newSections = [...(tablature?.sections || [])]
    newSections[index] = section
    onChange({
      ...tablature,
      sections: newSections
    })
  }

  const handleDeleteSection = (index: number) => {
    if (!confirm('Delete this section?')) return

    const newSections = (tablature?.sections || []).filter((_, i) => i !== index)

    if (newSections.length === 0 && !tablature?.rawText) {
      onChange(undefined)
    } else {
      onChange({
        ...tablature,
        sections: newSections
      })
    }
  }

  const handleClearAll = () => {
    if (!confirm('Clear all tablature data?')) return
    setRawTextInput('')
    onChange(undefined)
  }

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedSections(newExpanded)
  }

  return (
    <div>
      {/* Mode toggle */}
      <div className="flex items-center gap-4 mb-4">
        <button
          type="button"
          className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-all ${
            showRawInput
              ? 'bg-deep-navy text-off-white'
              : 'bg-cream text-deep-navy hover:bg-[#D4C9BC]'
          }`}
          onClick={() => setShowRawInput(true)}
        >
          Paste Tab Text
        </button>
        <button
          type="button"
          className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-all ${
            !showRawInput
              ? 'bg-deep-navy text-off-white'
              : 'bg-cream text-deep-navy hover:bg-[#D4C9BC]'
          }`}
          onClick={() => setShowRawInput(false)}
        >
          Structured Sections
        </button>

        {(tablature?.rawText || tablature?.sections?.length) && (
          <button
            type="button"
            className="ml-auto text-sm text-coral hover:text-coral/80 transition-colors"
            onClick={handleClearAll}
          >
            Clear All
          </button>
        )}
      </div>

      {/* Raw text input mode */}
      {showRawInput && (
        <div>
          <label className="block text-sm font-medium text-deep-navy mb-2">
            Paste ASCII Tab
            <span className="text-light-gray font-normal ml-2">
              (from Ultimate Guitar, etc.)
            </span>
          </label>
          <textarea
            className="w-full px-4 py-3 text-sm font-mono border-2 border-[#D4C9BC] rounded-lg bg-off-white text-deep-navy outline-none focus:border-deep-navy resize-y"
            rows={12}
            placeholder={`e|---0-----0-----0-----0---
B|---1-----1-----1-----1---
G|---0-----2-----0-----2---
D|---2-----2-----2-----2---
A|---3-----------3---------
E|-------------------------`}
            value={rawTextInput}
            onChange={(e) => handleRawTextChange(e.target.value)}
            onBlur={handleSaveRawText}
          />
          <p className="text-xs text-light-gray mt-2">
            Paste guitar tabs directly. Standard ASCII format supported.
          </p>

          {/* Preview */}
          {rawTextInput.trim() && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-deep-navy mb-2">Preview</label>
              <TabViewer tablature={{ sections: [], rawText: rawTextInput.trim() }} />
            </div>
          )}
        </div>
      )}

      {/* Structured sections mode */}
      {!showRawInput && (
        <div>
          {tablature?.sections?.map((section, index) => (
            <SectionEditor
              key={index}
              section={section}
              index={index}
              onChange={(s) => handleSectionChange(index, s)}
              onDelete={() => handleDeleteSection(index)}
              isExpanded={expandedSections.has(index)}
              onToggleExpand={() => toggleSection(index)}
            />
          ))}

          <Button
            type="button"
            variant="secondary"
            className="flex items-center gap-2"
            onClick={handleAddSection}
          >
            <Plus size={16} />
            Add Section
          </Button>
        </div>
      )}
    </div>
  )
}
