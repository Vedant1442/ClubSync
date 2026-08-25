import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useClubSync } from '../context/ClubSyncContext'
import { Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const { login } = useClubSync()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setError(null)
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#131315] p-4 text-white font-sans">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <h2 className="text-[22px] font-bold mb-2">Sign in to ClubSync</h2>
          <p className="text-[#a1a1aa] text-[15px]">Welcome back! Please enter your details.</p>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-6 text-sm text-center">{error}</div>}

        {/* Social Buttons */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button className="flex justify-center items-center py-2.5 bg-transparent border border-[#3f3f46] rounded-xl hover:bg-[#27272a] transition-colors">
            {/* Apple Icon */}
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.05 2.53.68 3.14.68.65 0 2.09-.77 3.65-.65 1.25.04 2.4.44 3.25 1.3-2.77 1.4-2.27 4.96.4 5.95-.65 1.63-1.44 3.03-2.44 5.69zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
          </button>
          <button className="flex justify-center items-center py-2.5 bg-transparent border border-[#3f3f46] rounded-xl hover:bg-[#27272a] transition-colors text-[#1877F2]">
            {/* Facebook Icon */}
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </button>
          <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/google`} className="flex justify-center items-center py-2.5 bg-transparent border border-[#3f3f46] rounded-xl hover:bg-[#27272a] transition-colors">
            {/* Google Icon */}
            <svg viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          </a>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="h-px bg-[#3f3f46] flex-1"></div>
          <span className="text-[#a1a1aa] text-sm">or</span>
          <div className="h-px bg-[#3f3f46] flex-1"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5 text-[#e4e4e7]">Email address</label>
            <input 
              type="email" 
              required 
              placeholder="name@example.com"
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="w-full bg-[#18181b] border border-[#3f3f46] rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] transition-all placeholder-[#71717a]" 
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5 text-[#e4e4e7]">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                placeholder="Enter your password"
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="w-full bg-[#18181b] border border-[#3f3f46] rounded-xl pl-4 pr-12 py-3 text-[15px] focus:outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] transition-all placeholder-[#71717a]" 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#71717a] hover:text-[#a1a1aa] transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="w-full bg-[#6d28d9] hover:bg-[#5b21b6] text-white py-3 rounded-xl font-semibold text-[15px] mt-2 transition-colors">
            Continue &nbsp; ▸
          </button>
        </form>

        <p className="mt-8 text-center text-[14px] text-[#a1a1aa]">
          No account? <Link to="/register" className="text-white hover:underline font-medium">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
