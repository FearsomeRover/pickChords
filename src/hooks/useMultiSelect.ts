import { useState, useCallback } from 'react'

interface UseMultiSelectReturn<T> {
  selected: T[]
  toggle: (item: T) => void
  isSelected: (item: T) => boolean
  selectAll: (items: T[]) => void
  clear: () => void
  setSelected: (items: T[]) => void
}

export function useMultiSelect<T>(
  initialSelected: T[] = [],
  compareFn: (a: T, b: T) => boolean = (a, b) => a === b
): UseMultiSelectReturn<T> {
  const [selected, setSelected] = useState<T[]>(initialSelected)

  const isSelected = useCallback(
    (item: T) => selected.some((s) => compareFn(s, item)),
    [selected, compareFn]
  )

  const toggle = useCallback(
    (item: T) => {
      setSelected((prev) =>
        prev.some((s) => compareFn(s, item))
          ? prev.filter((s) => !compareFn(s, item))
          : [...prev, item]
      )
    },
    [compareFn]
  )

  const selectAll = useCallback((items: T[]) => {
    setSelected(items)
  }, [])

  const clear = useCallback(() => {
    setSelected([])
  }, [])

  return {
    selected,
    toggle,
    isSelected,
    selectAll,
    clear,
    setSelected,
  }
}
