'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Header() {
  const [email, setEmail] = useState<string | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (!email) return null

  return (
    <header>
      {/* Top strip */}
      <div className="bg-[#3e3e3e] text-[#ccc] text-xs py-1 px-4 flex justify-end items-center gap-3">
        <span>
          Logged in as <strong className="text-white">{email}</strong>
        </span>
        <span className="text-gray-600">|</span>
        <Link href="/projects" className="text-[#ccc] hover:text-white">My page</Link>
        <span className="text-gray-600">|</span>
        <button onClick={logout} className="text-[#ccc] hover:text-white cursor-pointer">
          Sign out
        </button>
      </div>

      {/* Logo bar */}
      <div className="bg-[#628db6] px-6 py-3">
        <Link href="/projects" className="text-white font-bold text-xl tracking-wide">
          Redmine Mini
        </Link>
      </div>

      {/* Nav bar */}
      <nav className="bg-[#578bb0] border-b border-[#4a7a9b]">
        <div className="px-6 flex">
          <NavLink href="/projects" current={pathname === '/projects' || pathname.startsWith('/projects/')}>Home</NavLink>
          <NavLink href="/my-tasks" current={pathname === '/my-tasks'}>My Tasks</NavLink>
        </div>
      </nav>
    </header>
  )
}

function NavLink({ href, children, current }: { href: string; children: React.ReactNode; current: boolean }) {
  return (
    <Link
      href={href}
      className={`text-white text-sm px-4 py-2 inline-block border-b-2 transition-colors ${
        current ? 'border-white bg-[#4a7a9b]' : 'border-transparent hover:bg-[#4a7a9b]'
      }`}
    >
      {children}
    </Link>
  )
}
