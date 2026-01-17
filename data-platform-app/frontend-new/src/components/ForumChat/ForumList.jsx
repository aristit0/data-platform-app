import { MessageSquare, Users, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'

export default function ForumList({ forums, selectedForum, onSelectForum, currentUserId }) {
  const formatDate = (date) => {
    try {
      return formatDistanceToNow(new Date(date), { 
        addSuffix: true,
        locale: id 
      })
    } catch (error) {
      return 'Baru saja'
    }
  }

  return (
    <div className="space-y-2">
      {forums.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
          <p>Belum ada forum</p>
        </div>
      ) : (
        forums.map((forum) => {
          const isActive = selectedForum?.id === forum.id
          const isMember = forum.members?.includes(currentUserId)
          const isAdmin = forum.admins?.includes(currentUserId)

          return (
            <button
              key={forum.id}
              onClick={() => onSelectForum(forum)}
              className={`w-full text-left p-4 rounded-lg transition-all ${
                isActive
                  ? 'bg-primary-600 shadow-lg shadow-primary-600/50'
                  : 'bg-dark-700 hover:bg-dark-600'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{forum.name}</h3>
                    {isAdmin && (
                      <span className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded">
                        Admin
                      </span>
                    )}
                  </div>
                  
                  {forum.description && (
                    <p className="text-sm text-gray-400 line-clamp-2 mb-2">
                      {forum.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Users size={14} />
                      <span>{forum.members?.length || 0} members</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>{formatDate(forum.updated_at || forum.created_at)}</span>
                    </div>
                  </div>
                </div>

                {!isMember && (
                  <div className="flex-shrink-0">
                    <span className="px-2 py-1 text-xs bg-gray-600 text-gray-300 rounded">
                      Read Only
                    </span>
                  </div>
                )}
              </div>
            </button>
          )
        })
      )}
    </div>
  )
}
