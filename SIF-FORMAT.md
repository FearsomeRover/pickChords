# SIF - Songsterr Import Format

A structured text format for transcribing guitar tablature from screenshots or manually entering tab data.

## Format Reference

| Element | Syntax | Example |
|---------|--------|---------|
| Section | `# Section: name` | `# Section: Verse 1` |
| Tempo | `# Tempo: bpm` | `# Tempo: 120` |
| Time Sig | `# Time: sig` | `# Time: 4/4` |
| Instruction | `# Instruction: text` | `# Instruction: let ring` |
| Measure | `MEASURE n \| Chord \| instruction` | `MEASURE 1 \| Em \| palm mute` |
| Beat | `notes : duration \| "lyric"` | `e0 B0 G2 : 4 \| "Mir-"` |

## String Notation

- `e` = high E (1st string)
- `B` = B string (2nd string)
- `G` = G string (3rd string)
- `D` = D string (4th string)
- `A` = A string (5th string)
- `E` = low E (6th string)

Format: `{string}{fret}` - e.g., `e0` = open high E, `G2` = 2nd fret on G string

## Duration Values

- `1` = whole note
- `2` = half note
- `4` = quarter note
- `8` = eighth note
- `16` = sixteenth note

## Techniques

- `h` = hammer-on (e.g., `e0h2`)
- `p` = pull-off (e.g., `e2p0`)
- `/` = slide up (e.g., `e2/4`)
- `\` = slide down (e.g., `e4\2`)
- `b` = bend (e.g., `e7b`)
- `~` = vibrato (e.g., `e7~`)

## Complete Example

```sif
# Section: Intro
# Tempo: 100
# Time: 6/8
# Instruction: let ring

MEASURE 1 | Am
e0 A0 : 4
B1 G2 D2 : 8
e0 : 8 | "Hel-"
B1 : 8 | "lo"

MEASURE 2 | Em
e0 B0 : 4 | "world"
G0 D2 A2 E0 : 2

---

# Section: Verse 1

MEASURE 3 | C
e0 B1 G0 : 4 | "This"
D2 A3 : 8 | "is"
e0 : 8 | "a"

MEASURE 4 | G | palm mute
E3 A2 D0 G0 B0 e3 : 1 | "test"
```

## Notes

- Use `---` to separate sections visually (optional)
- Multiple notes on the same beat are space-separated
- Chord names after `MEASURE n |` are optional
- Instructions after the chord are optional
- Lyrics are quoted and placed after `|`
- Empty measures can be written as just `MEASURE n`
