'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const STATUS_OPTIONS = ['open', 'in-progress', 'resolved', 'closed'] as const

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

export default function IssueDetail() {
  const { id } = useParams()
  const [issue, setIssue] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [users, setUsers] = useState<{ id: string; email: string; name?: string }[]>([])

  // New comment
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Edit issue
  const [editingIssue, setEditingIssue] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editPriority, setEditPriority] = useState('normal')
  const [editAssignee, setEditAssignee] = useState('')

  // Edit comment
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editCommentContent, setEditCommentContent] = useState('')

  const fetchData = async () => {
    const [{ data: iss }, { data: cmts }] = await Promise.all([
      supabase.from('issues').select('*, projects(id, name)').eq('id', id).single(),
      supabase.from('comments').select('*').eq('issue_id', id).order('created_at', { ascending: true }),
    ])
    setIssue(iss)
    setComments(cmts || [])
  }

  useEffect(() => { fetchData() }, [id])

  useEffect(() => {
    supabase.from('profiles').select('id, email, name').then(({ data }) => {
      if (data) setUsers(data)
    })
  }, [])

  const addComment = async () => {
    if (!content.trim()) return
    setSubmitting(true)
    await supabase.from('comments').insert([{ issue_id: id, content }])
    setContent('')
    setSubmitting(false)
    fetchData()
  }

  const updateStatus = async (status: string) => {
    await supabase.from('issues').update({ status }).eq('id', id)
    fetchData()
  }

  const startEditIssue = () => {
    setEditTitle(issue.title)
    setEditDescription(issue.description || '')
    setEditPriority(issue.priority || 'normal')
    setEditAssignee(issue.assignee || '')
    setEditingIssue(true)
  }

  const saveIssue = async () => {
    await supabase.from('issues').update({
      title: editTitle,
      description: editDescription,
      priority: editPriority,
      assignee: editAssignee,
    }).eq('id', id)
    setEditingIssue(false)
    fetchData()
  }

  const startEditComment = (c: any) => {
    setEditingCommentId(c.id)
    setEditCommentContent(c.content)
  }

  const saveComment = async (commentId: string) => {
    await supabase.from('comments').update({ content: editCommentContent }).eq('id', commentId)
    setEditingCommentId(null)
    fetchData()
  }

  const deleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return
    await supabase.from('comments').delete().eq('id', commentId)
    fetchData()
  }

  if (!issue) return (
    <div className="flex items-center justify-center py-20 text-gray-400">Loading...</div>
  )

  return (
    <div>
      {/* Breadcrumb */}
      <div className="text-xs text-gray-500 mb-3">
        <Link href="/projects" className="text-[#169] hover:underline">Projects</Link>
        <span className="mx-1">›</span>
        {issue.projects?.name && (
          <>
            <Link href={`/projects/${issue.projects.id}`} className="text-[#169] hover:underline">
              {issue.projects.name}
            </Link>
            <span className="mx-1">›</span>
          </>
        )}
        <span className="text-gray-700">Issue #{String(id).slice(0, 8)}</span>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Main column */}
        <div className="col-span-2 space-y-4">

          {/* Issue card */}
          <div className="bg-white border border-[#d7d7d7] rounded shadow-sm">
            <div className="bg-[#e8e8e8] px-4 py-2.5 border-b border-[#d7d7d7] flex items-center justify-between rounded-t">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Issue #{String(id).slice(0, 8)}
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2.5 py-0.5 rounded ${STATUS_BADGE[issue.status] || STATUS_BADGE.open}`}>
                  {(issue.status || 'open').replace('-', ' ')}
                </span>
                {!editingIssue && (
                  <button
                    onClick={startEditIssue}
                    className="text-xs text-[#169] hover:underline ml-2"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>

            <div className="px-5 py-4">
              {editingIssue ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Subject <span className="text-red-500">*</span></label>
                    <input
                      className="w-full border border-[#d7d7d7] rounded px-3 py-1.5 text-sm outline-none focus:border-[#628db6]"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Description</label>
                    <textarea
                      className="w-full border border-[#d7d7d7] rounded px-3 py-1.5 text-sm outline-none focus:border-[#628db6] h-28 resize-none"
                      value={editDescription}
                      onChange={e => setEditDescription(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Priority</label>
                      <select
                        className="border border-[#d7d7d7] rounded px-3 py-1.5 text-sm outline-none focus:border-[#628db6]"
                        value={editPriority}
                        onChange={e => setEditPriority(e.target.value)}
                      >
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Assignee</label>
                      <select
                        className="w-full border border-[#d7d7d7] rounded px-3 py-1.5 text-sm outline-none focus:border-[#628db6] bg-white"
                        value={editAssignee}
                        onChange={e => setEditAssignee(e.target.value)}
                      >
                        <option value="">— Unassigned —</option>
                        {users.map(u => (
                          <option key={u.id} value={u.id}>{u.name || u.email}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={saveIssue}
                      className="bg-[#628db6] hover:bg-[#4e7a9e] text-white text-sm px-5 py-1.5 rounded transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingIssue(false)}
                      className="bg-[#e8e8e8] hover:bg-[#d4d4d4] text-gray-700 text-sm px-5 py-1.5 rounded transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-lg font-bold text-[#3e3e3e] mb-4">{issue.title}</h1>
                  {issue.description ? (
                    <div className="bg-[#fafafa] border border-gray-100 rounded p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {issue.description}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No description provided.</p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* History / Comments */}
          <div className="bg-white border border-[#d7d7d7] rounded shadow-sm">
            <div className="bg-[#e8e8e8] px-4 py-2.5 border-b border-[#d7d7d7]">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                History ({comments.length})
              </span>
            </div>

            {comments.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400">No comments yet.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {comments.map((c, i) => (
                  <div key={c.id} className="px-5 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#628db6] text-white text-xs flex items-center justify-center font-semibold flex-shrink-0">
                          {i + 1}
                        </div>
                        <span className="text-xs text-gray-400">
                          {c.created_at ? new Date(c.created_at).toLocaleString('vi-VN') : 'Just now'}
                        </span>
                      </div>
                      <div className="flex gap-3">
                        {editingCommentId !== c.id && (
                          <>
                            <button
                              onClick={() => startEditComment(c)}
                              className="text-xs text-[#169] hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteComment(c.id)}
                              className="text-xs text-red-400 hover:underline"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {editingCommentId === c.id ? (
                      <div className="ml-9 space-y-2">
                        <textarea
                          className="w-full border border-[#d7d7d7] rounded px-3 py-2 text-sm outline-none focus:border-[#628db6] h-20 resize-none bg-white"
                          value={editCommentContent}
                          onChange={e => setEditCommentContent(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveComment(c.id)}
                            className="bg-[#628db6] hover:bg-[#4e7a9e] text-white text-xs px-4 py-1.5 rounded transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingCommentId(null)}
                            className="bg-[#e8e8e8] hover:bg-[#d4d4d4] text-gray-700 text-xs px-4 py-1.5 rounded transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="ml-9 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {c.content}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add comment */}
            <div className="border-t border-[#d7d7d7] bg-[#fafafa] px-5 py-4">
              <h4 className="text-sm font-semibold text-gray-600 mb-2">Add a note</h4>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                className="w-full border border-[#d7d7d7] rounded px-3 py-2 text-sm outline-none focus:border-[#628db6] h-28 resize-none bg-white"
                placeholder="Write your comment here..."
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={addComment}
                  disabled={submitting || !content.trim()}
                  className="bg-[#628db6] hover:bg-[#4e7a9e] text-white text-sm px-5 py-1.5 rounded disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white border border-[#d7d7d7] rounded shadow-sm">
            <div className="bg-[#e8e8e8] px-4 py-2.5 border-b border-[#d7d7d7]">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Details</span>
            </div>
            <div className="px-4 py-4 space-y-4 text-sm">

              <div>
                <span className="block text-xs text-gray-400 mb-1.5">Status</span>
                <div className="flex flex-wrap gap-1">
                  {STATUS_OPTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => updateStatus(s)}
                      className={`text-xs px-2.5 py-1 rounded transition-colors cursor-pointer ${
                        issue.status === s
                          ? STATUS_BADGE[s]
                          : 'bg-gray-50 text-gray-400 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-xs text-gray-400 mb-0.5">Priority</span>
                <span className={`capitalize text-sm ${PRIORITY_COLOR[issue.priority] || PRIORITY_COLOR.normal}`}>
                  {issue.priority || 'normal'}
                </span>
              </div>

              <div>
                <span className="block text-xs text-gray-400 mb-1">Assignee</span>
                <select
                  className="w-full border border-[#d7d7d7] rounded px-2 py-1 text-sm outline-none focus:border-[#628db6] bg-white"
                  value={issue.assignee || ''}
                  onChange={async e => {
                    const val = e.target.value || null
                    const { error } = await supabase.from('issues').update({ assignee: val }).eq('id', id)
                    if (error) {
                      alert('Lỗi assign: ' + error.message)
                    } else {
                      fetchData()
                    }
                  }}
                >
                  <option value="">— Unassigned —</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name || u.email}</option>
                  ))}
                </select>
              </div>

              {issue.projects?.name && (
                <div>
                  <span className="block text-xs text-gray-400 mb-0.5">Project</span>
                  <Link href={`/projects/${issue.projects.id}`} className="text-[#169] hover:underline text-sm">
                    {issue.projects.name}
                  </Link>
                </div>
              )}

              {issue.created_at && (
                <div>
                  <span className="block text-xs text-gray-400 mb-0.5">Created</span>
                  <span className="text-sm text-gray-600">
                    {new Date(issue.created_at).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              )}

              {issue.updated_at && (
                <div>
                  <span className="block text-xs text-gray-400 mb-0.5">Updated</span>
                  <span className="text-sm text-gray-600">
                    {new Date(issue.updated_at).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}