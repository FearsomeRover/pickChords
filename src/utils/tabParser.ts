import { SongTablature, TabMeasure, TabBeat, TabTechnique } from '../types'

/**
 * Parse ASCII guitar tablature into structured format
 *
 * Supports formats like:
 * e|---0-----0-----0-----0---|
 * B|---1-----1-----1-----1---|
 * G|---0-----2-----0-----2---|
 * D|---2-----2-----2-----2---|
 * A|---3-----------3---------|
 * E|-------------------------|
 */

// Map string identifier to index (0=high e, 5=low E)
function getStringIndex(line: string): number {
  const trimmed = line.trim()

  // Check for standard tuning patterns
  if (/^e\|/i.test(trimmed) && trimmed[0] === 'e') return 0  // lowercase e = high e
  if (/^B\|/i.test(trimmed)) return 1
  if (/^G\|/i.test(trimmed)) return 2
  if (/^D\|/i.test(trimmed)) return 3
  if (/^A\|/i.test(trimmed)) return 4
  if (/^E\|/i.test(trimmed) && trimmed[0] === 'E') return 5  // uppercase E = low E

  return -1
}

// Extract the tab content after the string identifier
function extractTabContent(line: string): string {
  const match = line.match(/^[eEBGDA]\|(.*)/)
  return match ? match[1] : ''
}

// Detect technique symbol
function parseTechnique(char: string): TabTechnique | undefined {
  const techniques: Record<string, TabTechnique> = {
    'h': 'h',
    'p': 'p',
    '/': '/',
    '\\': '\\',
    's': '/',  // slide (alternative)
    '~': '~',
    'b': 'b',
    'r': 'r',
  }
  return techniques[char.toLowerCase()]
}

interface ParsedNote {
  stringIndex: number
  fret: number
  technique?: TabTechnique
  position: number  // character position in the line
}

// Parse a single string line into notes with positions
function parseStringLine(content: string, stringIndex: number): ParsedNote[] {
  const notes: ParsedNote[] = []
  let i = 0

  while (i < content.length) {
    const char = content[i]

    // Check for fret number (can be 1-2 digits)
    if (/\d/.test(char)) {
      let fretStr = char
      let nextIdx = i + 1

      // Check for two-digit fret (10-24)
      if (nextIdx < content.length && /\d/.test(content[nextIdx])) {
        fretStr += content[nextIdx]
        nextIdx++
      }

      const fret = parseInt(fretStr, 10)

      // Check for technique after fret number
      let technique: TabTechnique | undefined
      if (nextIdx < content.length) {
        technique = parseTechnique(content[nextIdx])
      }

      notes.push({
        stringIndex,
        fret,
        technique,
        position: i
      })

      i = nextIdx
    } else {
      i++
    }
  }

  return notes
}

// Group notes by position into beats
function groupNotesIntoBeats(allNotes: ParsedNote[]): TabBeat[] {
  // Group by position
  const positionMap = new Map<number, ParsedNote[]>()

  for (const note of allNotes) {
    const existing = positionMap.get(note.position) || []
    existing.push(note)
    positionMap.set(note.position, existing)
  }

  // Sort positions and create beats
  const positions = Array.from(positionMap.keys()).sort((a, b) => a - b)

  return positions.map(pos => {
    const notesAtPos = positionMap.get(pos)!
    return {
      notes: notesAtPos.map(n => ({
        string: n.stringIndex,
        fret: n.fret,
        technique: n.technique
      })),
      duration: 8  // Default to eighth notes
    }
  })
}

// Split content into measures by | character
function splitIntoMeasures(lines: string[]): string[][] {
  // Find measure boundaries (| characters that appear in all lines at same position)
  const contents = lines.map(extractTabContent)
  const minLength = Math.min(...contents.map(c => c.length))

  const measureBoundaries: number[] = [0]

  for (let i = 0; i < minLength; i++) {
    // Check if all lines have | at this position
    if (contents.every(c => c[i] === '|')) {
      measureBoundaries.push(i + 1)  // Start after the |
    }
  }

  // If no boundaries found, treat whole thing as one measure
  if (measureBoundaries.length === 1) {
    return [contents]
  }

  // Split each line by boundaries
  const measures: string[][] = []

  for (let m = 0; m < measureBoundaries.length; m++) {
    const start = measureBoundaries[m]
    const end = m < measureBoundaries.length - 1 ? measureBoundaries[m + 1] - 1 : undefined

    const measureContent = contents.map(c => c.slice(start, end))

    // Skip empty measures
    if (measureContent.some(c => /\d/.test(c))) {
      measures.push(measureContent)
    }
  }

  return measures
}

/**
 * Parse ASCII tablature text into structured format
 */
export function parseAsciiTab(text: string): SongTablature | null {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  // Find lines that look like tab strings
  const tabLines: { line: string; stringIndex: number }[] = []

  for (const line of lines) {
    const stringIndex = getStringIndex(line)
    if (stringIndex >= 0) {
      tabLines.push({ line, stringIndex })
    }
  }

  // Need at least some strings to parse
  if (tabLines.length === 0) {
    return null
  }

  // Sort by string index to get correct order
  tabLines.sort((a, b) => a.stringIndex - b.stringIndex)

  // Group consecutive tab lines (handle multiple sections)
  const tabSections: typeof tabLines[] = []
  let currentSection: typeof tabLines = []
  let lastStringIndex = -1

  for (const tl of tabLines) {
    // If we see string 0 again or index goes backwards, start new section
    if (tl.stringIndex <= lastStringIndex && currentSection.length > 0) {
      tabSections.push(currentSection)
      currentSection = []
    }
    currentSection.push(tl)
    lastStringIndex = tl.stringIndex
  }
  if (currentSection.length > 0) {
    tabSections.push(currentSection)
  }

  // Parse each section
  const allMeasures: TabMeasure[] = []
  let measureNumber = 1

  for (const section of tabSections) {
    const sectionLines = section.map(s => s.line)
    const measureContents = splitIntoMeasures(sectionLines)

    for (const measureContent of measureContents) {
      // Parse each string line in this measure
      const allNotes: ParsedNote[] = []

      for (let i = 0; i < measureContent.length && i < section.length; i++) {
        const content = measureContent[i]
        const stringIndex = section[i].stringIndex
        const notes = parseStringLine(content, stringIndex)
        allNotes.push(...notes)
      }

      // Group into beats
      const beats = groupNotesIntoBeats(allNotes)

      if (beats.length > 0) {
        allMeasures.push({
          beats,
          number: measureNumber++
        })
      }
    }
  }

  if (allMeasures.length === 0) {
    return null
  }

  return {
    measures: allMeasures
  }
}

/**
 * Convert structured tablature back to ASCII format for display
 */
export function tablatureToAscii(tablature: SongTablature): string {
  const STRING_NAMES = ['e', 'B', 'G', 'D', 'A', 'E']
  const lines: string[] = STRING_NAMES.map(name => `${name}|`)

  for (const measure of tablature.measures) {
    for (const beat of measure.beats) {
      // Determine what's on each string at this beat
      const stringFrets: (string | null)[] = Array(6).fill(null)

      for (const note of beat.notes) {
        if (note.string >= 0 && note.string < 6) {
          let fretStr = note.fret.toString()
          if (note.technique) fretStr += note.technique
          stringFrets[note.string] = fretStr
        }
      }

      // Find max width for this beat column
      const maxWidth = Math.max(2, ...stringFrets.map(f => f?.length || 1))

      // Add to each string line
      for (let s = 0; s < 6; s++) {
        const fret = stringFrets[s]
        if (fret) {
          lines[s] += fret.padEnd(maxWidth, '-')
        } else {
          lines[s] += '-'.repeat(maxWidth)
        }
      }
    }

    // Add measure separator
    for (let s = 0; s < 6; s++) {
      lines[s] += '|'
    }
  }

  return lines.join('\n')
}
