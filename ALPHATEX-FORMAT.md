# AlphaTex Format Reference

A text-based music notation format used by alphaTab. Use this reference to transcribe guitar tablature from images into valid alphaTex.

## Quick Reference

```
\tempo 120
\ts 4 4
\track "Guitar"
\staff {tabs}
\tuning E4 B3 G3 D3 A2 E2

:8 5.1{h} 7.1 7.1{p} 5.1 | :4 (0.1 0.2 2.3) r
```

## Note Format

**Single note:** `fret.string`
- Fret: 0-24
- String: 1-6 (1=high E, 6=low E)

| String | Number | Note |
|--------|--------|------|
| High E | 1 | Thinnest string |
| B | 2 | |
| G | 3 | |
| D | 4 | |
| A | 5 | |
| Low E | 6 | Thickest string |

**Examples:**
- `0.1` = open high E string
- `3.2` = 3rd fret on B string
- `5.6` = 5th fret on low E string
- `12.1` = 12th fret on high E string

## Duration

Duration is set with `:n` and applies to all following notes until changed.

| Duration | Symbol | Name |
|----------|--------|------|
| Whole | `:1` | 4 beats |
| Half | `:2` | 2 beats |
| Quarter | `:4` | 1 beat |
| Eighth | `:8` | 1/2 beat |
| Sixteenth | `:16` | 1/4 beat |
| Thirty-second | `:32` | 1/8 beat |

**Example:** `:8 5.1 7.1 5.1 7.1` = four eighth notes

## Chords (Multiple Notes)

Wrap simultaneous notes in parentheses:

```
(0.1 0.2 2.3 2.4 0.5)
```

This plays all notes at once (a chord).

## Rests

Use `r` for a rest (silence) with the current duration:

```
:4 5.1 r 5.1 r
```

## Bar Lines

Use `|` to separate measures:

```
:4 5.1 7.1 5.1 7.1 | 3.1 5.1 3.1 5.1
```

## Techniques

Append technique in curly braces directly after the note (no space):

| Technique | Syntax | Description |
|-----------|--------|-------------|
| Hammer-on | `{h}` | Slur to next higher note |
| Pull-off | `{p}` | Slur to next lower note |
| Slide | `{s}` | Slide to next note |
| Vibrato | `{v}` | Vibrato effect |
| Bend | `{b (0 4)}` | Bend up (0=start, 4=full step) |
| Let ring | `{lr}` | Let note ring |
| Palm mute | `{pm}` | Palm muted note |
| Dead note | `{x}` | Muted/ghost note |

**Examples:**
```
5.1{h} 7.1           // hammer-on from fret 5 to 7
7.1{p} 5.1           // pull-off from fret 7 to 5
5.1{s} 7.1           // slide from fret 5 to 7
7.1{v}               // vibrato on fret 7
7.1{b (0 4)}         // full bend on fret 7
(0.1{pm} 0.2{pm})    // palm muted chord
```

## Header/Metadata

Place at the beginning of the file:

```
\title "Song Name"
\artist "Artist Name"
\tempo 120
\ts 4 4
\track "Guitar"
\staff {tabs}
\tuning E4 B3 G3 D3 A2 E2
```

| Command | Description | Example |
|---------|-------------|---------|
| `\title` | Song title | `\title "Wonderwall"` |
| `\artist` | Artist name | `\artist "Oasis"` |
| `\tempo` | BPM | `\tempo 120` |
| `\ts` | Time signature | `\ts 4 4` or `\ts 6 8` |
| `\track` | Track name | `\track "Guitar"` |
| `\staff` | Staff type | `\staff {tabs}` |
| `\tuning` | String tuning | `\tuning E4 B3 G3 D3 A2 E2` |

## Common Tunings

| Tuning | AlphaTex |
|--------|----------|
| Standard | `\tuning E4 B3 G3 D3 A2 E2` |
| Drop D | `\tuning E4 B3 G3 D3 A2 D2` |
| Half step down | `\tuning Eb4 Bb3 Gb3 Db3 Ab2 Eb2` |
| Full step down | `\tuning D4 A3 F3 C3 G2 D2` |
| DADGAD | `\tuning D4 A3 G3 D3 A2 D2` |
| Open G | `\tuning D4 B3 G3 D3 G2 D2` |

## Complete Example

```
\title "Example Tab"
\tempo 100
\ts 4 4
\track "Guitar"
\staff {tabs}
\tuning E4 B3 G3 D3 A2 E2

:8 0.1 0.2 2.3 2.4 0.5 0.1 0.2 2.3 |
2.4 0.5 0.1 0.2 2.3 2.4 0.5 0.1 |
:4 (0.1 0.2 2.3 2.4 0.5) r :8 3.2 5.2{h} 7.2 5.2{p} 3.2 |
:4 (2.1 2.2 2.3 4.4 4.5 2.6) :2 r
```

## Transcription Tips for AI

When reading tablature from an image:

1. **Identify the strings** - Tab shows 6 horizontal lines. Top line = high E (string 1), bottom = low E (string 6)

2. **Read left to right** - Notes are played in sequence from left to right

3. **Vertical alignment = chord** - Numbers stacked vertically are played together, wrap in `()`

4. **Determine duration** - Look for rhythm notation above/below the tab:
   - Filled note head + stem = quarter or shorter
   - Beam connecting stems = eighth notes
   - Double beam = sixteenth notes
   - No rhythm shown = assume eighth notes (`:8`)

5. **Identify techniques** - Look for:
   - Arc between notes = hammer-on/pull-off (use `{h}` or `{p}`)
   - Diagonal line = slide (use `{s}`)
   - Wavy line = vibrato (use `{v}`)
   - Curved arrow = bend (use `{b (0 4)}`)
   - "PM" or dots = palm mute (use `{pm}`)

6. **Count measures** - Vertical lines through all strings = bar lines, use `|`

7. **Check tempo/time** - Look for BPM number and time signature at the start

## Output Template

Use this template when generating alphaTex:

```
\tempo [BPM]
\ts [BEATS] [NOTE_VALUE]
\track "Guitar"
\staff {tabs}
\tuning E4 B3 G3 D3 A2 E2

[NOTES AND MEASURES HERE]
```

Replace bracketed values with actual data from the image.
