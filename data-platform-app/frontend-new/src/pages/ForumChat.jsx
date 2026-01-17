import { useState, useEffect } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { forumService } from '../services/forumAPI'
import ForumList from '../components/ForumChat/ForumList'
import ChatWindow from '../components/ForumChat/ChatWindow'
import CreateForumModal from '../components/ForumChat/CreateForumModal'
import ManageMembersModal from '../components/ForumChat/ManageMembersModal'
import ForumSettingsModal from '../components/ForumChat/ForumSettingsModal'

export default function ForumChat() {
  const { user } = useAuth()
  const [forums, setForums] = useState([])
  const [selectedForum, setSelectedForum] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)

  // FIX: Define isAdmin properly
  const isSystemAdmin = user?.role === 'admin'

  useEffect(() => {
    loadForums()
  }, [])

  const loadForums = async () => {
    try {
      setLoading(true)
      const data = await forumService.listForums()
      setForums(data.forums || [])
    } catch (error) {
      console.error('Error loading forums:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateForum = async (formData) => {
    try {
      setActionLoading(true)
      await forumService.createForum(formData)
      await loadForums()
      setShowCreateModal(false)
    } catch (error) {
      console.error('Error creating forum:', error)
      alert('Gagal membuat forum')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateForum = async (formData) => {
    try {
      setActionLoading(true)
      await forumService.updateForum(selectedForum.id, formData)
      await loadForums()
      setShowSettingsModal(false)
      
      // Update selected forum
      const updatedForum = await forumService.getForum(selectedForum.id)
      setSelectedForum(updatedForum)
    } catch (error) {
      console.error('Error updating forum:', error)
      alert('Gagal update forum')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteForum = async () => {
    try {
      setActionLoading(true)
      await forumService.deleteForum(selectedForum.id)
      await loadForums()
      setShowSettingsModal(false)
      setSelectedForum(null)
    } catch (error) {
      console.error('Error deleting forum:', error)
      alert('Gagal menghapus forum')
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddMember = async (userId) => {
    try {
      setActionLoading(true)
      await forumService.addMember(selectedForum.id, userId)
      await loadForums()
      
      // Update selected forum
      const updatedForum = await forumService.getForum(selectedForum.id)
      setSelectedForum(updatedForum)
    } catch (error) {
      console.error('Error adding member:', error)
      alert('Gagal menambah member')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Hapus member dari forum ini?')) return

    try {
      setActionLoading(true)
      await forumService.removeMember(selectedForum.id, memberId)
      await loadForums()
      
      // Update selected forum
      const updatedForum = await forumService.getForum(selectedForum.id)
      setSelectedForum(updatedForum)
    } catch (error) {
      console.error('Error removing member:', error)
      alert('Gagal menghapus member')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Forum Chat</h1>
          <p className="text-gray-400">Komunikasi dan kolaborasi tim</p>
        </div>

        {isSystemAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-gradient px-4 py-3 rounded-lg flex items-center gap-2"
          >
            <Plus size={20} />
            <span>Buat Forum</span>
          </button>
        )}
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="animate-spin" size={48} />
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-6 h-[calc(100%-5rem)]">
          {/* Forum List */}
          <div className="col-span-4 glass rounded-2xl p-4 overflow-y-auto">
            <ForumList
              forums={forums}
              selectedForum={selectedForum}
              onSelectForum={setSelectedForum}
              currentUserId={user?.user_id?.toString()}
            />
          </div>

          {/* Chat Window */}
          <div className="col-span-8 glass rounded-2xl overflow-hidden">
            <ChatWindow
              forum={selectedForum}
              currentUser={user}
              onOpenSettings={() => setShowSettingsModal(true)}
              onOpenMembers={() => setShowMembersModal(true)}
            />
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateForumModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateForum}
        loading={actionLoading}
      />

      <ManageMembersModal
        isOpen={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        forum={selectedForum}
        currentUser={user}
        onAddMember={handleAddMember}
        onRemoveMember={handleRemoveMember}
        loading={actionLoading}
      />

      <ForumSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        forum={selectedForum}
        currentUser={user}
        onUpdate={handleUpdateForum}
        onDelete={handleDeleteForum}
        loading={actionLoading}
      />
    </div>
  )
}
