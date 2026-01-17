import { useState } from 'react'
import { X, Trash2, Loader2, AlertTriangle, Shield, Star } from 'lucide-react'

export default function ForumSettingsModal({ 
  isOpen, 
  onClose, 
  forum,
  currentUser,
  onUpdate,
  onDelete,
  loading 
}) {
  const [formData, setFormData] = useState({
    name: forum?.name || '',
    description: forum?.description || ''
  })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // System Admin OR Forum Admin can manage
  const isSystemAdmin = currentUser?.role === 'admin'
  const isForumAdminOriginal = forum?.admins?.includes(currentUser?.user_id?.toString())
  const isForumAdmin = isSystemAdmin || isForumAdminOriginal

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!isForumAdmin) {
      alert('Hanya admin yang dapat mengubah pengaturan')
      return
    }
    await onUpdate(formData)
  }

  const handleDelete = async () => {
    if (!isForumAdmin) {
      alert('Hanya admin yang dapat menghapus forum')
      return
    }
    await onDelete()
    setShowDeleteConfirm(false)
  }

  if (!isOpen) return null

  if (!isForumAdmin) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-dark-800 rounded-2xl shadow-2xl max-w-md w-full p-8">
          <div className="text-center">
            <Shield size={64} className="mx-auto mb-4 text-red-400" />
            <h2 className="text-2xl font-bold mb-3">Akses Ditolak</h2>
            <p className="text-gray-400 mb-6">
              Hanya admin yang dapat mengakses pengaturan ini
            </p>
            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              Pengaturan Forum
              {isSystemAdmin && <Star size={20} className="text-purple-400" />}
            </h2>
            {isSystemAdmin && (
              <p className="text-xs text-purple-400 mt-1">System Administrator Access</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleUpdate} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Nama Forum <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Deskripsi
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500 resize-none"
              rows={3}
              disabled={loading}
              placeholder="Deskripsi singkat tentang forum..."
            />
          </div>

          <button
            type="submit"
            className="w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Menyimpan...</span>
              </>
            ) : (
              'Simpan Perubahan'
            )}
          </button>
        </form>

        {/* Danger Zone */}
        <div className="p-6 border-t border-red-500/20 bg-red-500/5">
          <h3 className="text-lg font-semibold mb-2 text-red-400 flex items-center gap-2">
            <AlertTriangle size={20} />
            Danger Zone
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            Menghapus forum akan menghapus <strong>semua pesan, file, dan data terkait</strong>. 
            Tindakan ini <strong>tidak dapat dibatalkan</strong>.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center justify-center gap-2"
              disabled={loading}
            >
              <Trash2 size={20} />
              <span>Hapus Forum</span>
            </button>
          ) : (
            <div className="space-y-3">
              <div className="glass rounded-lg p-4 border border-red-500/50">
                <p className="text-sm text-red-400 font-medium mb-2">
                  ⚠️ Konfirmasi Penghapusan
                </p>
                <p className="text-sm text-gray-300">
                  Apakah Anda yakin ingin menghapus forum <strong>"{forum?.name}"</strong>?
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors"
                  disabled={loading}
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  disabled={loading}
                >
                  {loading ? 'Menghapus...' : 'Ya, Hapus Permanen'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
