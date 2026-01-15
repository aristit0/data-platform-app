import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authAPI } from '../services/api'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('verifying') // verifying, success, error
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token')

      if (!token) {
        setStatus('error')
        setMessage('Token verifikasi tidak ditemukan')
        return
      }

      try {
        const response = await authAPI.verifyEmail(token)
        setStatus('success')
        setMessage(response.data.message || 'Email berhasil diverifikasi!')
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      } catch (error) {
        setStatus('error')
        setMessage(
          error.response?.data?.message || 
          error.response?.data?.error || 
          'Gagal memverifikasi email. Token mungkin tidak valid atau sudah kedaluwarsa.'
        )
      }
    }

    verifyEmail()
  }, [searchParams, navigate])

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

        {/* Verification Status Card */}
        <div className="glass rounded-2xl p-8 shadow-2xl animate-scale-in">
          {status === 'verifying' && (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <svg className="animate-spin h-16 w-16 text-primary-500" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">Memverifikasi Email</h2>
              <p className="text-gray-400">Mohon tunggu sebentar...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2 text-green-400">Email Terverifikasi!</h2>
              <p className="text-gray-400 mb-6">{message}</p>
              <div className="bg-primary-500/10 border border-primary-500/50 text-primary-400 px-4 py-3 rounded-lg">
                <p className="text-sm">Anda akan diarahkan ke halaman login dalam beberapa detik...</p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="mt-4 w-full btn-gradient text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105"
              >
                Ke Halaman Login
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2 text-red-400">Verifikasi Gagal</h2>
              <p className="text-gray-400 mb-6">{message}</p>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full btn-gradient text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105"
                >
                  Kembali ke Login
                </button>
                <p className="text-sm text-gray-500">
                  Token mungkin sudah kedaluwarsa. Silakan minta email verifikasi baru dari halaman login.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
