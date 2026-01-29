import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLogs, useClearLogs } from '../hooks/useQueries'
import { LogLevel } from '../types'

function LogsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [levelFilter, setLevelFilter] = useState<LogLevel | ''>('')
  const [actionFilter, setActionFilter] = useState('')
  const [page, setPage] = useState(0)
  const limit = 25

  const { data, isLoading, error, refetch } = useLogs({
    level: levelFilter || undefined,
    action: actionFilter || undefined,
    limit,
    offset: page * limit,
  })

  const clearLogsMutation = useClearLogs()

  // Redirect non-admins
  if (!user?.is_admin) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl text-deep-navy mb-4">Access Denied</h2>
        <p className="text-light-gray mb-4">Only administrators can view logs.</p>
        <button
          className="px-5 py-2.5 text-base rounded-lg font-medium bg-deep-navy text-off-white transition-all duration-200 hover:bg-[#001a3d] border-0 cursor-pointer"
          onClick={() => navigate('/')}
        >
          Go Home
        </button>
      </div>
    )
  }

  const logs = data?.logs || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / limit)

  const handleClearOldLogs = () => {
    if (!confirm('Delete logs older than 30 days?')) return
    clearLogsMutation.mutate(30, {
      onSuccess: () => {
        refetch()
      },
    })
  }

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case 'info':
        return 'bg-teal-green/20 text-teal-green'
      case 'warn':
        return 'bg-[#F59E0B]/20 text-[#D97706]'
      case 'error':
        return 'bg-[#D64545]/20 text-[#D64545]'
      default:
        return 'bg-light-gray/20 text-light-gray'
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl text-deep-navy">Application Logs</h1>
        <button
          className="px-4 py-2 text-sm rounded-lg font-medium bg-[#D64545] text-off-white transition-all duration-200 hover:bg-[#B83B3B] border-0 cursor-pointer"
          onClick={handleClearOldLogs}
          disabled={clearLogsMutation.isPending}
        >
          {clearLogsMutation.isPending ? 'Clearing...' : 'Clear Old Logs'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <div>
          <label className="block text-sm text-light-gray mb-1">Level</label>
          <select
            className="px-3 py-2 text-sm border-2 border-[#D4C9BC] rounded-lg bg-off-white text-deep-navy outline-none focus:border-deep-navy cursor-pointer"
            value={levelFilter}
            onChange={(e) => {
              setLevelFilter(e.target.value as LogLevel | '')
              setPage(0)
            }}
          >
            <option value="">All Levels</option>
            <option value="info">Info</option>
            <option value="warn">Warning</option>
            <option value="error">Error</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-light-gray mb-1">Action</label>
          <input
            type="text"
            className="px-3 py-2 text-sm border-2 border-[#D4C9BC] rounded-lg bg-off-white text-deep-navy outline-none focus:border-deep-navy placeholder:text-light-gray"
            placeholder="Filter by action..."
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value)
              setPage(0)
            }}
          />
        </div>

        <div className="flex items-end">
          <button
            className="px-4 py-2 text-sm rounded-lg font-medium bg-cream text-deep-navy border-2 border-[#D4C9BC] transition-all duration-200 hover:border-deep-navy cursor-pointer"
            onClick={() => refetch()}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-4 text-sm text-light-gray">
        Showing {logs.length} of {total} logs
      </div>

      {isLoading && logs.length === 0 ? (
        <div className="text-center py-10 text-light-gray">Loading...</div>
      ) : error ? (
        <div className="text-[#D64545] bg-[rgba(214,69,69,0.1)] border-2 border-[#D64545] rounded-lg text-center p-5">
          Error: {error instanceof Error ? error.message : 'Failed to load logs'}
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center text-light-gray text-xl py-10">
          No logs found.
        </div>
      ) : (
        <>
          {/* Logs Table */}
          <div className="bg-off-white rounded-xl border-2 border-[#D4C9BC] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-cream border-b-2 border-[#D4C9BC]">
                    <th className="px-4 py-3 text-left text-sm font-medium text-deep-navy">Time</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-deep-navy">Level</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-deep-navy">Action</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-deep-navy">Message</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-deep-navy">User</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-deep-navy">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-[#D4C9BC] hover:bg-cream/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-light-gray whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium uppercase ${getLevelColor(log.level)}`}>
                          {log.level}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-deep-navy font-mono">
                        {log.action}
                      </td>
                      <td className="px-4 py-3 text-sm text-deep-navy max-w-[300px] truncate" title={log.message}>
                        {log.message}
                      </td>
                      <td className="px-4 py-3 text-sm text-light-gray">
                        {log.username || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-light-gray font-mono">
                        {log.ip_address || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                className="px-4 py-2 text-sm rounded-lg font-medium bg-cream text-deep-navy border-2 border-[#D4C9BC] transition-all duration-200 hover:border-deep-navy cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-light-gray">
                Page {page + 1} of {totalPages}
              </span>
              <button
                className="px-4 py-2 text-sm rounded-lg font-medium bg-cream text-deep-navy border-2 border-[#D4C9BC] transition-all duration-200 hover:border-deep-navy cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default LogsPage
