import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Chord, StringData } from '../types'
import { useApi } from '../hooks/useApi'
import ChordDiagram from '../components/ChordDiagram'

function ChordsPage() {
  const api = useApi()
  const [searchParams, setSearchParams] = useSearchParams()
  const searchTerm = searchParams.get('search') || ''

  const [chords, setChords] = useState<Chord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modals
  const [showChordModal, setShowChordModal] = useState(false)

  // Chord form (for add/edit)
  const [editingChordId, setEditingChordId] = useState<number | null>(null)
  const [chordForm, setChordForm] = useState<{
    name: string
    strings: StringData[]
    rawInputs: string[]
  }>({
    name: '',
    strings: Array(6).fill({ fret: 0 }),
    rawInputs: Array(6).fill('0'),
  })

  const fetchChords = useCallback(async (search = '') => {
    try {
      setLoading(true)
      const url = search
        ? `/api/chords?search=${encodeURIComponent(search)}`
        : '/api/chords'
      const data = await api.get<Chord[]>(url)
      setChords(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch chords')
    } finally {
      setLoading(false)
    }
  }, [api])

  // Fetch chords on mount
  useEffect(() => {
    fetchChords(searchTerm)
  }, [])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => fetchChords(searchTerm), 300)
    return () => clearTimeout(timer)
  }, [searchTerm, fetchChords])

  const parseStringInput = (value: string): StringData => {
    const trimmed = value.trim().toLowerCase()
    if (trimmed === '' || trimmed === '0') return { fret: 0 }
    if (trimmed.includes('x')) return { fret: 'x' }

    const parts = trimmed.split('-')
    const fret = parseInt(parts[0], 10)
    if (isNaN(fret)) return { fret: 0 }

    if (parts.length > 1) {
      const finger = parseInt(parts[1], 10)
      return { fret, finger: isNaN(finger) ? undefined : finger }
    }
    return { fret }
  }

  const handleStringChange = (index: number, value: string) => {
    const newStrings = [...chordForm.strings]
    const newRawInputs = [...chordForm.rawInputs]
    newStrings[index] = parseStringInput(value)
    newRawInputs[index] = value
    setChordForm({ ...chordForm, strings: newStrings, rawInputs: newRawInputs })
  }

  const getStringDisplayValue = (stringData: StringData): string => {
    if (stringData.fret === 'x') return 'x'
    if (stringData.fret === 0) return '0'
    if (stringData.finger) return `${stringData.fret}-${stringData.finger}`
    return String(stringData.fret)
  }

  const openAddChordModal = () => {
    setEditingChordId(null)
    setChordForm({ name: '', strings: Array(6).fill({ fret: 0 }), rawInputs: Array(6).fill('0') })
    setShowChordModal(true)
  }

  const openEditChordModal = (chord: Chord) => {
    setEditingChordId(chord.id)
    setChordForm({
      name: chord.name,
      strings: [...chord.strings],
      rawInputs: chord.strings.map(getStringDisplayValue),
    })
    setShowChordModal(true)
  }

  const closeChordModal = () => {
    setShowChordModal(false)
    setEditingChordId(null)
    setChordForm({ name: '', strings: Array(6).fill({ fret: 0 }), rawInputs: Array(6).fill('0') })
  }

  const handleSaveChord = async () => {
    if (!chordForm.name.trim()) return

    try {
      if (editingChordId) {
        await api.put(`/api/chords/${editingChordId}`, {
          name: chordForm.name.trim(),
          strings: chordForm.strings,
        })
      } else {
        await api.post('/api/chords', {
          name: chordForm.name.trim(),
          strings: chordForm.strings,
        })
      }

      closeChordModal()
      fetchChords(searchTerm)
    } catch (err) {
      alert('Failed to save chord: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  const handleDeleteChord = async (id: number) => {
    if (!confirm('Delete this chord?')) return

    try {
      await api.del(`/api/chords/${id}`)
      fetchChords(searchTerm)
    } catch (err) {
      alert('Failed to delete chord: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  const handleSearchChange = (value: string) => {
    if (value) {
      setSearchParams({ search: value })
    } else {
      setSearchParams({})
    }
  }

  if (loading && chords.length === 0) {
    return <div className="text-center py-10 text-light-gray">Loading...</div>
  }

  return (
    <>
      <div className="mb-5">
        <input
          type="text"
          className="w-full max-w-md px-4 py-3 text-base border-2 border-[#D4C9BC] rounded-lg bg-off-white text-deep-navy outline-none transition-all duration-200 focus:border-deep-navy focus:shadow-[0_0_0_3px_rgba(0,22,45,0.1)] placeholder:text-light-gray"
          placeholder="Search chords..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      {error && (
        <div className="text-[#D64545] bg-[rgba(214,69,69,0.1)] border-2 border-[#D64545] rounded-lg text-center p-5">
          Error: {error}
        </div>
      )}

      {chords.length === 0 ? (
        <div className="text-center text-light-gray text-xl py-10">
          No chords found. Add some chords to get started!
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-6">
          {chords.map((chord) => (
            <div key={chord.id} className="bg-off-white rounded-xl p-5 text-center transition-all duration-200 border-2 border-[#D4C9BC] hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,22,45,0.1)] hover:border-deep-navy">
              <h3 className="mb-4 text-2xl text-teal-green">{chord.name}</h3>
              <div className="flex justify-center">
                <ChordDiagram chord={chord} width={180} height={220} />
              </div>
              <div className="flex gap-2 justify-center mt-3">
                <button
                  className="text-[0.85rem] px-3 py-1.5 text-base rounded-lg font-medium bg-deep-navy text-off-white transition-all duration-200 hover:bg-[#001a3d] border-0 cursor-pointer"
                  onClick={() => openEditChordModal(chord)}
                >
                  Edit
                </button>
                <button
                  className="text-[0.85rem] px-3 py-1.5 text-base rounded-lg font-medium bg-deep-navy text-off-white transition-all duration-200 hover:bg-[#001a3d] border-0 cursor-pointer"
                  onClick={() => handleDeleteChord(chord.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        className="fixed bottom-[30px] right-[30px] w-[60px] h-[60px] rounded-full border-0 bg-deep-navy text-off-white text-3xl cursor-pointer shadow-[0_4px_12px_rgba(0,22,45,0.4)] transition-all duration-200 hover:scale-110 hover:bg-[#001a3d]"
        onClick={openAddChordModal}
      >
        +
      </button>

      {showChordModal && (
        <div className="fixed inset-0 bg-[rgba(15,27,46,0.7)] backdrop-blur-sm flex items-center justify-center z-[1000]" onClick={closeChordModal}>
          <div className="bg-off-white rounded-2xl p-8 max-w-[500px] w-[90%] max-h-[90vh] overflow-y-auto border-2 border-[#D4C9BC] shadow-[0_12px_48px_rgba(15,27,46,0.2)]" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-5 text-deep-navy">{editingChordId ? 'Edit Chord' : 'Add New Chord'}</h2>

            <div className="mb-5">
              <label className="block mb-2 font-medium text-deep-navy">Chord Name</label>
              <input
                type="text"
                placeholder="e.g., Am7, Gmaj7, F#m"
                value={chordForm.name}
                onChange={(e) => setChordForm({ ...chordForm, name: e.target.value })}
                className="w-full px-3.5 py-2.5 text-base border-2 border-[#D4C9BC] rounded-lg bg-off-white text-deep-navy outline-none focus:border-deep-navy focus:shadow-[0_0_0_3px_rgba(0,22,45,0.1)] placeholder:text-light-gray"
              />
            </div>

            <div className="mb-5">
              <label className="block mb-2 font-medium text-deep-navy">String Positions (low E to high E)</label>
              <div className="grid grid-cols-6 gap-2.5">
                {['E', 'A', 'D', 'G', 'B', 'e'].map((stringName, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <label className="text-[0.85rem] text-light-gray mb-1">{stringName}</label>
                    <input
                      type="text"
                      placeholder="0"
                      value={chordForm.rawInputs[i]}
                      onChange={(e) => handleStringChange(i, e.target.value)}
                      className="w-[50px] text-center px-2 py-2 text-base border-2 border-[#D4C9BC] rounded-lg bg-off-white text-deep-navy outline-none focus:border-deep-navy focus:shadow-[0_0_0_3px_rgba(0,22,45,0.1)]"
                    />
                  </div>
                ))}
              </div>
              <p className="text-[0.85rem] text-light-gray mt-2">
                Use: x = muted, 0 = open, or fret-finger (e.g., "2-1" for fret 2, finger 1)
              </p>
            </div>

            <div className="mt-5 mb-5">
              <p className="text-[0.85rem] text-light-gray mb-2.5 mt-0">Preview:</p>
              <div className="flex justify-center">
                <ChordDiagram chord={chordForm} />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                className="px-5 py-2.5 text-base rounded-lg font-medium bg-deep-navy text-off-white transition-all duration-200 hover:bg-[#001a3d] border-0 cursor-pointer"
                onClick={closeChordModal}
              >
                Cancel
              </button>
              <button
                className="px-5 py-2.5 text-base rounded-lg font-medium bg-deep-navy text-off-white transition-all duration-200 hover:bg-[#001a3d] hover:shadow-[0_4px_12px_rgba(0,22,45,0.3)] border-0 cursor-pointer"
                onClick={handleSaveChord}
              >
                {editingChordId ? 'Save' : 'Add Chord'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ChordsPage
