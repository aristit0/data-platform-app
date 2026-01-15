import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { authAPI } from '../services/api'

export default function Login() {
  const [isRegister, setIsRegister] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showResendVerification, setShowResendVerification] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setShowResendVerification(false)
    setLoading(true)

    try {
      if (isForgotPassword) {
        // Forgot Password
        await authAPI.forgotPassword(email.trim())
        setSuccess('Link reset password telah dikirim ke email Anda. Silakan cek inbox atau spam folder.')
        setEmail('')
      } else if (isRegister) {
        // Register new user
        const response = await authAPI.register({
          email: email.trim(),
          password,
          full_name: fullName.trim(),
        })

        const data = response.data

        // Success - show message and switch to login
        setSuccess(data.message || 'Registrasi berhasil! Silakan cek email Anda untuk verifikasi.')
        setIsRegister(false)
        setEmail('')
        setPassword('')
        setFullName('')
      } else {
        // Login
        await login(email.trim(), password)
        navigate('/dashboard')
      }
    } catch (err) {
      console.error('Auth error:', err)
      
      // Handle different error types
      if (err.message === 'Failed to fetch' || err.code === 'ERR_NETWORK') {
        setError('Tidak dapat terhubung ke server. Silakan periksa koneksi internet Anda.')
      } else if (err.response?.data?.requiresVerification) {
        setError(err.response.data.message || 'Email belum diverifikasi.')
        setShowResendVerification(true)
      } else if (err.response?.data?.message || err.response?.data?.error) {
        setError(err.response.data.message || err.response.data.error)
      } else if (err.message) {
        setError(err.message)
      } else {
        setError('Terjadi kesalahan yang tidak terduga. Silakan coba lagi.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResendVerification = async () => {
    if (!email) {
      setError('Silakan masukkan email Anda terlebih dahulu')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await authAPI.resendVerification(email.trim())
      setSuccess('Email verifikasi telah dikirim ulang. Silakan cek inbox atau spam folder Anda.')
      setShowResendVerification(false)
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengirim ulang email verifikasi')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleMode = () => {
    setIsRegister(!isRegister)
    setIsForgotPassword(false)
    setError('')
    setSuccess('')
    setEmail('')
    setPassword('')
    setFullName('')
    setShowResendVerification(false)
  }

  const handleToggleForgotPassword = () => {
    setIsForgotPassword(!isForgotPassword)
    setIsRegister(false)
    setError('')
    setSuccess('')
    setPassword('')
    setFullName('')
    setShowResendVerification(false)
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

        {/* Login/Register/Forgot Password Card */}
        <div className="glass rounded-2xl p-8 shadow-2xl animate-scale-in">
          <h2 className="text-2xl font-bold mb-6">
            {isForgotPassword ? 'Lupa Password' : isRegister ? 'Buat Akun Baru' : 'Selamat Datang'}
          </h2>

          {/* Error Alert */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-4 animate-slide-down">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">{error}</span>
              </div>
              {showResendVerification && (
                <button
                  onClick={handleResendVerification}
                  disabled={loading}
                  className="mt-2 text-sm underline hover:text-red-300 transition-colors"
                >
                  Kirim Ulang Email Verifikasi
                </button>
              )}
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name (Registration only) */}
            {isRegister && (
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Nama Lengkap <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500 transition-all"
                  placeholder="Masukkan nama lengkap"
                  required
                  autoComplete="name"
                  disabled={loading}
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                {isRegister || isForgotPassword ? 'Email' : 'Email atau Username'} <span className="text-red-400">*</span>
              </label>
              <input
                type={isRegister || isForgotPassword ? "email" : "text"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500 transition-all"
                placeholder={isForgotPassword ? "Masukkan email terdaftar" : isRegister ? "Masukkan alamat email" : "Masukkan email atau username"}
                required
                autoComplete="username"
                disabled={loading}
              />
            </div>

            {/* Password (Not for forgot password) */}
            {!isForgotPassword && (
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Password <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500 transition-all"
                  placeholder="Masukkan password"
                  required
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  minLength={isRegister ? 6 : undefined}
                  disabled={loading}
                />
                {isRegister && (
                  <p className="text-xs text-gray-500 mt-1">Minimal 6 karakter</p>
                )}
              </div>
            )}

            {/* Forgot Password Link (Login mode only) */}
            {!isRegister && !isForgotPassword && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={handleToggleForgotPassword}
                  className="text-sm text-primary-500 hover:text-primary-400 transition-colors"
                  disabled={loading}
                >
                  Lupa password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-gradient text-white font-semibold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {isForgotPassword ? 'Mengirim link...' : isRegister ? 'Membuat akun...' : 'Masuk...'}
                </span>
              ) : (
                isForgotPassword ? 'Kirim Link Reset' : isRegister ? 'Daftar' : 'Masuk'
              )}
            </button>
          </form>

          {/* Toggle Between Login/Register */}
          <div className="text-center mt-6 text-gray-400">
            {isForgotPassword ? (
              <p>
                Ingat password Anda?{' '}
                <button
                  onClick={handleToggleForgotPassword}
                  className="text-primary-500 hover:text-primary-400 font-medium transition-colors"
                  disabled={loading}
                >
                  Kembali ke login
                </button>
              </p>
            ) : isRegister ? (
              <p>
                Sudah punya akun?{' '}
                <button
                  onClick={handleToggleMode}
                  className="text-primary-500 hover:text-primary-400 font-medium transition-colors"
                  disabled={loading}
                >
                  Masuk di sini
                </button>
              </p>
            ) : (
              <p>
                Belum punya akun?{' '}
                <button
                  onClick={handleToggleMode}
                  className="text-primary-500 hover:text-primary-400 font-medium transition-colors"
                  disabled={loading}
                >
                  Daftar di sini
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Info Note */}
        {isRegister && (
          <div className="mt-4 text-center text-sm text-gray-500 animate-fade-in">
            <div className="glass rounded-lg p-3">
              <p className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Setelah registrasi, verifikasi email Anda dan tunggu persetujuan administrator.
              </p>
            </div>
          </div>
        )}

        {isForgotPassword && (
          <div className="mt-4 text-center text-sm text-gray-500 animate-fade-in">
            <div className="glass rounded-lg p-3">
              <p className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Link reset password akan dikirim ke email Anda dan berlaku selama 1 jam.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
