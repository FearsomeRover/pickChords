import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Song, Chord, Tag, LogEntry, LogLevel, SongProgress, ProgressStatus } from '../types'
import { useApi } from './useApi'

// Query keys
export const queryKeys = {
  songs: (params?: { search?: string; tag?: number | null }) =>
    ['songs', params] as const,
  song: (id: number) => ['song', id] as const,
  chords: (search?: string) => ['chords', search] as const,
  tags: () => ['tags'] as const,
  logs: (params?: { level?: LogLevel; action?: string; limit?: number; offset?: number }) =>
    ['logs', params] as const,
  progress: () => ['progress'] as const,
  progressItem: (songId: number) => ['progress', songId] as const,
}

// Songs queries
export function useSongs(params?: { search?: string; tag?: number | null }) {
  const api = useApi()

  return useQuery({
    queryKey: queryKeys.songs(params),
    queryFn: async () => {
      let url = '/api/songs'
      const queryParams: string[] = []
      if (params?.search) queryParams.push(`search=${encodeURIComponent(params.search)}`)
      if (params?.tag) queryParams.push(`tag=${params.tag}`)
      if (queryParams.length > 0) {
        url += '?' + queryParams.join('&')
      }
      return api.get<Song[]>(url)
    },
  })
}

export function useSong(id: number | undefined) {
  const api = useApi()

  return useQuery({
    queryKey: queryKeys.song(id!),
    queryFn: () => api.get<Song>(`/api/songs/${id}`),
    enabled: !!id,
  })
}

// Chords queries
export function useChords(search?: string) {
  const api = useApi()

  return useQuery({
    queryKey: queryKeys.chords(search),
    queryFn: async () => {
      let url = '/api/chords'
      if (search) url += `?search=${encodeURIComponent(search)}`
      return api.get<Chord[]>(url)
    },
  })
}

// Tags queries
export function useTags() {
  const api = useApi()

  return useQuery({
    queryKey: queryKeys.tags(),
    queryFn: () => api.get<Tag[]>('/api/tags'),
  })
}

// Song mutations
export function useCreateSong() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      name: string
      artist?: string
      notes?: string
      capo?: number
      links?: string[]
      chord_ids?: number[]
      tag_ids?: number[]
    }) => api.post<Song>('/api/songs', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songs'] })
    },
  })
}

export function useUpdateSong() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...data }: {
      id: number
      name: string
      artist?: string
      notes?: string
      capo?: number
      links?: string[]
      chord_ids?: number[]
      tag_ids?: number[]
      strumming_pattern?: any
    }) => api.put<Song>(`/api/songs/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.song(variables.id) })
      queryClient.invalidateQueries({ queryKey: ['songs'] })
    },
  })
}

// Optimistic update for reordering chords
export function useReorderChords() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ songId, song, newChordIds }: {
      songId: number
      song: Song
      newChordIds: number[]
    }) => {
      return api.put<Song>(`/api/songs/${songId}`, {
        name: song.name,
        artist: song.artist,
        notes: song.notes,
        chord_ids: newChordIds,
        tag_ids: song.tag_ids,
        strumming_pattern: song.strumming_pattern,
      })
    },
    onMutate: async ({ songId, newChordIds }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.song(songId) })

      // Snapshot previous value
      const previousSong = queryClient.getQueryData<Song>(queryKeys.song(songId))

      // Optimistically update
      if (previousSong) {
        const reorderedChords = newChordIds
          .map(id => previousSong.chords?.find(c => c.id === id))
          .filter((c): c is Chord => c !== undefined)

        queryClient.setQueryData<Song>(queryKeys.song(songId), {
          ...previousSong,
          chord_ids: newChordIds,
          chords: reorderedChords,
        })
      }

      return { previousSong }
    },
    onError: (_, variables, context) => {
      // Rollback on error
      if (context?.previousSong) {
        queryClient.setQueryData(queryKeys.song(variables.songId), context.previousSong)
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.song(variables.songId) })
    },
  })
}

// Add chord to song
export function useAddChordToSong() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ songId, song, chord }: {
      songId: number
      song: Song
      chord: Chord
    }) => {
      const newChordIds = [...(song.chord_ids || []), chord.id]
      return api.put<Song>(`/api/songs/${songId}`, {
        name: song.name,
        artist: song.artist,
        notes: song.notes,
        chord_ids: newChordIds,
        tag_ids: song.tag_ids,
        strumming_pattern: song.strumming_pattern,
      })
    },
    onMutate: async ({ songId, chord }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.song(songId) })
      const previousSong = queryClient.getQueryData<Song>(queryKeys.song(songId))

      if (previousSong) {
        queryClient.setQueryData<Song>(queryKeys.song(songId), {
          ...previousSong,
          chord_ids: [...(previousSong.chord_ids || []), chord.id],
          chords: [...(previousSong.chords || []), chord],
        })
      }

      return { previousSong }
    },
    onError: (_, variables, context) => {
      if (context?.previousSong) {
        queryClient.setQueryData(queryKeys.song(variables.songId), context.previousSong)
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.song(variables.songId) })
    },
  })
}

// Remove chord from song
export function useRemoveChordFromSong() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ songId, song, chordIndex }: {
      songId: number
      song: Song
      chordIndex: number
    }) => {
      const newChordIds = song.chord_ids.filter((_, i) => i !== chordIndex)
      return api.put<Song>(`/api/songs/${songId}`, {
        name: song.name,
        artist: song.artist,
        notes: song.notes,
        chord_ids: newChordIds,
        tag_ids: song.tag_ids,
        strumming_pattern: song.strumming_pattern,
      })
    },
    onMutate: async ({ songId, chordIndex }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.song(songId) })
      const previousSong = queryClient.getQueryData<Song>(queryKeys.song(songId))

      if (previousSong) {
        queryClient.setQueryData<Song>(queryKeys.song(songId), {
          ...previousSong,
          chord_ids: previousSong.chord_ids.filter((_, i) => i !== chordIndex),
          chords: previousSong.chords?.filter((_, i) => i !== chordIndex),
        })
      }

      return { previousSong }
    },
    onError: (_, variables, context) => {
      if (context?.previousSong) {
        queryClient.setQueryData(queryKeys.song(variables.songId), context.previousSong)
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.song(variables.songId) })
    },
  })
}

export function useDeleteSong() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => api.del(`/api/songs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songs'] })
    },
  })
}

// Chord mutations
export function useCreateChord() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { name: string; strings: any[]; start_fret?: number }) =>
      api.post<Chord>('/api/chords', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chords'] })
    },
  })
}

export function useUpdateChord() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; name: string; strings: any[]; start_fret?: number }) =>
      api.put<Chord>(`/api/chords/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chords'] })
      queryClient.invalidateQueries({ queryKey: ['songs'] })
    },
  })
}

export function useDeleteChord() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => api.del(`/api/chords/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chords'] })
    },
  })
}

// Tag mutations
export function useCreateTag() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { name: string; color?: string }) =>
      api.post<Tag>('/api/tags', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags() })
    },
  })
}

export function useDeleteTag() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => api.del(`/api/tags/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags() })
    },
  })
}

// Logs queries (admin only)
export function useLogs(params?: { level?: LogLevel; action?: string; limit?: number; offset?: number }) {
  const api = useApi()

  return useQuery({
    queryKey: queryKeys.logs(params),
    queryFn: async () => {
      let url = '/api/logs'
      const queryParams: string[] = []
      if (params?.level) queryParams.push(`level=${params.level}`)
      if (params?.action) queryParams.push(`action=${encodeURIComponent(params.action)}`)
      if (params?.limit) queryParams.push(`limit=${params.limit}`)
      if (params?.offset) queryParams.push(`offset=${params.offset}`)
      if (queryParams.length > 0) {
        url += '?' + queryParams.join('&')
      }
      return api.get<{ logs: LogEntry[]; total: number }>(url)
    },
  })
}

export function useClearLogs() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (days?: number) => api.del(`/api/logs/clear${days ? `?days=${days}` : ''}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs'] })
    },
  })
}

// Progress queries (Kanban board)
export function useProgress() {
  const api = useApi()

  return useQuery({
    queryKey: queryKeys.progress(),
    queryFn: () => api.get<SongProgress[]>('/api/progress'),
  })
}

export function useProgressItem(songId: number | undefined) {
  const api = useApi()

  return useQuery({
    queryKey: queryKeys.progressItem(songId!),
    queryFn: () => api.get<SongProgress | null>(`/api/progress/${songId}`),
    enabled: !!songId,
  })
}

export function useAddToProgress() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { songId: number; status?: ProgressStatus }) =>
      api.post<SongProgress>('/api/progress', data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.progress() })
      queryClient.invalidateQueries({ queryKey: queryKeys.progressItem(variables.songId) })
    },
  })
}

export function useUpdateProgress() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ songId, status, position }: {
      songId: number
      status: ProgressStatus
      position: number
    }) => api.put<SongProgress>(`/api/progress/${songId}`, { status, position }),
    onMutate: async ({ songId, status, position }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.progress() })

      const previousProgress = queryClient.getQueryData<SongProgress[]>(queryKeys.progress())

      if (previousProgress) {
        const item = previousProgress.find(p => p.song_id === songId)
        if (item) {
          // Simply update the item's status and position immediately
          // The server will handle proper position management
          const updated = previousProgress.map(p => {
            if (p.song_id === songId) {
              return { ...p, status, position }
            }
            return p
          })

          // Sort by status and position for correct display
          updated.sort((a, b) => {
            if (a.status !== b.status) return 0
            return a.position - b.position
          })

          queryClient.setQueryData<SongProgress[]>(queryKeys.progress(), updated)
        }
      }

      return { previousProgress }
    },
    onError: (_, __, context) => {
      if (context?.previousProgress) {
        queryClient.setQueryData(queryKeys.progress(), context.previousProgress)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.progress() })
    },
  })
}

export function useRemoveFromProgress() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (songId: number) => api.del(`/api/progress/${songId}`),
    onMutate: async (songId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.progress() })

      const previousProgress = queryClient.getQueryData<SongProgress[]>(queryKeys.progress())

      if (previousProgress) {
        const item = previousProgress.find(p => p.song_id === songId)
        if (item) {
          const updated = previousProgress
            .filter(p => p.song_id !== songId)
            .map(p => {
              if (p.status === item.status && p.position > item.position) {
                return { ...p, position: p.position - 1 }
              }
              return p
            })
          queryClient.setQueryData<SongProgress[]>(queryKeys.progress(), updated)
        }
      }

      return { previousProgress }
    },
    onError: (_, __, context) => {
      if (context?.previousProgress) {
        queryClient.setQueryData(queryKeys.progress(), context.previousProgress)
      }
    },
    onSettled: (_, __, songId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.progress() })
      queryClient.invalidateQueries({ queryKey: queryKeys.progressItem(songId) })
    },
  })
}
