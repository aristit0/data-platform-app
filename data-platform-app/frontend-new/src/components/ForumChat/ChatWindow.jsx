import { useState, useEffect, useRef } from 'react'
import { Send, Paperclip, Smile, Settings, Users, Loader2, X, Image as ImageIcon, FileText, Reply } from 'lucide-react'
import MessageBubble from './MessageBubble'
import { forumService, messageService } from '../../services/forumAPI'

export default function ChatWindow({ forum, currentUser, onOpenSettings, onOpenMembers }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  const [showStickers, setShowStickers] = useState(false)
  const [replyTo, setReplyTo] = useState(null)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const lastMessageIdRef = useRef(null) // Track last message ID

  // Sticker URLs - Using Google Noto Emoji (more reliable)
  const stickers = [
    'https://fonts.gstatic.com/s/e/notoemoji/latest/1f60a/512.gif',
    'https://fonts.gstatic.com/s/e/notoemoji/latest/1f970/512.gif',
    'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44d/512.gif',
    'https://fonts.gstatic.com/s/e/notoemoji/latest/1f62d/512.gif',
    'https://fonts.gstatic.com/s/e/notoemoji/latest/1f602/512.gif',
    'https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/512.gif',
    'https://fonts.gstatic.com/s/e/notoemoji/latest/1f929/512.gif',
    'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44f/512.gif',
  ]

  const isSystemAdmin = currentUser?.role === 'admin'
  const isForumAdmin = isSystemAdmin || forum?.admins?.includes(currentUser?.user_id?.toString())
  const isMember = forum?.members?.includes(currentUser?.user_id?.toString())
  const canSendMessage = isForumAdmin || isMember

  useEffect(() => {
    if (forum) {
      loadMessages()
      const interval = setInterval(loadMessages, 3000)
      return () => clearInterval(interval)
    }
  }, [forum])

  // FIXED: Only scroll when there's a NEW message (different last message ID)
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessageIdRef.current !== lastMessage.id) {
        // New message detected, scroll to bottom
        scrollToBottom()
        lastMessageIdRef.current = lastMessage.id
      }
    }
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadMessages = async () => {
    if (!forum?.id) return
    try {
      if (messages.length === 0) {
        setLoading(true)
      }
      const data = await messageService.getMessages(forum.id)
      
      // Process messages to include reply_to data
      const processedMessages = (data.messages || []).map(msg => {
        if (msg.reply_to_id) {
          // Find the message being replied to
          const replyToMessage = data.messages.find(m => m.id === msg.reply_to_id)
          if (replyToMessage) {
            return {
              ...msg,
              reply_to: {
                id: replyToMessage.id,
                user_id: replyToMessage.user_id,
                username: replyToMessage.full_name || replyToMessage.username,
                preview: replyToMessage.type === 'text' 
                  ? (replyToMessage.content.substring(0, 50) + (replyToMessage.content.length > 50 ? '...' : ''))
                  : replyToMessage.type === 'sticker' ? '🎨 Sticker'
                  : replyToMessage.type === 'image' ? '🖼️ Image'
                  : `📎 ${replyToMessage.file_name}`
              }
            }
          }
        }
        return msg
      })
      
      setMessages(processedMessages)
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setFilePreview(reader.result)
        }
        reader.readAsDataURL(file)
      } else {
        setFilePreview(null)
      }
    }
  }

  const clearFile = () => {
    setSelectedFile(null)
    setFilePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if ((!newMessage.trim() && !selectedFile) || !canSendMessage) return

    try {
      setSending(true)

      if (selectedFile) {
        let fileType = 'file'
        if (selectedFile.type.startsWith('image/')) {
          fileType = 'image'
        } else if (selectedFile.type === 'application/pdf' || 
                   selectedFile.type.includes('document') ||
                   selectedFile.type.includes('word') ||
                   selectedFile.type.includes('excel')) {
          fileType = 'document'
        }

        await messageService.uploadFile(forum.id, selectedFile, fileType, null, replyTo?.id)
      } else {
        await messageService.sendMessage(forum.id, newMessage.trim(), 'text', replyTo?.id)
      }

      setNewMessage('')
      setReplyTo(null)
      clearFile()
      await loadMessages()
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Gagal mengirim pesan')
    } finally {
      setSending(false)
    }
  }

  const handleSendSticker = async (stickerUrl) => {
    if (!canSendMessage) return

    try {
      setSending(true)
      await messageService.sendSticker(forum.id, stickerUrl, replyTo?.id)
      setShowStickers(false)
      setReplyTo(null)
      await loadMessages()
    } catch (error) {
      console.error('Error sending sticker:', error)
      alert('Gagal mengirim sticker')
    } finally {
      setSending(false)
    }
  }

  const handleDeleteMessage = async (messageId) => {
    if (!confirm('Hapus pesan ini?')) return

    try {
      await messageService.deleteMessage(messageId)
      await loadMessages()
    } catch (error) {
      console.error('Error deleting message:', error)
      alert('Gagal menghapus pesan')
    }
  }

  // FIXED: Use proper download function
  const handleDownload = async (message) => {
    if (message.attachment_url) {
      try {
        await messageService.downloadFile(message.id, message.attachment_url, message.file_name)
      } catch (error) {
        console.error('Failed to download file:', error)
        alert('Gagal download file')
      }
    }
  }

  const handleReply = (replyData) => {
    setReplyTo(replyData)
    // Focus on input field
    setTimeout(() => {
      const input = document.querySelector('input[type="text"][placeholder*="pesan"]')
      if (input) input.focus()
    }, 100)
  }

  const clearReply = () => {
    setReplyTo(null)
  }

  if (!forum) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <Users size={64} className="mx-auto mb-4 opacity-50" />
          <p>Pilih forum untuk memulai chat</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-dark-700 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{forum.name}</h2>
          <p className="text-sm text-gray-400">{forum.members?.length || 0} members</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenMembers}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            title="Kelola Members"
          >
            <Users size={20} />
          </button>
          {isForumAdmin && (
            <button
              onClick={onOpenSettings}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              title="Pengaturan Forum"
            >
              <Settings size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>Belum ada pesan. Mulai percakapan!</p>
          </div>
        ) : (
          messages.map((message) => {
            // FIX: Convert both to string for comparison
            const isOwn = String(message.user_id) === String(currentUser?.user_id)
            
            return (
              <MessageBubble
                key={message.id}
                message={message}
                isOwnMessage={isOwn}
                canDelete={isOwn || isForumAdmin}
                onDelete={handleDeleteMessage}
                onDownload={handleDownload}
                onReply={handleReply}
              />
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {canSendMessage ? (
        <div className="p-4 border-t border-white/10 bg-dark-700">
          {/* Reply Preview */}
          {replyTo && (
            <div className="mb-3 p-3 bg-dark-600 rounded-lg flex items-start gap-3 border-l-2 border-primary-500">
              <Reply size={20} className="flex-shrink-0 text-primary-400 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary-400">
                  Membalas {replyTo.username}
                </p>
                <p className="text-sm text-gray-400 truncate">
                  {replyTo.preview}
                </p>
              </div>
              <button
                onClick={clearReply}
                className="p-1 hover:bg-white/5 rounded transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* File Preview */}
          {selectedFile && (
            <div className="mb-3 p-3 bg-dark-600 rounded-lg flex items-center gap-3">
              {filePreview ? (
                <img src={filePreview} alt="Preview" className="w-16 h-16 object-cover rounded" />
              ) : (
                <div className="w-16 h-16 bg-dark-500 rounded flex items-center justify-center">
                  <FileText size={32} className="text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-gray-400">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                onClick={clearFile}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          )}

          {/* Sticker Picker */}
          {showStickers && (
            <div className="mb-3 p-3 bg-dark-600 rounded-lg">
              <div className="grid grid-cols-8 gap-2">
                {stickers.map((sticker, index) => (
                  <button
                    key={index}
                    onClick={() => handleSendSticker(sticker)}
                    className="w-12 h-12 hover:bg-white/5 rounded-lg transition-colors p-1"
                    disabled={sending}
                  >
                    <img 
                      src={sticker} 
                      alt={`Sticker ${index + 1}`} 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none'
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
            />
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 hover:bg-white/5 rounded-lg transition-colors"
              disabled={sending}
              title="Attach file"
            >
              <Paperclip size={20} />
            </button>

            <button
              type="button"
              onClick={() => setShowStickers(!showStickers)}
              className="p-3 hover:bg-white/5 rounded-lg transition-colors"
              disabled={sending}
              title="Send sticker"
            >
              <Smile size={20} />
            </button>

            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={replyTo ? `Membalas ${replyTo.username}...` : "Ketik pesan..."}
              className="flex-1 px-4 py-3 bg-dark-600 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500"
              disabled={sending}
            />

            <button
              type="submit"
              disabled={(!newMessage.trim() && !selectedFile) || sending}
              className="p-3 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Send size={20} />
              )}
            </button>
          </form>
        </div>
      ) : (
        <div className="p-4 border-t border-white/10 bg-dark-700 text-center text-gray-400">
          <p>Anda bukan member forum ini. Hubungi admin untuk bergabung.</p>
        </div>
      )}
    </div>
  )
}
