import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Chord, StringData } from '../types'
import { useAuth } from '../hooks/useAuth'
import { useIsMobile } from '../hooks/useIsMobile'
import { useChords, useCreateChord, useUpdateChord, useDeleteChord } from '../hooks/useQueries'
import ChordDiagram from '../components/ChordDiagram'

function ChordsPage() {
  const { user } = useAuth()
  const isMobile = useIsMobile()
  const [searchParams, setSearchParams] = useSearchParams()
  const searchTerm = searchParams.get('search') || ''
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm)

  const { data: chords = [], isLoading, error } = useChords(debouncedSearch)
  const createChordMutation = useCreateChord()
  const updateChordMutation = useUpdateChord()
  const deleteChordMutation = useDeleteChord()

  // Modals
  const [showChordModal, setShowChordModal] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)

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

  const isAdmin = user?.is_admin === true

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (openMenuId !== null) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [openMenuId])

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
    setOpenMenuId(null)
  }

  const closeChordModal = () => {
    setShowChordModal(false)
    setEditingChordId(null)
    setChordForm({ name: '', strings: Array(6).fill({ fret: 0 }), rawInputs: Array(6).fill('0') })
  }

  const handleSaveChord = () => {
    if (!chordForm.name.trim()) return

    const data = {
      name: chordForm.name.trim(),
      strings: chordForm.strings,
    }

    if (editingChordId) {
      updateChordMutation.mutate(
        { id: editingChordId, ...data },
        {
          onSuccess: () => closeChordModal(),
          onError: (err) => alert('Failed to save chord: ' + (err instanceof Error ? err.message : 'Unknown error')),
        }
      )
    } else {
      createChordMutation.mutate(data, {
        onSuccess: () => closeChordModal(),
        onError: (err) => alert('Failed to save chord: ' + (err instanceof Error ? err.message : 'Unknown error')),
      })
    }
  }

  const handleDeleteChord = (id: number) => {
    if (!confirm('Delete this chord?')) return

    deleteChordMutation.mutate(id, {
      onError: (err) => alert('Failed to delete chord: ' + (err instanceof Error ? err.message : 'Unknown error')),
    })
    setOpenMenuId(null)
  }

  const handleSearchChange = (value: string) => {
    if (value) {
      setSearchParams({ search: value })
    } else {
      setSearchParams({})
    }
    setTimeout(() => setDebouncedSearch(value), 300)
  }

  if (isLoading && chords.length === 0) {
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
          Error: {error instanceof Error ? error.message : 'Failed to load chords'}
        </div>
      )}

      {chords.length === 0 ? (
        <div className="text-center text-light-gray text-xl py-10">
          No chords found. {isAdmin && 'Add some chords to get started!'}
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-6">
          {chords.map((chord) => (
            <div key={chord.id} className="bg-off-white rounded-xl p-5 text-center transition-all duration-200 border-2 border-[#D4C9BC] hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,22,45,0.1)] hover:border-deep-navy relative">
              {/* 3-dot menu for admins (hidden on mobile) */}
              {isAdmin && !isMobile && (
                <div className="absolute top-3 right-3">
                  <button
                    className="w-8 h-8 flex items-center justify-center bg-off-white text-deep-navy rounded-lg border-2 border-[#D4C9BC] transition-all duration-200 hover:border-deep-navy cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpenMenuId(openMenuId === chord.id ? null : chord.id)
                    }}
                  >
                    &#x22EE;
                  </button>
                  {openMenuId === chord.id && (
                    <div className="absolute right-0 top-10 bg-off-white rounded-lg shadow-lg border-2 border-[#D4C9BC] z-10 min-w-[120px]">
                      <button
                        className="w-full px-4 py-2 text-left text-sm text-deep-navy hover:bg-cream transition-all duration-200 border-0 cursor-pointer"
                        onClick={() => openEditChordModal(chord)}
                      >
                        Edit
                      </button>
                      <button
                        className="w-full px-4 py-2 text-left text-sm text-[#D64545] hover:bg-cream transition-all duration-200 border-0 cursor-pointer"
                        onClick={() => handleDeleteChord(chord.id)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
              <h3 className="mb-4 text-2xl text-teal-green">{chord.name}</h3>
              <div className="flex justify-center">
                <ChordDiagram chord={chord} width={180} height={220} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Only show add button for admins (hidden on mobile) */}
      {isAdmin && !isMobile && (
        <button
          className="fixed bottom-[30px] right-[30px] w-[60px] h-[60px] rounded-full border-0 bg-deep-navy text-off-white text-3xl cursor-pointer shadow-[0_4px_12px_rgba(0,22,45,0.4)] transition-all duration-200 hover:scale-110 hover:bg-[#001a3d]"
          onClick={openAddChordModal}
        >
          +
        </button>
      )}

      {!isMobile && showChordModal && (
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
                disabled={createChordMutation.isPending || updateChordMutation.isPending}
              >
                {createChordMutation.isPending || updateChordMutation.isPending
                  ? 'Saving...'
                  : editingChordId
                  ? 'Save'
                  : 'Add Chord'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ChordsPage
