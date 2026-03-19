'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const fetchProjects = async () => {
    const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false })
    setProjects(data || [])
  }

  useEffect(() => { fetchProjects() }, [])

  const createProject = async () => {
    if (!name.trim()) return
    await supabase.from('projects').insert([{ name, description }])
    setName('')
    setDescription('')
    setShowForm(false)
    fetchProjects()
  }

  const deleteProject = async (id: string, projectName: string) => {
    if (!confirm(`Xoá project "${projectName}"? Hành động này không thể hoàn tác.`)) return
    await supabase.from('projects').delete().eq('id', id)
    fetchProjects()
  }

  return (
    <div>
      {/* Page title */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#3e3e3e]">Projects</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-[#628db6] hover:bg-[#4e7a9e] text-white text-sm px-4 py-1.5 rounded transition-colors"
        >
          + New project
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white border border-[#d7d7d7] rounded shadow-sm p-5 mb-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200">New Project</h3>
          <div className="space-y-3 max-w-lg">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Name <span className="text-red-500">*</span></label>
              <input
                className="w-full border border-[#d7d7d7] rounded px-3 py-1.5 text-sm outline-none focus:border-[#628db6]"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Project name"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Description</label>
              <textarea
                className="w-full border border-[#d7d7d7] rounded px-3 py-1.5 text-sm outline-none focus:border-[#628db6] h-20 resize-none"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Short description"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={createProject} className="bg-[#628db6] hover:bg-[#4e7a9e] text-white text-sm px-5 py-1.5 rounded transition-colors">
                Create
              </button>
              <button onClick={() => setShowForm(false)} className="bg-[#e8e8e8] hover:bg-[#d4d4d4] text-gray-700 text-sm px-5 py-1.5 rounded transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Projects table */}
      <div className="bg-white border border-[#d7d7d7] rounded shadow-sm">
        <div className="bg-[#e8e8e8] border-b border-[#d7d7d7] px-4 py-2">
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Projects</span>
          <span className="ml-2 text-xs text-gray-400">({projects.length})</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f0f0f0] border-b border-[#d7d7d7]">
              <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Project</th>
              <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Description</th>
              <th className="text-left px-4 py-2.5 font-semibold text-gray-600 w-32">Created</th>
              <th className="text-left px-4 py-2.5 font-semibold text-gray-600 w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-gray-400">
                  No projects yet.{' '}
                  <button onClick={() => setShowForm(true)} className="text-[#169] hover:underline">Create the first one</button>.
                </td>
              </tr>
            ) : (
              projects.map((p, i) => (
                <tr key={p.id} className={`border-b border-gray-100 hover:bg-[#f5f5f5] transition-colors ${i % 2 === 0 ? '' : 'bg-[#f9f9f9]'}`}>
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/projects/${p.id}`} className="text-[#169] hover:underline">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{p.description || <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => deleteProject(p.id, p.name)}
                      className="text-xs text-red-400 hover:text-red-600 hover:underline transition-colors"
                    >
                      Delete
                    </button>
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