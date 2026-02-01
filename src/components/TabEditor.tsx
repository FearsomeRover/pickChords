import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, Music, FileText, Edit3, Camera } from 'lucide-react'
import { SongTablature, TabMeasure, TabBeat, TabNote } from '../types'
import { Button } from './ui'
import TabViewer from './TabViewer'
import { parseAsciiTab } from '../utils/tabParser'
import { parseSIF, generateSIFExample } from '../utils/sifParser'

interface TabEditorProps {
  tablature?: SongTablature
  onChange: (tablature: SongTablature | undefined) => void
}

const STRING_NAMES = ['e', 'B', 'G', 'D', 'A', 'E']

// Parse a simple fret notation string like "x-0-2-2-0-x" into TabNote[]
function parseFretString(input: string): TabNote[] {
  const notes: TabNote[] = []
  const parts = input.split('-').map(s => s.trim().toLowerCase())

  parts.forEach((part, stringIdx) => {
    if (stringIdx >= 6) return
    if (part === 'x' || part === '' || part === '-') return

    const fret = parseInt(part, 10)
    if (!isNaN(fret) && fret >= 0 && fret <= 24) {
      notes.push({ string: stringIdx, fret })
    }
  })

  return notes
}

// Convert TabNote[] back to fret string for display
function notesToFretString(notes: TabNote[]): string {
  const frets = Array(6).fill('x')
  for (const note of notes) {
    if (note.string >= 0 && note.string < 6) {
      frets[note.string] = note.fret.toString()
    }
  }
  return frets.join('-')
}

interface BeatEditorProps {
  beat: TabBeat
  onChange: (beat: TabBeat) => void
  onDelete: () => void
}

function BeatEditor({ beat, onChange, onDelete }: BeatEditorProps) {
  const [fretInput, setFretInput] = useState(notesToFretString(beat.notes))

  const handleFretChange = (value: string) => {
    setFretInput(value)
  }

  const handleFretBlur = () => {
    const notes = parseFretString(fretInput)
    onChange({ ...beat, notes })
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-cream rounded-lg">
      <div className="flex flex-col gap-1">
        <input
          type="text"
          className="w-28 px-2 py-1 text-xs font-mono border border-[#D4C9BC] rounded bg-off-white text-deep-navy"
          placeholder="e-B-G-D-A-E"
          value={fretInput}
          onChange={(e) => handleFretChange(e.target.value)}
          onBlur={handleFretBlur}
          title="Frets: e-B-G-D-A-E (use x for muted)"
        />
        <div className="flex gap-1">
          <input
            type="text"
            className="w-12 px-1 py-0.5 text-xs border border-[#D4C9BC] rounded bg-off-white text-deep-navy"
            placeholder="Chord"
            value={beat.chord || ''}
            onChange={(e) => onChange({ ...beat, chord: e.target.value || undefined })}
          />
          <select
            className="w-12 px-1 py-0.5 text-xs border border-[#D4C9BC] rounded bg-off-white text-deep-navy"
            value={beat.duration}
            onChange={(e) => onChange({ ...beat, duration: parseInt(e.target.value, 10) })}
          >
            <option value={1}>1</option>
            <option value={2}>½</option>
            <option value={4}>¼</option>
            <option value={8}>⅛</option>
            <option value={16}>1/16</option>
          </select>
        </div>
        <input
          type="text"
          className="w-28 px-2 py-0.5 text-xs border border-[#D4C9BC] rounded bg-off-white text-deep-navy"
          placeholder="Lyric"
          value={beat.lyric || ''}
          onChange={(e) => onChange({ ...beat, lyric: e.target.value || undefined })}
        />
      </div>
      <button
        type="button"
        className="p-1 text-light-gray hover:text-coral transition-colors"
        onClick={onDelete}
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

interface MeasureEditorProps {
  measure: TabMeasure
  index: number
  onChange: (measure: TabMeasure) => void
  onDelete: () => void
  isExpanded: boolean
  onToggleExpand: () => void
}

function MeasureEditor({ measure, index, onChange, onDelete, isExpanded, onToggleExpand }: MeasureEditorProps) {
  const handleAddBeat = () => {
    const newBeat: TabBeat = {
      notes: [],
      duration: 4
    }
    onChange({ ...measure, beats: [...measure.beats, newBeat] })
  }

  const handleBeatChange = (beatIdx: number, beat: TabBeat) => {
    const newBeats = [...measure.beats]
    newBeats[beatIdx] = beat
    onChange({ ...measure, beats: newBeats })
  }

  const handleDeleteBeat = (beatIdx: number) => {
    onChange({ ...measure, beats: measure.beats.filter((_, i) => i !== beatIdx) })
  }

  return (
    <div className="border-2 border-[#D4C9BC] rounded-lg mb-3">
      {/* Measure header */}
      <div
        className="flex items-center justify-between p-3 bg-cream cursor-pointer"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-3">
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          <span className="font-medium text-deep-navy">
            Measure {measure.number || index + 1}
          </span>
          {measure.section && (
            <span className="text-sm text-teal-green italic">{measure.section}</span>
          )}
          <span className="text-sm text-light-gray">
            ({measure.beats.length} beat{measure.beats.length !== 1 ? 's' : ''})
          </span>
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

      {/* Measure content */}
      {isExpanded && (
        <div className="p-4">
          {/* Measure metadata */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-deep-navy mb-1">Measure #</label>
              <input
                type="number"
                className="w-full px-2 py-1.5 text-sm border-2 border-[#D4C9BC] rounded-lg bg-off-white text-deep-navy"
                value={measure.number || ''}
                onChange={(e) => onChange({ ...measure, number: parseInt(e.target.value, 10) || undefined })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-deep-navy mb-1">Section</label>
              <input
                type="text"
                className="w-full px-2 py-1.5 text-sm border-2 border-[#D4C9BC] rounded-lg bg-off-white text-deep-navy"
                placeholder="Verse 1, Chorus..."
                value={measure.section || ''}
                onChange={(e) => onChange({ ...measure, section: e.target.value || undefined })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-deep-navy mb-1">Time Sig</label>
              <select
                className="w-full px-2 py-1.5 text-sm border-2 border-[#D4C9BC] rounded-lg bg-off-white text-deep-navy"
                value={measure.timeSignature || ''}
                onChange={(e) => onChange({ ...measure, timeSignature: e.target.value || undefined })}
              >
                <option value="">-</option>
                <option value="4/4">4/4</option>
                <option value="3/4">3/4</option>
                <option value="6/8">6/8</option>
                <option value="2/4">2/4</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-deep-navy mb-1">Tempo</label>
              <input
                type="number"
                className="w-full px-2 py-1.5 text-sm border-2 border-[#D4C9BC] rounded-lg bg-off-white text-deep-navy"
                placeholder="BPM"
                value={measure.tempo || ''}
                onChange={(e) => onChange({ ...measure, tempo: parseInt(e.target.value, 10) || undefined })}
              />
            </div>
          </div>

          {/* Instructions */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-deep-navy mb-1">Instructions</label>
            <input
              type="text"
              className="w-full px-2 py-1.5 text-sm border-2 border-[#D4C9BC] rounded-lg bg-off-white text-deep-navy"
              placeholder="let ring, palm mute (comma separated)"
              value={measure.instructions?.join(', ') || ''}
              onChange={(e) => onChange({
                ...measure,
                instructions: e.target.value ? e.target.value.split(',').map(s => s.trim()).filter(Boolean) : undefined
              })}
            />
          </div>

          {/* Beats */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-deep-navy">Beats</label>
              <div className="text-xs text-light-gray">
                Format: frets as {STRING_NAMES.join('-')} (x = muted)
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {measure.beats.map((beat, beatIdx) => (
                <BeatEditor
                  key={beatIdx}
                  beat={beat}
                  onChange={(b) => handleBeatChange(beatIdx, b)}
                  onDelete={() => handleDeleteBeat(beatIdx)}
                />
              ))}
              <button
                type="button"
                className="flex items-center gap-1 px-3 py-2 text-sm text-teal-green border-2 border-dashed border-teal-green/50 rounded-lg hover:bg-teal-green/10 transition-colors"
                onClick={handleAddBeat}
              >
                <Plus size={14} />
                Beat
              </button>
            </div>
          </div>

          {/* Preview */}
          {measure.beats.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[#D4C9BC]">
              <label className="block text-xs font-medium text-deep-navy mb-2">Preview</label>
              <TabViewer tablature={{ measures: [measure] }} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function TabEditor({ tablature, onChange }: TabEditorProps) {
  const [mode, setMode] = useState<'edit' | 'import'>('edit')
  const [importFormat, setImportFormat] = useState<'ascii' | 'sif'>('sif')
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState<string | null>(null)
  const [expandedMeasures, setExpandedMeasures] = useState<Set<number>>(new Set([0]))

  const handleAddMeasure = () => {
    const newMeasure: TabMeasure = {
      beats: [],
      number: (tablature?.measures?.length || 0) + 1
    }

    const newMeasures = [...(tablature?.measures || []), newMeasure]
    setExpandedMeasures(new Set([...expandedMeasures, newMeasures.length - 1]))

    onChange({
      ...tablature,
      measures: newMeasures
    })
  }

  const handleMeasureChange = (index: number, measure: TabMeasure) => {
    const newMeasures = [...(tablature?.measures || [])]
    newMeasures[index] = measure
    onChange({
      ...tablature,
      measures: newMeasures
    })
  }

  const handleDeleteMeasure = (index: number) => {
    if (!confirm('Delete this measure?')) return

    const newMeasures = (tablature?.measures || []).filter((_, i) => i !== index)

    if (newMeasures.length === 0) {
      onChange(undefined)
    } else {
      onChange({
        ...tablature,
        measures: newMeasures
      })
    }
  }

  const handleClearAll = () => {
    if (!confirm('Clear all tablature data?')) return
    onChange(undefined)
  }

  const handleImport = () => {
    if (!importText.trim()) {
      setImportError('Please paste some tablature text')
      return
    }

    // Try the selected format first, then fall back to the other
    let parsed = importFormat === 'sif'
      ? parseSIF(importText) || parseAsciiTab(importText)
      : parseAsciiTab(importText) || parseSIF(importText)

    if (!parsed || parsed.measures.length === 0) {
      setImportError(
        importFormat === 'sif'
          ? 'Could not parse. Make sure it\'s in Songsterr Import Format (see example below).'
          : 'Could not parse tablature. Make sure it\'s in standard ASCII format.'
      )
      return
    }

    // Merge with existing or replace
    if (tablature?.measures?.length) {
      if (confirm(`Add ${parsed.measures.length} measures to existing tablature? (Cancel to replace)`)) {
        // Add to existing - renumber
        const startNum = tablature.measures.length + 1
        const newMeasures = parsed.measures.map((m, i) => ({
          ...m,
          number: startNum + i
        }))
        onChange({
          ...tablature,
          measures: [...tablature.measures, ...newMeasures]
        })
      } else {
        onChange(parsed)
      }
    } else {
      onChange(parsed)
    }

    setImportText('')
    setImportError(null)
    setMode('edit')
  }

  const handleLoadExample = () => {
    setImportText(generateSIFExample())
    setImportFormat('sif')
  }

  const toggleMeasure = (index: number) => {
    const newExpanded = new Set(expandedMeasures)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedMeasures(newExpanded)
  }

  const hasMeasures = tablature?.measures && tablature.measures.length > 0

  return (
    <div>
      {/* Mode toggle */}
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg font-medium transition-all ${
            mode === 'import'
              ? 'bg-deep-navy text-off-white'
              : 'bg-cream text-deep-navy hover:bg-[#D4C9BC]'
          }`}
          onClick={() => setMode('import')}
        >
          <FileText size={14} />
          Paste Tab
        </button>
        <button
          type="button"
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg font-medium transition-all ${
            mode === 'edit'
              ? 'bg-deep-navy text-off-white'
              : 'bg-cream text-deep-navy hover:bg-[#D4C9BC]'
          }`}
          onClick={() => setMode('edit')}
        >
          <Edit3 size={14} />
          Manual Edit
        </button>

        {hasMeasures && (
          <button
            type="button"
            className="ml-auto text-sm text-coral hover:text-coral/80 transition-colors"
            onClick={handleClearAll}
          >
            Clear All
          </button>
        )}
      </div>

      {/* Import mode */}
      {mode === 'import' && (
        <div className="mb-4">
          {/* Format selector */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium text-deep-navy">Format:</span>
            <button
              type="button"
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded font-medium transition-all ${
                importFormat === 'sif'
                  ? 'bg-teal-green text-off-white'
                  : 'bg-cream text-deep-navy hover:bg-[#D4C9BC]'
              }`}
              onClick={() => setImportFormat('sif')}
            >
              <Camera size={12} />
              Screenshot Format
            </button>
            <button
              type="button"
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded font-medium transition-all ${
                importFormat === 'ascii'
                  ? 'bg-teal-green text-off-white'
                  : 'bg-cream text-deep-navy hover:bg-[#D4C9BC]'
              }`}
              onClick={() => setImportFormat('ascii')}
            >
              <FileText size={12} />
              ASCII Tab
            </button>
            {importFormat === 'sif' && (
              <button
                type="button"
                className="ml-2 text-xs text-teal-green hover:underline"
                onClick={handleLoadExample}
              >
                Load Example
              </button>
            )}
          </div>

          {/* Format description */}
          {importFormat === 'sif' ? (
            <div className="bg-cream rounded-lg p-3 mb-3 text-xs text-deep-navy">
              <p className="font-medium mb-1">Screenshot Format (SIF)</p>
              <p className="text-light-gray">
                Paste the structured format I generate from Songsterr screenshots.
                Includes tempo, time signature, chords, lyrics, and precise note durations.
              </p>
            </div>
          ) : (
            <div className="bg-cream rounded-lg p-3 mb-3 text-xs text-deep-navy">
              <p className="font-medium mb-1">ASCII Tab Format</p>
              <p className="text-light-gray">
                Paste standard ASCII tabs from Ultimate Guitar, etc.
                Basic note positions only (no timing/lyrics).
              </p>
            </div>
          )}

          <textarea
            className="w-full px-4 py-3 text-sm font-mono border-2 border-[#D4C9BC] rounded-lg bg-off-white text-deep-navy outline-none focus:border-deep-navy resize-y"
            rows={12}
            placeholder={importFormat === 'sif'
              ? `# Section: Verse 1
# Tempo: 120
# Time: 4/4
# Instruction: let ring
---
MEASURE 1 | Em
e0 B0 G2 D2 A0 : 4
G2 D2 : 8
e0 B0 : 8 | "Mir-"

MEASURE 2 | B7
e2 : 8
e0 B2 G1 : 4 | "rors"`
              : `e|---0-----0-----0-----0---|
B|---1-----1-----1-----1---|
G|---0-----2-----0-----2---|
D|---2-----2-----2-----2---|
A|---3-----------3---------|
E|-------------------------|`}
            value={importText}
            onChange={(e) => {
              setImportText(e.target.value)
              setImportError(null)
            }}
          />

          {importError && (
            <p className="text-coral text-sm mt-2">{importError}</p>
          )}

          <div className="flex items-center gap-3 mt-3">
            <Button
              type="button"
              onClick={handleImport}
              disabled={!importText.trim()}
            >
              Import & Convert
            </Button>
            <span className="text-xs text-light-gray">
              Converts to visual tablature format
            </span>
          </div>
        </div>
      )}

      {/* Edit mode */}
      {mode === 'edit' && (
        <>
          {/* Tuning selector */}
          <div className="flex items-center gap-3 mb-4">
            <label className="text-sm font-medium text-deep-navy">Tuning:</label>
            <input
              type="text"
              className="w-40 px-2 py-1 text-sm border-2 border-[#D4C9BC] rounded-lg bg-off-white text-deep-navy font-mono"
              placeholder="E A D G B E"
              value={tablature?.tuning?.join(' ') || 'E A D G B E'}
              onChange={(e) => {
                const tuning = e.target.value.split(/\s+/).filter(Boolean)
                onChange({
                  ...tablature,
                  measures: tablature?.measures || [],
                  tuning: tuning.length === 6 ? tuning : undefined
                })
              }}
            />
          </div>

          {/* Measures */}
          {tablature?.measures?.map((measure, index) => (
            <MeasureEditor
              key={index}
              measure={measure}
              index={index}
              onChange={(m) => handleMeasureChange(index, m)}
              onDelete={() => handleDeleteMeasure(index)}
              isExpanded={expandedMeasures.has(index)}
              onToggleExpand={() => toggleMeasure(index)}
            />
          ))}

          {/* Add measure button */}
          <Button
            type="button"
            variant="secondary"
            className="flex items-center gap-2"
            onClick={handleAddMeasure}
          >
            <Music size={16} />
            Add Measure
          </Button>

          {/* Full preview */}
          {hasMeasures && (
            <div className="mt-6 pt-4 border-t-2 border-[#D4C9BC]">
              <label className="block text-sm font-medium text-deep-navy mb-2">Full Preview</label>
              <TabViewer tablature={tablature!} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
