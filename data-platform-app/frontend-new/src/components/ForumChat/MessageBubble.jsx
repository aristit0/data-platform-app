import { Download, FileText, Image as ImageIcon, Trash2, File, Eye, Reply } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'
import { useState } from 'react'

export default function MessageBubble({ 
  message, 
  isOwnMessage, 
  canDelete, 
  onDelete,
  onDownload,
  onReply
}) {
  const [imageError, setImageError] = useState(false)
  const [showFullImage, setShowFullImage] = useState(false)
  const [showPdfPreview, setShowPdfPreview] = useState(false)

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

  const getFileIcon = (fileName) => {
    const ext = fileName?.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      return <ImageIcon size={20} />
    }
    if (['pdf'].includes(ext)) {
      return <FileText size={20} />
    }
    return <File size={20} />
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return ''
    const mb = bytes / (1024 * 1024)
    if (mb < 1) {
      return `${(bytes / 1024).toFixed(1)} KB`
    }
    return `${mb.toFixed(2)} MB`
  }

  // UPDATED: Use backend proxy URL instead of direct GCS URL
  const getFileUrl = (gcsPath) => {
    // Use backend endpoint with authentication
    return `/forum-api/api/messages/proxy?path=${encodeURIComponent(gcsPath)}`
  }

  // Better image detection
  const isImageFile = (fileName) => {
    if (!fileName) return false
    const ext = fileName.split('.').pop()?.toLowerCase()
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)
  }

  // Check if this is an image message
  const isImage = !imageError && (
    message.type === 'image' || 
    (message.attachment_url && isImageFile(message.file_name)) ||
    (message.attachment_url && isImageFile(message.attachment_url))
  )

  const isPdf = message.attachment_url && /\.pdf$/i.test(message.file_name || message.attachment_url)

  const getUserDisplayName = () => {
    if (message.full_name) return message.full_name
    if (message.username) return message.username
    if (message.user_id) return `User ${message.user_id}`
    return 'Unknown User'
  }

  const getUserInitial = () => {
    if (message.user_photo) return null
    const name = message.full_name || message.username || 'U'
    return name.charAt(0).toUpperCase()
  }

  const getAvatarColor = () => {
    if (!message.user_id) return 'from-gray-500 to-gray-600'
    
    const colors = [
      'from-blue-500 to-blue-600',
      'from-green-500 to-green-600',
      'from-purple-500 to-purple-600',
      'from-pink-500 to-pink-600',
      'from-yellow-500 to-yellow-600',
      'from-red-500 to-red-600',
      'from-indigo-500 to-indigo-600',
      'from-teal-500 to-teal-600',
    ]
    
    const index = parseInt(message.user_id) % colors.length
    return colors[index]
  }

  // Get preview text for reply
  const getPreviewText = () => {
    if (message.type === 'text') {
      return message.content.substring(0, 50) + (message.content.length > 50 ? '...' : '')
    }
    if (message.type === 'sticker') return '🎨 Sticker'
    if (message.type === 'image' || isImage) return '🖼️ Image'
    if (message.type === 'document' || message.type === 'file') return `📎 ${message.file_name}`
    return 'Message'
  }

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4 group`}>
      <div className={`max-w-[70%] flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        {/* User info - Show for other people's messages */}
        {!isOwnMessage && (
          <div className="flex items-center gap-2 mb-1 px-2">
            <div 
              className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor()} flex items-center justify-center text-xs font-bold flex-shrink-0`}
              style={{ 
                backgroundImage: message.user_photo ? `url(${message.user_photo})` : undefined,
                backgroundSize: 'cover'
              }}
            >
              {getUserInitial()}
            </div>
            <div>
              <span className="text-sm font-medium text-gray-200">
                {getUserDisplayName()}
              </span>
            </div>
          </div>
        )}

        {/* Message content */}
        <div className="relative">
          <div
            className={`rounded-2xl p-3 ${
              isOwnMessage
                ? 'bg-primary-600 text-white'
                : 'bg-dark-700 text-gray-100'
            }`}
          >
            {/* Reply to message - WhatsApp style quoted message */}
            {message.reply_to && (
              <div className={`mb-2 p-2 rounded-lg border-l-4 ${
                isOwnMessage 
                  ? 'bg-black/20 border-white/50'
                  : 'bg-black/10 border-primary-500'
              }`}>
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold mb-1 ${
                      isOwnMessage ? 'text-white' : 'text-primary-400'
                    }`}>
                      {message.reply_to.username}
                    </p>
                    <p className="text-sm opacity-80 line-clamp-2">
                      {message.reply_to.preview}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Text message */}
            {message.type === 'text' && (
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            )}

            {/* Sticker */}
            {message.type === 'sticker' && (
              <img 
                src={message.content} 
                alt="Sticker" 
                className="w-32 h-32 object-contain"
                onError={(e) => {
                  e.target.onerror = null
                  e.target.src = 'https://via.placeholder.com/128?text=Sticker'
                }}
              />
            )}

            {/* Image Preview - Now using backend proxy */}
            {isImage && message.attachment_url && (
              <div className="space-y-2">
                <div className="relative group/image">
                  <img
                    src={getFileUrl(message.attachment_url)}
                    alt={message.file_name || 'Image'}
                    className="max-w-full max-h-96 rounded-lg cursor-pointer hover:opacity-90 transition-opacity object-cover"
                    onClick={() => setShowFullImage(true)}
                    onError={() => setImageError(true)}
                    style={{ minWidth: '200px', minHeight: '100px' }}
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg">
                    <button
                      onClick={() => setShowFullImage(true)}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                      title="Lihat fullscreen"
                    >
                      <Eye size={20} />
                    </button>
                    <button
                      onClick={() => onDownload(message)}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                      title="Download"
                    >
                      <Download size={20} />
                    </button>
                  </div>
                </div>
                {message.content && message.content !== message.file_name && (
                  <p className="text-sm">{message.content}</p>
                )}
              </div>
            )}

            {/* PDF */}
            {!isImage && isPdf && message.attachment_url && (
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 bg-black/20 rounded-lg">
                  <div className="flex-shrink-0 text-red-400">
                    <FileText size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{message.file_name}</p>
                    {message.file_size && (
                      <p className="text-xs text-gray-400">{formatFileSize(message.file_size)}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setShowPdfPreview(true)}
                      className="flex-shrink-0 p-2 hover:bg-white/10 rounded-lg transition-colors"
                      title="Preview"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => onDownload(message)}
                      className="flex-shrink-0 p-2 hover:bg-white/10 rounded-lg transition-colors"
                      title="Download"
                    >
                      <Download size={18} />
                    </button>
                  </div>
                </div>
                {message.content && message.content !== message.file_name && (
                  <p className="text-sm">{message.content}</p>
                )}
              </div>
            )}

            {/* Other Files (non-image, non-PDF) */}
            {!isImage && !isPdf && message.attachment_url && (
              <div className="flex items-center gap-3 p-3 bg-black/20 rounded-lg">
                <div className="flex-shrink-0 text-gray-400">
                  {getFileIcon(message.file_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{message.file_name}</p>
                  {message.file_size && (
                    <p className="text-xs text-gray-400">{formatFileSize(message.file_size)}</p>
                  )}
                </div>
                <button
                  onClick={() => onDownload(message)}
                  className="flex-shrink-0 p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Download"
                >
                  <Download size={18} />
                </button>
              </div>
            )}
          </div>

          {/* Reply button - Show on hover for other people's messages */}
          {!isOwnMessage && onReply && (
            <button
              onClick={() => onReply({
                id: message.id,
                user_id: message.user_id,
                username: getUserDisplayName(),
                preview: getPreviewText()
              })}
              className="absolute -right-2 top-1/2 -translate-y-1/2 p-2 bg-dark-600 hover:bg-dark-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              title="Balas pesan"
            >
              <Reply size={16} />
            </button>
          )}
        </div>

        {/* Message footer */}
        <div className={`flex items-center gap-2 mt-1 px-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-xs text-gray-500">
            {formatDate(message.created_at)}
          </span>
          
          {canDelete && (
            <button
              onClick={() => onDelete(message.id)}
              className="text-red-400 hover:text-red-300 transition-colors"
              title="Hapus pesan"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Full image modal - Using backend proxy */}
      {showFullImage && isImage && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setShowFullImage(false)}
        >
          <img
            src={getFileUrl(message.attachment_url)}
            alt={message.file_name || 'Image'}
            className="max-w-full max-h-full object-contain"
          />
          <button
            onClick={() => setShowFullImage(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 text-4xl"
          >
            ×
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDownload(message)
            }}
            className="absolute bottom-4 right-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg flex items-center gap-2"
          >
            <Download size={20} />
            <span>Download</span>
          </button>
        </div>
      )}

      {/* PDF preview modal - Using backend proxy */}
      {showPdfPreview && isPdf && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex flex-col"
          onClick={() => setShowPdfPreview(false)}
        >
          <div className="flex items-center justify-between p-4 bg-dark-800">
            <h3 className="text-lg font-semibold truncate flex-1">{message.file_name}</h3>
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDownload(message)
                }}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg flex items-center gap-2"
              >
                <Download size={18} />
                <span>Download</span>
              </button>
              <button
                onClick={() => setShowPdfPreview(false)}
                className="px-4 py-2 bg-dark-600 hover:bg-dark-500 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
          <iframe
            src={getFileUrl(message.attachment_url)}
            className="flex-1 w-full border-0"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
