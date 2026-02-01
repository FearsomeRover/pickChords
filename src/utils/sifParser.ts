import { SongTablature, TabMeasure, TabBeat, TabNote, TabTechnique } from '../types'

/**
 * Songsterr Import Format (SIF) Parser
 *
 * A human-readable format that can be generated from Songsterr screenshots
 * and parsed into the structured tablature format.
 *
 * FORMAT:
 * -------
 * # Section: Verse 1
 * # Tempo: 120
 * # Time: 4/4
 * # Tuning: E A D G B E
 * ---
 * MEASURE 1 | Em | let ring
 * e0 B0 G2 D2 A0 : 4
 * B0 G2 : 8
 * e0 B0 : 8 | "Mir-"
 *
 * MEASURE 2 | B7
 * e2 : 8
 * e0 B2 G1 : 4 | "rors"
 *
 * STRING NOTATION:
 * - e = high E string (string 0)
 * - B = B string (string 1)
 * - G = G string (string 2)
 * - D = D string (string 3)
 * - A = A string (string 4)
 * - E = low E string (string 5)
 *
 * TECHNIQUES (append to fret):
 * - h = hammer-on (e2h)
 * - p = pull-off (e0p)
 * - / = slide up (e5/)
 * - \ = slide down (e7\)
 * - b = bend (e7b)
 * - ~ = vibrato (e5~)
 *
 * DURATION:
 * - 1 = whole note
 * - 2 = half note
 * - 4 = quarter note
 * - 8 = eighth note
 * - 16 = sixteenth note
 */

// Map string letter to index
const STRING_MAP: Record<string, number> = {
  'e': 0, // high E
  'B': 1,
  'G': 2,
  'D': 3,
  'A': 4,
  'E': 5, // low E
}

interface ParsedMetadata {
  section?: string
  tempo?: number
  timeSignature?: string
  tuning?: string[]
  instruction?: string
}

// Parse a note like "e0", "B2h", "G12b"
function parseNoteToken(token: string): TabNote | null {
  const match = token.match(/^([eBGDAE])(\d+)([hpb\/\\~])?$/)
  if (!match) return null

  const [, stringLetter, fretStr, techStr] = match
  const stringIndex = STRING_MAP[stringLetter]
  if (stringIndex === undefined) return null

  const fret = parseInt(fretStr, 10)
  if (isNaN(fret) || fret < 0 || fret > 24) return null

  const technique = techStr as TabTechnique | undefined

  return { string: stringIndex, fret, technique }
}

// Parse a beat line like "e0 B0 G2 D2 A0 : 4 | "Mir-""
function parseBeatLine(line: string): TabBeat | null {
  // Split by | to separate notes+duration from lyric
  const parts = line.split('|').map(p => p.trim())
  const mainPart = parts[0]
  const lyricPart = parts[1]

  // Extract lyric if present (quoted)
  let lyric: string | undefined
  if (lyricPart) {
    const lyricMatch = lyricPart.match(/"([^"]*)"/)
    if (lyricMatch) {
      lyric = lyricMatch[1]
    }
  }

  // Split main part by : to get notes and duration
  const [notesPart, durationPart] = mainPart.split(':').map(p => p.trim())
  if (!notesPart) return null

  // Parse duration (default to 8 if not specified)
  const duration = durationPart ? parseInt(durationPart, 10) : 8
  if (![1, 2, 4, 8, 16].includes(duration)) return null

  // Parse notes
  const noteTokens = notesPart.split(/\s+/).filter(Boolean)
  const notes: TabNote[] = []

  for (const token of noteTokens) {
    const note = parseNoteToken(token)
    if (note) {
      notes.push(note)
    }
  }

  if (notes.length === 0) return null

  return { notes, duration, lyric }
}

// Parse measure header like "MEASURE 1 | Em | let ring"
function parseMeasureHeader(line: string): { number?: number; chord?: string; instruction?: string } {
  const parts = line.replace(/^MEASURE\s*/i, '').split('|').map(p => p.trim())

  const result: { number?: number; chord?: string; instruction?: string } = {}

  if (parts[0]) {
    const num = parseInt(parts[0], 10)
    if (!isNaN(num)) result.number = num
  }
  if (parts[1]) result.chord = parts[1]
  if (parts[2]) result.instruction = parts[2]

  return result
}

/**
 * Parse Songsterr Import Format (SIF) text into structured tablature
 */
export function parseSIF(text: string): SongTablature | null {
  const lines = text.split('\n').map(l => l.trim())

  const metadata: ParsedMetadata = {}
  const measures: TabMeasure[] = []
  let currentMeasure: TabMeasure | null = null
  let inMeasures = false

  for (const line of lines) {
    // Skip empty lines
    if (!line) continue

    // Metadata lines (before ---)
    if (line.startsWith('#') && !inMeasures) {
      const match = line.match(/^#\s*(\w+):\s*(.+)$/i)
      if (match) {
        const [, key, value] = match
        const keyLower = key.toLowerCase()

        if (keyLower === 'section') metadata.section = value
        else if (keyLower === 'tempo') metadata.tempo = parseInt(value, 10)
        else if (keyLower === 'time') metadata.timeSignature = value
        else if (keyLower === 'tuning') metadata.tuning = value.split(/\s+/)
        else if (keyLower === 'instruction') metadata.instruction = value
      }
      continue
    }

    // Separator
    if (line === '---') {
      inMeasures = true
      continue
    }

    // After separator or if we see MEASURE, we're in measures section
    if (line.toUpperCase().startsWith('MEASURE')) {
      inMeasures = true

      // Save previous measure
      if (currentMeasure && currentMeasure.beats.length > 0) {
        measures.push(currentMeasure)
      }

      // Start new measure
      const header = parseMeasureHeader(line)
      currentMeasure = {
        beats: [],
        number: header.number || measures.length + 1,
        section: measures.length === 0 ? metadata.section : undefined,
        tempo: measures.length === 0 ? metadata.tempo : undefined,
        timeSignature: measures.length === 0 ? metadata.timeSignature : undefined,
        instructions: header.instruction
          ? [header.instruction]
          : (measures.length === 0 && metadata.instruction ? [metadata.instruction] : undefined)
      }

      // If chord specified in header, we'll apply it to first beat
      if (header.chord && currentMeasure) {
        (currentMeasure as any)._pendingChord = header.chord
      }

      continue
    }

    // Beat line (if we have a current measure)
    if (currentMeasure && inMeasures) {
      const beat = parseBeatLine(line)
      if (beat) {
        // Apply pending chord from measure header to first beat
        if ((currentMeasure as any)._pendingChord && currentMeasure.beats.length === 0) {
          beat.chord = (currentMeasure as any)._pendingChord
          delete (currentMeasure as any)._pendingChord
        }
        currentMeasure.beats.push(beat)
      }
    }
  }

  // Don't forget last measure
  if (currentMeasure && currentMeasure.beats.length > 0) {
    measures.push(currentMeasure)
  }

  if (measures.length === 0) {
    return null
  }

  return {
    measures,
    tuning: metadata.tuning
  }
}

/**
 * Generate example SIF from the screenshot the user provided
 */
export function generateSIFExample(): string {
  return `# Section: Verse 5
# Tempo: 120
# Time: 4/4
# Instruction: let ring
---
MEASURE 65 | Em
e0 B0 G2 D2 A0 : 4
G2 D2 : 8
e0 B0 : 8
e0 B0 G0 : 4
G2 : 8
e0 B0 G0 : 8
e0 B0 G0 D2 : 4 | "Mir-"
B2 : 8 | "rors"

MEASURE 66 | B7
e2 : 8
e0 B2 G1 : 4 | "on"
G2 D2 : 8 | "the"
e0 B2 : 4 | "cei-"
e2 : 8
e0 B2 G2 : 4 | "ling"
e0 B1 G1 : 8`
}
