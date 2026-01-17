import { useState, useEffect } from 'react'
import { X, UserPlus, Trash2, Shield, Loader2, Search, AlertCircle, Crown, Star } from 'lucide-react'
import { usersAPI } from '../../services/api' // CHANGED: Import usersAPI instead of employeesAPI

export default function ManageMembersModal({ 
  isOpen, 
  onClose, 
  forum,
  currentUser,
  onAddMember,
  onRemoveMember,
  loading 
}) {
  const [users, setUsers] = useState([]) // CHANGED: users instead of employees
  const [searchTerm, setSearchTerm] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(false) // CHANGED: loadingUsers
  const [selectedUser, setSelectedUser] = useState('') // CHANGED: selectedUser

  // System Admin has FULL access to all forums
  const isSystemAdmin = currentUser?.role === 'admin'
  const isForumAdminOriginal = forum?.admins?.includes(currentUser?.user_id?.toString())
  const isForumAdmin = isSystemAdmin || isForumAdminOriginal
  
  // For display purposes
  const accessType = isSystemAdmin ? 'system' : isForumAdminOriginal ? 'forum' : 'member'

  useEffect(() => {
    if (isOpen) {
      loadUsers()
    }
  }, [isOpen])

  const loadUsers = async () => {
    try {
      setLoadingUsers(true)
      const response = await usersAPI.getActiveUsers() // CHANGED: use usersAPI
      setUsers(response.data || []) // CHANGED: response structure
    } catch (error) {
      console.error('Error loading users:', error)
      alert('Gagal memuat daftar user')
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleAddMember = async () => {
    if (!selectedUser) {
      alert('Pilih user terlebih dahulu')
      return
    }
    
    if (!isForumAdmin) {
      alert('Hanya admin yang dapat menambah member')
      return
    }

    await onAddMember(selectedUser)
    setSelectedUser('')
    setSearchTerm('')
  }

  const handleRemoveMember = async (memberId) => {
    if (!isForumAdmin) {
      alert('Hanya admin yang dapat menghapus member')
      return
    }

    const member = users.find(u => u.user_id?.toString() === memberId) // CHANGED: user_id
    if (!confirm(`Hapus ${member?.full_name} dari forum ini?`)) return
    
    await onRemoveMember(memberId)
  }

  // CHANGED: Filter logic untuk users
  const availableUsers = users.filter(user => 
    !forum?.members?.includes(user.user_id?.toString()) &&
    (user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     user.username?.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // CHANGED: Current members dari users
  const currentMembers = users.filter(user => 
    forum?.members?.includes(user.user_id?.toString())
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-dark-700">
          <div>
            <h2 className="text-2xl font-bold">Kelola Members</h2>
            <p className="text-sm text-gray-400 mt-1">{forum?.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Info Banner */}
          <div className={`glass rounded-lg p-4 border ${
            isForumAdmin 
              ? 'border-green-500/20 bg-green-500/5' 
              : 'border-yellow-500/20 bg-yellow-500/5'
          }`}>
            <div className="flex items-start gap-3">
              {isSystemAdmin ? (
                <Star size={20} className="text-purple-400 flex-shrink-0 mt-0.5" />
              ) : isForumAdmin ? (
                <Crown size={20} className="text-yellow-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={20} className="text-yellow-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="text-sm">
                <p className="font-medium mb-1">
                  {isSystemAdmin ? (
                    <span className="text-purple-400">⭐ Anda adalah System Administrator</span>
                  ) : isForumAdmin ? (
                    <span className="text-green-400">✓ Anda adalah Admin Forum</span>
                  ) : (
                    <span className="text-yellow-400">ℹ️ Anda adalah Member Biasa</span>
                  )}
                </p>
                <p className="text-gray-400">
                  {isForumAdmin 
                    ? 'Anda memiliki akses penuh untuk mengelola member forum ini'
                    : 'Hanya admin yang dapat mengelola member. Anda hanya dapat melihat daftar member.'}
                </p>
              </div>
            </div>
          </div>

          {/* Current Members */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Shield size={20} />
                Members Saat Ini
              </h3>
              <span className="px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full text-sm font-medium">
                {currentMembers.length} members
              </span>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {loadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin" size={32} />
                </div>
              ) : currentMembers.length === 0 ? (
                <div className="text-center py-8">
                  <Shield size={48} className="mx-auto mb-3 text-gray-600" />
                  <p className="text-gray-400 text-sm">Belum ada member</p>
                </div>
              ) : (
                currentMembers.map((member) => {
                  const isMemberForumAdmin = forum?.admins?.includes(member.user_id?.toString())
                  const isCreator = forum?.admins?.[0] === member.user_id?.toString()
                  const canRemove = isForumAdmin && !isCreator

                  return (
                    <div
                      key={member.user_id}
                      className="flex items-center justify-between p-3 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center font-bold flex-shrink-0 text-sm">
                          {member.full_name?.charAt(0)?.toUpperCase() || member.username?.charAt(0)?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{member.full_name || member.username}</p>
                          <p className="text-sm text-gray-400 truncate">{member.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isMemberForumAdmin && (
                          <span className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${
                            isCreator 
                              ? 'bg-yellow-500/20 text-yellow-400' 
                              : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {isCreator && <Crown size={12} />}
                            {isCreator ? 'Creator' : 'Admin'}
                          </span>
                        )}
                        
                        {canRemove ? (
                          <button
                            onClick={() => handleRemoveMember(member.user_id.toString())}
                            className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                            disabled={loading}
                            title="Hapus member"
                          >
                            <Trash2 size={16} />
                          </button>
                        ) : isCreator ? (
                          <div className="text-xs text-gray-500 px-2">
                            Cannot be removed
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Add Member Section */}
          {isForumAdmin ? (
            <div className="border-t border-white/10 pt-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <UserPlus size={20} />
                Tambah Member Baru
              </h3>

              <div className="space-y-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cari user berdasarkan nama, username, atau email..."
                    className="w-full pl-10 pr-4 py-3 bg-dark-700 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500"
                  />
                </div>

                {/* User Select */}
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500"
                  disabled={loadingUsers || loading}
                >
                  <option value="">
                    {loadingUsers 
                      ? 'Loading...'
                      : availableUsers.length > 0 
                        ? 'Pilih user...' 
                        : 'Semua user sudah menjadi member'}
                  </option>
                  {availableUsers.map((user) => (
                    <option key={user.user_id} value={user.user_id}>
                      {user.full_name || user.username} ({user.email})
                    </option>
                  ))}
                </select>

                {selectedUser && (
                  <div className="glass rounded-lg p-3 border border-primary-500/20">
                    <p className="text-sm text-gray-400">
                      <span className="font-medium text-gray-300">Akan ditambahkan:</span>{' '}
                      {users.find(u => u.user_id?.toString() === selectedUser)?.full_name || 
                       users.find(u => u.user_id?.toString() === selectedUser)?.username}
                    </p>
                  </div>
                )}

                <button
                  onClick={handleAddMember}
                  disabled={!selectedUser || loading || loadingUsers}
                  className="w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      <span>Menambahkan...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={20} />
                      <span>Tambah ke Forum</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="border-t border-white/10 pt-6">
              <div className="glass rounded-lg p-4 border border-gray-500/20 text-center">
                <Shield size={32} className="mx-auto mb-3 text-gray-600" />
                <p className="text-sm text-gray-400">
                  Hanya admin yang dapat menambah atau menghapus member
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Hubungi admin forum jika Anda ingin mengundang orang lain
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-dark-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-dark-600 hover:bg-dark-500 rounded-lg transition-colors font-medium"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
