import axios from 'axios'

const forumAPI = axios.create({
  baseURL: '/forum-api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add JWT token interceptor
forumAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor untuk handle errors
forumAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Forum APIs
export const forumService = {
  // Get all forums
  listForums: async () => {
    const response = await forumAPI.get('/forums')
    return response.data
  },

  // Get forum by ID
  getForum: async (forumId) => {
    const response = await forumAPI.get(`/forums/${forumId}`)
    return response.data
  },

  // Create forum (admin only)
  createForum: async (forumData) => {
    const response = await forumAPI.post('/forums', forumData)
    return response.data
  },

  // Update forum
  updateForum: async (forumId, forumData) => {
    const response = await forumAPI.put(`/forums/${forumId}`, forumData)
    return response.data
  },

  // Delete forum
  deleteForum: async (forumId) => {
    const response = await forumAPI.delete(`/forums/${forumId}`)
    return response.data
  },

  // Add member to forum
  addMember: async (forumId, userId) => {
    const response = await forumAPI.post(`/forums/${forumId}/members`, {
      user_id: userId,
    })
    return response.data
  },

  // Remove member from forum
  removeMember: async (forumId, memberId) => {
    const response = await forumAPI.delete(`/forums/${forumId}/members/${memberId}`)
    return response.data
  },
}

// Message APIs
export const messageService = {
  // Get messages from forum
  getMessages: async (forumId, limit = 100) => {
    const response = await forumAPI.get(`/messages/forum/${forumId}`, {
      params: { limit },
    })
    return response.data
  },

  // Send text message (with optional reply_to_id)
  sendMessage: async (forumId, content, type = 'text', replyToId = null) => {
    const payload = {
      forum_id: forumId,
      type: type,
      content: content,
    }
    
    // Add reply_to_id if provided
    if (replyToId) {
      payload.reply_to_id = replyToId
    }
    
    const response = await forumAPI.post('/messages', payload)
    return response.data
  },

  // Send sticker (with optional reply_to_id)
  sendSticker: async (forumId, stickerUrl, replyToId = null) => {
    const payload = {
      forum_id: forumId,
      type: 'sticker',
      content: stickerUrl,
    }
    
    // Add reply_to_id if provided
    if (replyToId) {
      payload.reply_to_id = replyToId
    }
    
    const response = await forumAPI.post('/messages', payload)
    return response.data
  },

  // Upload file/image/document (with optional reply_to_id)
  uploadFile: async (forumId, file, type, onProgress, replyToId = null) => {
    const formData = new FormData()
    formData.append('forum_id', forumId)
    formData.append('type', type) // 'image', 'file', or 'document'
    formData.append('file', file)
    
    // Add reply_to_id if provided
    if (replyToId) {
      formData.append('reply_to_id', replyToId)
    }

    const response = await forumAPI.post('/messages/file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
          onProgress(percentCompleted)
        }
      },
    })
    return response.data
  },

  // Delete message
  deleteMessage: async (messageId) => {
    const response = await forumAPI.delete(`/messages/${messageId}`)
    return response.data
  },

  // Download file
  downloadFile: async (messageId, gcsPath, fileName) => {
    const response = await forumAPI.get(`/messages/${messageId}/download`, {
      params: { path: gcsPath },
      responseType: 'blob',
    })
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },

  // Get public file URL
  getFileUrl: (gcsPath) => {
    return `https://storage.googleapis.com/dla-data-platform/${gcsPath}`
  },
}

// Sticker APIs
export const stickerService = {
  // Get available stickers
  getStickers: async () => {
    const response = await forumAPI.get('/stickers')
    return response.data
  },
}

export default forumAPI
