import { SongTablature, TabSection } from '../types'

interface TabViewerProps {
  tablature: SongTablature
  highlightChord?: string  // chord name to highlight
}

// String names for standard tuning (high E to low E)
const STRING_NAMES = ['e', 'B', 'G', 'D', 'A', 'E']

// Technique symbols
const TECHNIQUE_SYMBOLS: Record<string, string> = {
  'h': 'h',  // hammer-on
  'p': 'p',  // pull-off
  '/': '/',  // slide up
  '\\': '\\', // slide down
  '~': '~',  // vibrato
  'b': 'b',  // bend
  'r': 'r',  // release
}

function TabSectionDisplay({ section, highlightChord }: { section: TabSection; highlightChord?: string }) {
  return (
    <div className="mb-6">
      {/* Section header */}
      <div className="flex items-center gap-4 mb-2">
        <h3 className="text-lg font-semibold text-deep-navy">{section.name}</h3>
        {section.tempo && (
          <span className="text-sm text-light-gray">♩ = {section.tempo}</span>
        )}
        {section.timeSignature && (
          <span className="text-sm text-light-gray">{section.timeSignature}</span>
        )}
      </div>

      {/* Instructions */}
      {section.instructions && section.instructions.length > 0 && (
        <div className="text-sm text-light-gray italic mb-2">
          {section.instructions.join(' • ')}
        </div>
      )}

      {/* Measures */}
      <div className="font-mono text-sm bg-cream rounded-lg p-4 overflow-x-auto">
        {section.measures.map((measure, measureIdx) => (
          <div key={measureIdx} className="inline-block mr-4 mb-4">
            {/* Chord name */}
            {measure.chordName && (
              <div className={`text-sm font-semibold mb-1 ${
                highlightChord === measure.chordName
                  ? 'text-teal-green'
                  : 'text-deep-navy'
              }`}>
                {measure.chordName}
              </div>
            )}

            {/* Tab lines */}
            <div className="text-deep-navy">
              {STRING_NAMES.map((stringName, stringIdx) => {
                const stringData = measure.strings[stringIdx]
                let content = ''

                if (stringData && stringData.notes) {
                  for (const note of stringData.notes) {
                    if (note === null || note.fret === null) {
                      content += '-'
                    } else {
                      const fretStr = note.fret.toString()
                      content += fretStr
                      if (note.technique) {
                        content += TECHNIQUE_SYMBOLS[note.technique] || ''
                      }
                    }
                  }
                } else {
                  content = '--------'
                }

                return (
                  <div key={stringIdx} className="flex">
                    <span className="w-4 text-light-gray">{stringName}</span>
                    <span className="text-light-gray">|</span>
                    <span>{content}</span>
                    <span className="text-light-gray">|</span>
                  </div>
                )
              })}
            </div>

            {/* Timing markers */}
            {measure.timingMarkers && measure.timingMarkers.length > 0 && (
              <div className="text-xs text-light-gray mt-1 ml-5">
                {measure.timingMarkers.join(' ')}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// Simple raw text display for ASCII tabs
function RawTabDisplay({ rawText }: { rawText: string }) {
  return (
    <div className="font-mono text-sm bg-cream rounded-lg p-4 overflow-x-auto whitespace-pre">
      {rawText}
    </div>
  )
}

export default function TabViewer({ tablature, highlightChord }: TabViewerProps) {
  // If we have raw text, display it directly
  if (tablature.rawText) {
    return (
      <div>
        {tablature.tuning && (
          <div className="text-sm text-light-gray mb-2">
            Tuning: {tablature.tuning.join(' ')}
          </div>
        )}
        <RawTabDisplay rawText={tablature.rawText} />
      </div>
    )
  }

  // Otherwise, render structured sections
  if (!tablature.sections || tablature.sections.length === 0) {
    return (
      <div className="text-light-gray text-center py-4">
        No tablature data available
      </div>
    )
  }

  return (
    <div>
      {tablature.tuning && tablature.tuning.join('') !== 'EADGBE' && (
        <div className="text-sm text-light-gray mb-4">
          Tuning: {tablature.tuning.join(' ')}
        </div>
      )}

      {tablature.sections.map((section, idx) => (
        <TabSectionDisplay
          key={idx}
          section={section}
          highlightChord={highlightChord}
        />
      ))}
    </div>
  )
}
