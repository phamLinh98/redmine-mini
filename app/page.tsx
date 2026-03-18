'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'login' | 'signup'>('login')

  const handleAuth = async () => {
    if (!email || !password) return
    setLoading(true)
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) alert(error.message)
      else window.location.href = '/projects'
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) alert(error.message)
      else { alert('Account created! You can now sign in.'); setMode('login') }
    }
    setLoading(false)
  }

  return (
    <div className="flex justify-center pt-12">
      <div className="bg-white border border-[#d7d7d7] rounded shadow-sm p-8 w-80">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#628db6] text-white text-xl font-bold mb-3">R</div>
          <h1 className="text-xl font-bold text-[#3e3e3e]">Redmine Mini</h1>
          <p className="text-xs text-gray-400 mt-1">Project Management</p>
        </div>

        <h2 className="text-sm font-semibold text-gray-600 mb-4 border-b border-gray-200 pb-2">
          {mode === 'login' ? 'Sign in' : 'Create account'}
        </h2>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Login</label>
            <input
              className="w-full border border-[#d7d7d7] rounded px-3 py-2 text-sm outline-none focus:border-[#628db6] focus:ring-1 focus:ring-[#628db6]"
              placeholder="Email address"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAuth()}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Password</label>
            <input
              type="password"
              className="w-full border border-[#d7d7d7] rounded px-3 py-2 text-sm outline-none focus:border-[#628db6] focus:ring-1 focus:ring-[#628db6]"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAuth()}
            />
          </div>
          <button
            onClick={handleAuth}
            disabled={loading}
            className="w-full bg-[#628db6] hover:bg-[#4e7a9e] text-white py-2 rounded text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Sign up'}
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          {mode === 'login' ? (
            <>No account?{' '}
              <button onClick={() => setMode('signup')} className="text-[#169] hover:underline cursor-pointer">Register</button>
            </>
          ) : (
            <>Already registered?{' '}
              <button onClick={() => setMode('login')} className="text-[#169] hover:underline cursor-pointer">Sign in</button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}