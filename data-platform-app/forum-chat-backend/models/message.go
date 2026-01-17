package models

import "time"

type MessageType string

const (
    MessageTypeText     MessageType = "text"
    MessageTypeSticker  MessageType = "sticker"
    MessageTypeFile     MessageType = "file"
    MessageTypeImage    MessageType = "image"
    MessageTypeDocument MessageType = "document"
)

type Message struct {
    ID            string      `json:"id"`
    ForumID       string      `json:"forum_id"`
    UserID        string      `json:"user_id"`
    Username      string      `json:"username"`
    UserPhoto     string      `json:"user_photo"`
    Type          MessageType `json:"type"`
    Content       string      `json:"content"`
    ReplyToID     string      `json:"reply_to_id,omitempty"` // NEW: Add this line
    AttachmentURL string      `json:"attachment_url"`
    FileName      string      `json:"file_name"`
    FileSize      int64       `json:"file_size"`
    CreatedAt     time.Time   `json:"created_at"`
}

type MessageCreateRequest struct {
    ForumID   string      `json:"forum_id" binding:"required"`
    Type      MessageType `json:"type" binding:"required"`
    Content   string      `json:"content"`
    ReplyToID string      `json:"reply_to_id,omitempty"` // NEW: Add this line
}
