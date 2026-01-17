package models

import "time"

type Forum struct {
    ID          string    `json:"id"`
    Name        string    `json:"name"`
    Description string    `json:"description"`
    CreatedBy   string    `json:"created_by"`
    Members     []string  `json:"members"`      // User IDs
    Admins      []string  `json:"admins"`       // User IDs yang bisa manage forum
    CreatedAt   time.Time `json:"created_at"`
    UpdatedAt   time.Time `json:"updated_at"`
}

type ForumCreateRequest struct {
    Name        string   `json:"name" binding:"required"`
    Description string   `json:"description"`
    Members     []string `json:"members"`
}

type ForumUpdateRequest struct {
    Name        string   `json:"name"`
    Description string   `json:"description"`
}

type ForumMemberRequest struct {
    UserID string `json:"user_id" binding:"required"`
}
