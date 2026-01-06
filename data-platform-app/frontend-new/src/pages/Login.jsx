import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (isRegister) {
        // Register new user
        const response = await fetch('https://dataplatform.tomodachis.org:2221/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
            full_name: fullName,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Registration failed')
        }

        // Success - show message and switch to login
        setSuccess('Registration successful! Please wait for admin approval before logging in.')
        setIsRegister(false)
        setEmail('')
        setPassword('')
        setFullName('')
      } else {
        // Login
        await login(email, password)
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.message || err.response?.data?.error || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary-500 to-purple-500 bg-clip-text text-transparent mb-2">
            TOMODACHI
          </h1>
          <p className="text-gray-400 text-lg">Data Platform</p>
        </div>

        {/* Login/Register Card */}
        <div className="glass rounded-2xl p-8 shadow-2xl animate-scale-in">
          <h2 className="text-2xl font-bold mb-6">
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h2>

          {/* Error Alert */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-4 animate-slide-down">
              {error}
            </div>
          )}

          {/* Success Alert */}
          {success && (
            <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg mb-4 animate-slide-down">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name (Registration only) */}
            {isRegister && (
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500 transition-all"
                  placeholder="Enter your full name"
                  required
                  autoComplete="name"
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Email {!isRegister && 'or Username'}
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500 transition-all"
                placeholder={isRegister ? "Enter your email" : "Enter your email or username"}
                required
                autoComplete="username"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500 transition-all"
                placeholder="Enter your password"
                required
                autoComplete={isRegister ? "new-password" : "current-password"}
                minLength={isRegister ? 6 : undefined}
              />
              {isRegister && (
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-gradient text-white font-semibold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {isRegister ? 'Creating account...' : 'Logging in...'}
                </span>
              ) : (
                isRegister ? 'Register' : 'Login'
              )}
            </button>
          </form>

          {/* Toggle Between Login/Register */}
          <div className="text-center mt-6 text-gray-400">
            {isRegister ? (
              <p>
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setIsRegister(false)
                    setError('')
                    setSuccess('')
                  }}
                  className="text-primary-500 hover:text-primary-400 font-medium transition-colors"
                >
                  Login here
                </button>
              </p>
            ) : (
              <p>
                Don't have an account?{' '}
                <button
                  onClick={() => {
                    setIsRegister(true)
                    setError('')
                    setSuccess('')
                  }}
                  className="text-primary-500 hover:text-primary-400 font-medium transition-colors"
                >
                  Register here
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Info Note for Registration */}
        {isRegister && (
          <div className="mt-4 text-center text-sm text-gray-500 animate-fade-in">
            <p>After registration, your account will be pending approval by an administrator.</p>
          </div>
        )}
      </div>
    </div>
  )
}
