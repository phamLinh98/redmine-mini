'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useParams } from 'next/navigation'
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

export default function ProjectDetail() {
  const { id } = useParams()
  const [project, setProject] = useState<any>(null)
  const [issues, setIssues] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('normal')
  const [assignee, setAssignee] = useState('')
  const [filterStatus, setFilterStatus] = useState('open')

  const descRef = useRef<HTMLTextAreaElement>(null)
  const imgInputRef = useRef<HTMLInputElement>(null)

  const uploadImage = async (file: File) => {
    const ta = descRef.current
    const start = ta?.selectionStart ?? 0
    const end = ta?.selectionEnd ?? 0
    const ext = file.name.split('.').pop() || 'png'
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('issue-images').upload(path, file)
    if (error) { alert('Upload thất bại: ' + error.message); return }
    const { data } = supabase.storage.from('issue-images').getPublicUrl(path)
    const markdown = `![image](${data.publicUrl})`
    setDescription(prev => prev.slice(0, start) + markdown + prev.slice(end))
    setTimeout(() => {
      if (ta) { ta.selectionStart = ta.selectionEnd = start + markdown.length; ta.focus() }
    }, 50)
  }

  const fetchData = async () => {
    const [{ data: proj }, { data: iss }] = await Promise.all([
      supabase.from('projects').select('*').eq('id', id).single(),
      supabase.from('issues').select('*').eq('project_id', id).order('created_at', { ascending: false }),
    ])
    setProject(proj)
    setIssues(iss || [])
  }

  useEffect(() => { fetchData() }, [id])

  const createIssue = async () => {
    if (!title.trim()) return
    await supabase.from('issues').insert([{ title, description, priority, assignee, project_id: id, status: 'open' }])
    setTitle('')
    setDescription('')
    setPriority('normal')
    setAssignee('')
    setShowForm(false)
    fetchData()
  }

  const filtered = filterStatus === 'all' ? issues : issues.filter(i => i.status === filterStatus)
  const openCount = issues.filter(i => i.status === 'open').length

  return (
    <div>
      {/* Breadcrumb */}
      <div className="text-xs text-gray-500 mb-3">
        <Link href="/projects" className="text-[#169] hover:underline">Projects</Link>
        <span className="mx-1">›</span>
        <span className="text-gray-700 font-medium">{project?.name}</span>
      </div>

      {/* Project header */}
      <div className="bg-white border border-[#d7d7d7] rounded shadow-sm mb-4">
        <div className="bg-[#628db6] px-4 py-3 rounded-t flex items-center justify-between">
          <h1 className="text-white font-bold text-base">{project?.name}</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-white text-[#628db6] text-xs font-semibold px-3 py-1.5 rounded hover:bg-gray-50 transition-colors"
          >
            + New issue
          </button>
        </div>
        {/* Tab bar */}
        <div className="flex border-b border-[#d7d7d7] bg-[#f4f4f4]">
          <span className="text-sm px-4 py-2 border-b-2 border-[#628db6] text-[#628db6] font-medium bg-white">Issues</span>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white border border-[#d7d7d7] rounded shadow-sm p-5 mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200">New Issue</h3>
          <div className="space-y-3 max-w-xl">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Subject <span className="text-red-500">*</span></label>
              <input
                className="w-full border border-[#d7d7d7] rounded px-3 py-1.5 text-sm outline-none focus:border-[#628db6]"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Issue subject"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Description</label>
              <div className="border border-[#d7d7d7] rounded overflow-hidden focus-within:border-[#628db6]">
                <div className="bg-[#f5f5f5] border-b border-[#d7d7d7] px-2 py-1 flex gap-1 items-center">
                  <button
                    type="button"
                    onClick={() => imgInputRef.current?.click()}
                    className="text-xs text-gray-500 hover:text-[#628db6] px-2 py-0.5 rounded hover:bg-gray-200 transition-colors"
                    title="Upload ảnh"
                  >
                    🖼 Ảnh
                  </button>
                  <input
                    ref={imgInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async e => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      await uploadImage(file)
                      e.target.value = ''
                    }}
                  />
                  <span className="text-xs text-gray-300 ml-1">hoặc paste ảnh (Ctrl+V)</span>
                </div>
                <textarea
                  ref={descRef}
                  className="w-full px-3 py-1.5 text-sm outline-none h-24 resize-none"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  onPaste={async e => {
                    const imgItem = Array.from(e.clipboardData.items).find(item => item.type.startsWith('image/'))
                    if (imgItem) {
                      e.preventDefault()
                      const file = imgItem.getAsFile()
                      if (file) await uploadImage(file)
                    }
                  }}
                  placeholder="Describe the issue..."
                />
              </div>
            </div>
            <div className="flex gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Priority</label>
                <select
                  className="border border-[#d7d7d7] rounded px-3 py-1.5 text-sm outline-none focus:border-[#628db6]"
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-600 mb-1">Assignee</label>
                <input
                  className="w-full border border-[#d7d7d7] rounded px-3 py-1.5 text-sm outline-none focus:border-[#628db6]"
                  value={assignee}
                  onChange={e => setAssignee(e.target.value)}
                  placeholder="Assign to..."
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={createIssue} className="bg-[#628db6] hover:bg-[#4e7a9e] text-white text-sm px-5 py-1.5 rounded transition-colors">
                Create
              </button>
              <button onClick={() => setShowForm(false)} className="bg-[#e8e8e8] hover:bg-[#d4d4d4] text-gray-700 text-sm px-5 py-1.5 rounded transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Issues table */}
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
              <th className="text-left px-3 py-2.5 font-semibold text-gray-600 w-28">Status</th>
              <th className="text-left px-3 py-2.5 font-semibold text-gray-600 w-24">Priority</th>
              <th className="text-left px-3 py-2.5 font-semibold text-gray-600 w-28">Assignee</th>
              <th className="text-left px-3 py-2.5 font-semibold text-gray-600 w-28">Updated</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                  No issues found.{' '}
                  <button onClick={() => setShowForm(true)} className="text-[#169] hover:underline">Create one</button>.
                </td>
              </tr>
            ) : (
              filtered.map((issue, i) => (
                <tr key={issue.id} className={`border-b border-gray-100 hover:bg-[#f0f5ff] transition-colors cursor-pointer ${i % 2 === 0 ? 'bg-white' : 'bg-[#f9f9f9]'}`}>
                  <td className="px-3 py-2.5 text-gray-400 text-xs font-mono">{i + 1}</td>
                  <td className="px-3 py-2.5">
                    <Link href={`/issues/${issue.id}`} className="text-[#169] hover:underline font-medium">
                      {issue.title}
                    </Link>
                    {issue.description && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate max-w-sm">{issue.description}</p>
                    )}
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
                    {issue.assignee || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-gray-400">
                    {issue.updated_at ? new Date(issue.updated_at).toLocaleDateString() : '—'}
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