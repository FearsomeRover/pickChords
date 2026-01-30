import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Chord, StringData } from '../types'
import { useAuth } from '../hooks/useAuth'
import { useIsMobile } from '../hooks/useIsMobile'
import { useChords, useCreateChord, useUpdateChord, useDeleteChord } from '../hooks/useQueries'
import ChordDiagram from '../components/ChordDiagram'
import ExpandableSearch from '../components/ExpandableSearch'
import { Modal, ModalFooter, FormInput, Button, ErrorCard, LoadingSpinner } from '../components/ui'

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
    return <LoadingSpinner />
  }

  return (
    <>
      <div className="mb-5">
        <ExpandableSearch
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search chords..."
        />
      </div>

      {error && (
        <ErrorCard
          message={error instanceof Error ? error.message : 'Failed to load chords'}
        />
      )}

      {chords.length === 0 ? (
        <div className="text-center text-light-gray text-xl py-10">
          No chords found. {isAdmin && 'Add some chords to get started!'}
        </div>
      ) : (
        <div className={`grid ${isMobile ? 'grid-cols-2 gap-4' : 'grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-6'}`}>
          {chords.map((chord) => (
            <div key={chord.id} className="flex justify-center">
              <ChordDiagram
                chord={chord}
                width={isMobile ? 120 : 180}
                height={isMobile ? 150 : 220}
                menuItems={isAdmin && !isMobile ? [
                  { label: 'Edit', onClick: () => openEditChordModal(chord), icon: <Pencil size={14} /> },
                  { label: 'Delete', onClick: () => handleDeleteChord(chord.id), danger: true, icon: <Trash2 size={14} /> },
                ] : undefined}
              />
            </div>
          ))}
        </div>
      )}

      {/* Only show add button for admins (hidden on mobile) */}
      {isAdmin && !isMobile && (
        <button
          className="fixed bottom-[30px] right-[30px] w-[60px] h-[60px] rounded-full border-0 bg-deep-navy text-off-white cursor-pointer shadow-[0_4px_12px_rgba(0,22,45,0.4)] transition-all duration-200 hover:scale-110 hover:bg-[#001a3d] flex items-center justify-center"
          onClick={openAddChordModal}
          title="Add new chord"
        >
          <Plus size={28} />
        </button>
      )}

      {!isMobile && (
        <Modal
          isOpen={showChordModal}
          onClose={closeChordModal}
          title={editingChordId ? 'Edit Chord' : 'Add New Chord'}
          size="md"
        >
          <FormInput
            label="Chord Name"
            placeholder="e.g., Am7, Gmaj7, F#m"
            value={chordForm.name}
            onChange={(e) => setChordForm({ ...chordForm, name: e.target.value })}
          />

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

          <ModalFooter>
            <Button variant="secondary" onClick={closeChordModal}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveChord}
              loading={createChordMutation.isPending || updateChordMutation.isPending}
            >
              {editingChordId ? 'Save' : 'Add Chord'}
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </>
  )
}

export default ChordsPage
