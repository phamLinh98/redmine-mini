'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

const STATUS_BADGE: Record<string, string> = {
  open: 'bg-green-100 text-green-700 border border-green-300',
  'in-progress': 'bg-blue-100 text-blue-700 border border-blue-300',
  resolved: 'bg-purple-100 text-purple-700 border border-purple-300',
  closed: 'bg-gray-100 text-gray-500 border border-gray-300',
}

const PRIORITY_COLOR: Record<string, string> = {
  low: 'text-gray-400',
  normal: 'text-gray-600',
  high: 'text-orange-500',
  urgent: 'text-red-600 font-semibold',
}

export default function MyTasksPage() {
  const [issues, setIssues] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('open')

  useEffect(() => {
    const fetchMyTasks = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('issues')
        .select('*, projects(id, name)')
        .eq('assignee', user.id)
        .order('created_at', { ascending: false })
      setIssues(data || [])
      setLoading(false)
    }
    fetchMyTasks()
  }, [])

  const filtered = filterStatus === 'all' ? issues : issues.filter(i => i.status === filterStatus)
  const openCount = issues.filter(i => i.status === 'open').length

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-gray-400">Loading...</div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#3e3e3e]">My Tasks</h2>
      </div>

      <div className="bg-white border border-[#d7d7d7] rounded shadow-sm">
        {/* Filter bar */}
        <div className="flex items-center gap-2 px-4 py-2 bg-[#f0f0f0] border-b border-[#d7d7d7]">
          <span className="text-xs text-gray-500 mr-1">Status:</span>
          {(['open', 'in-progress', 'resolved', 'closed', 'all'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`text-xs px-2.5 py-0.5 rounded transition-colors ${
                filterStatus === s
                  ? 'bg-[#628db6] text-white'
                  : 'bg-white text-gray-600 border border-[#d7d7d7] hover:bg-gray-50'
              }`}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}
            </button>
          ))}
          <span className="ml-auto text-xs text-gray-400">{openCount} open / {issues.length} total</span>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#e8e8e8] border-b border-[#d7d7d7]">
              <th className="text-left px-3 py-2.5 font-semibold text-gray-600 w-10">#</th>
              <th className="text-left px-3 py-2.5 font-semibold text-gray-600">Subject</th>
              <th className="text-left px-3 py-2.5 font-semibold text-gray-600 w-32">Project</th>
              <th className="text-left px-3 py-2.5 font-semibold text-gray-600 w-28">Status</th>
              <th className="text-left px-3 py-2.5 font-semibold text-gray-600 w-24">Priority</th>
              <th className="text-left px-3 py-2.5 font-semibold text-gray-600 w-28">Deadline</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                  No tasks assigned to you.
                </td>
              </tr>
            ) : (
              filtered.map((issue, i) => (
                <tr key={issue.id} className={`border-b border-gray-100 hover:bg-[#f0f5ff] transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-[#f9f9f9]'}`}>
                  <td className="px-3 py-2.5 text-gray-400 text-xs font-mono">{i + 1}</td>
                  <td className="px-3 py-2.5">
                    <Link href={`/issues/${issue.id}`} className="text-[#169] hover:underline font-medium">
                      {issue.title}
                    </Link>
                    {issue.description && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate max-w-sm">{issue.description}</p>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-gray-500">
                    {issue.projects?.name
                      ? <Link href={`/projects/${issue.projects.id}`} className="text-[#169] hover:underline">{issue.projects.name}</Link>
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded ${STATUS_BADGE[issue.status] || STATUS_BADGE.open}`}>
                      {(issue.status || 'open').replace('-', ' ')}
                    </span>
                  </td>
                  <td className={`px-3 py-2.5 text-xs capitalize ${PRIORITY_COLOR[issue.priority] || PRIORITY_COLOR.normal}`}>
                    {issue.priority || 'normal'}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-gray-500">
                    {issue.deadline
                      ? new Date(issue.deadline + 'T00:00:00').toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                      : <span className="text-gray-300">—</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
