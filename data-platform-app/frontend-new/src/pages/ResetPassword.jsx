import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authAPI } from '../services/api'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (!tokenParam) {
      setError('Token reset password tidak ditemukan')
    } else {
      setToken(tokenParam)
    }
  }, [searchParams])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validation
    if (newPassword.length < 6) {
      setError('Password harus minimal 6 karakter')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok')
      return
    }

    if (!token) {
      setError('Token reset password tidak valid')
      return
    }

    setLoading(true)

    try {
      const response = await authAPI.resetPassword(token, newPassword)
      setSuccess(response.data.message || 'Password berhasil direset!')
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err) {
      console.error('Reset password error:', err)
      setError(
        err.response?.data?.message || 
        err.response?.data?.error || 
        'Gagal reset password. Token mungkin tidak valid atau sudah kedaluwarsa.'
      )
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

        {/* Reset Password Card */}
        <div className="glass rounded-2xl p-8 shadow-2xl animate-scale-in">
          <h2 className="text-2xl font-bold mb-6">Reset Password</h2>

          {/* Error Alert */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-4 animate-slide-down">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Success Alert */}
          {success && (
            <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg mb-4 animate-slide-down">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">{success}</span>
              </div>
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New Password */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Password Baru <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500 transition-all"
                  placeholder="Masukkan password baru"
                  required
                  minLength={6}
                  disabled={loading || !token}
                  autoComplete="new-password"
                />
                <p className="text-xs text-gray-500 mt-1">Minimal 6 karakter</p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Konfirmasi Password <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500 transition-all"
                  placeholder="Konfirmasi password baru"
                  required
                  minLength={6}
                  disabled={loading || !token}
                  autoComplete="new-password"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !token}
                className="w-full btn-gradient text-white font-semibold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Mereset password...
                  </span>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          )}

          {/* Back to Login Link */}
          <div className="text-center mt-6 text-gray-400">
            <button
              onClick={() => navigate('/login')}
              className="text-primary-500 hover:text-primary-400 font-medium transition-colors"
              disabled={loading}
            >
              Kembali ke Login
            </button>
          </div>
        </div>

        {/* Info Note */}
        {!success && (
          <div className="mt-4 text-center text-sm text-gray-500 animate-fade-in">
            <div className="glass rounded-lg p-3">
              <p className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Password baru Anda harus berbeda dengan password sebelumnya.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
