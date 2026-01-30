import { ProgressStatus } from '../types'

export interface ProgressColumn {
  id: ProgressStatus
  title: string
  color: string
  bgColor: string
}

export const PROGRESS_COLUMNS: ProgressColumn[] = [
  {
    id: 'want_to_learn',
    title: 'Want to Learn',
    color: 'bg-[#6366F1]',
    bgColor: 'bg-[#6366F1]/10',
  },
  {
    id: 'learning',
    title: 'Learning',
    color: 'bg-[#F59E0B]',
    bgColor: 'bg-[#F59E0B]/10',
  },
  {
    id: 'practicing',
    title: 'Practicing',
    color: 'bg-[#10B981]',
    bgColor: 'bg-[#10B981]/10',
  },
  {
    id: 'mastered',
    title: 'Mastered',
    color: 'bg-teal-green',
    bgColor: 'bg-teal-green/10',
  },
]

export const PROGRESS_STATUS_MAP: Record<ProgressStatus, ProgressColumn> =
  PROGRESS_COLUMNS.reduce(
    (acc, col) => {
      acc[col.id] = col
      return acc
    },
    {} as Record<ProgressStatus, ProgressColumn>
  )

export function getProgressStatusTitle(status: ProgressStatus): string {
  return PROGRESS_STATUS_MAP[status]?.title ?? status
}

export function getProgressStatusColor(status: ProgressStatus): string {
  return PROGRESS_STATUS_MAP[status]?.color ?? 'bg-gray-500'
}
