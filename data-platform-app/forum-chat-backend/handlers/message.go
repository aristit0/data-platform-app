package handlers

import (
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"forum-chat-backend/models"
	"forum-chat-backend/services"
)

type MessageHandler struct {
	couchbaseService *services.CouchbaseService
	storageService   *services.StorageService
	userService      *services.UserService
}

func NewMessageHandler(couchbaseService *services.CouchbaseService, storageService *services.StorageService, userService *services.UserService) *MessageHandler {
	return &MessageHandler{
		couchbaseService: couchbaseService,
		storageService:   storageService,
		userService:      userService,
	}
}

// UserInfo for fetching from Node.js backend
type UserInfo struct {
	UserID    int    `json:"user_id"`
	Email     string `json:"email"`
	FullName  string `json:"full_name"`
	Role      string `json:"role"`
}

// fetchUserInfo - Fetch user info from Node.js backend
func (h *MessageHandler) fetchUserInfo(userID string, token string) (*UserInfo, error) {
	url := fmt.Sprintf("https://127.0.0.1:2221/api/auth/users/%s", userID)
	
	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}
	client := &http.Client{
		Timeout:   10 * time.Second,
		Transport: tr,
	}
	
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}
	
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))
	
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %v", err)
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API returned status %d: %s", resp.StatusCode, string(body))
	}
	
	var userInfo UserInfo
	if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
		return nil, fmt.Errorf("failed to decode response: %v", err)
	}
	
	return &userInfo, nil
}

// SendMessage - Send text or sticker message with optional reply
func (h *MessageHandler) SendMessage(c *gin.Context) {
	var req models.MessageCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request", "details": err.Error()})
		return
	}

	userID := c.GetString("user_id")
	token := c.GetHeader("Authorization")
	
	userInfo, err := h.fetchUserInfo(userID, token)
	if err != nil {
		fmt.Printf("Warning: Failed to fetch user info: %v\n", err)
		userInfo = &UserInfo{
			FullName: "User " + userID,
			Email:    "",
		}
	}

	forum, err := h.couchbaseService.GetForum(req.ForumID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Forum not found"})
		return
	}

	isMember := false
	for _, memberID := range forum.Members {
		if memberID == userID {
			isMember = true
			break
		}
	}

	if !isMember {
		c.JSON(http.StatusForbidden, gin.H{"error": "You are not a member of this forum"})
		return
	}

	// Validate reply_to_id if provided
	if req.ReplyToID != "" {
		messages, err := h.couchbaseService.GetMessages(req.ForumID, 0)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to validate reply"})
			return
		}
		
		replyExists := false
		for _, msg := range messages {
			if msg.ID == req.ReplyToID {
				replyExists = true
				break
			}
		}
		
		if !replyExists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid reply_to_id: message not found"})
			return
		}
	}

	message := &models.Message{
		ID:        uuid.New().String(),
		ForumID:   req.ForumID,
		UserID:    userID,
		Username:  userInfo.FullName,
		UserPhoto: "",
		Type:      req.Type,
		Content:   req.Content,
		ReplyToID: req.ReplyToID,
		CreatedAt: time.Now(),
	}

	if err := h.couchbaseService.CreateMessage(message); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send message", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Message sent successfully",
		"data":    message,
	})
}

// SendFile - Send file, image, or document to GCS with optional reply
func (h *MessageHandler) SendFile(c *gin.Context) {
	forumID := c.PostForm("forum_id")
	messageType := c.PostForm("type")
	replyToID := c.PostForm("reply_to_id")

	if forumID == "" || messageType == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "forum_id and type are required"})
		return
	}

	userID := c.GetString("user_id")
	token := c.GetHeader("Authorization")
	
	userInfo, err := h.fetchUserInfo(userID, token)
	if err != nil {
		fmt.Printf("Warning: Failed to fetch user info: %v\n", err)
		userInfo = &UserInfo{
			FullName: "User " + userID,
			Email:    "",
		}
	}

	forum, err := h.couchbaseService.GetForum(forumID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Forum not found"})
		return
	}

	isMember := false
	for _, memberID := range forum.Members {
		if memberID == userID {
			isMember = true
			break
		}
	}

	if !isMember {
		c.JSON(http.StatusForbidden, gin.H{"error": "You are not a member of this forum"})
		return
	}

	// Validate reply_to_id if provided
	if replyToID != "" {
		messages, err := h.couchbaseService.GetMessages(forumID, 0)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to validate reply"})
			return
		}
		
		replyExists := false
		for _, msg := range messages {
			if msg.ID == replyToID {
				replyExists = true
				break
			}
		}
		
		if !replyExists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid reply_to_id: message not found"})
			return
		}
	}

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}

	maxSize := int64(50 * 1024 * 1024)
	if file.Size > maxSize {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File too large. Maximum 50MB"})
		return
	}

	ext := filepath.Ext(file.Filename)
	filename := fmt.Sprintf("%s_%s%s", uuid.New().String(), time.Now().Format("20060102150405"), ext)

	gcsPath, err := h.storageService.SaveFile(file, filename)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file", "details": err.Error()})
		return
	}

	message := &models.Message{
		ID:            uuid.New().String(),
		ForumID:       forumID,
		UserID:        userID,
		Username:      userInfo.FullName,
		UserPhoto:     "",
		Type:          models.MessageType(messageType),
		Content:       file.Filename,
		ReplyToID:     replyToID,
		AttachmentURL: gcsPath,
		FileName:      file.Filename,
		FileSize:      file.Size,
		CreatedAt:     time.Now(),
	}

	if err := h.couchbaseService.CreateMessage(message); err != nil {
		h.storageService.DeleteFile(gcsPath)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send message", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "File sent successfully",
		"data":    message,
	})
}

// NEW: ProxyFile - Proxy file download through backend with authentication
func (h *MessageHandler) ProxyFile(c *gin.Context) {
	gcsPath := c.Query("path")
	if gcsPath == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "path parameter required"})
		return
	}

	// Download from GCS using backend credentials
	ctx := c.Request.Context()
	fileData, err := h.storageService.DownloadFile(ctx, gcsPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to download file", "details": err.Error()})
		return
	}

	// Get filename and content type
	filename := filepath.Base(gcsPath)
	ext := filepath.Ext(filename)
	contentType := getContentTypeFromExt(ext)

	// Set appropriate headers
	c.Header("Content-Type", contentType)
	c.Header("Content-Disposition", fmt.Sprintf("inline; filename=%s", filename))
	c.Header("Cache-Control", "public, max-age=3600") // Cache for 1 hour
	
	// Send file data
	c.Data(http.StatusOK, contentType, fileData)
}

// DownloadFile - Download file from GCS
func (h *MessageHandler) DownloadFile(c *gin.Context) {
	_ = c.Param("messageId")
	_ = c.GetString("user_id")

	gcsPath := c.Query("path")
	if gcsPath == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "path query parameter required"})
		return
	}

	ctx := c.Request.Context()
	fileData, err := h.storageService.DownloadFile(ctx, gcsPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to download file", "details": err.Error()})
		return
	}

	filename := filepath.Base(gcsPath)
	ext := filepath.Ext(filename)
	contentType := getContentTypeFromExt(ext)

	c.Header("Content-Description", "File Transfer")
	c.Header("Content-Transfer-Encoding", "binary")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))
	c.Header("Content-Type", contentType)
	c.Data(http.StatusOK, contentType, fileData)
}

// GetMessages - Get messages from a forum
func (h *MessageHandler) GetMessages(c *gin.Context) {
	forumID := c.Param("forumId")
	userID := c.GetString("user_id")

	limitStr := c.DefaultQuery("limit", "100")
	limit, _ := strconv.Atoi(limitStr)

	forum, err := h.couchbaseService.GetForum(forumID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Forum not found"})
		return
	}

	isMember := false
	for _, memberID := range forum.Members {
		if memberID == userID {
			isMember = true
			break
		}
	}

	if !isMember {
		c.JSON(http.StatusForbidden, gin.H{"error": "You are not a member of this forum"})
		return
	}

	messages, err := h.couchbaseService.GetMessages(forumID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get messages", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"messages": messages,
		"total":    len(messages),
	})
}

// DeleteMessage - Delete message and its file from GCS
func (h *MessageHandler) DeleteMessage(c *gin.Context) {
	messageID := c.Param("id")
	_ = c.GetString("user_id")
	role := c.GetString("role")

	if role != "admin" {
		// TODO: Check if user is the message owner or forum admin
	}

	if err := h.couchbaseService.DeleteMessage(messageID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete message", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Message deleted successfully",
	})
}

func getContentTypeFromExt(ext string) string {
	contentTypes := map[string]string{
		".jpg":  "image/jpeg",
		".jpeg": "image/jpeg",
		".png":  "image/png",
		".gif":  "image/gif",
		".webp": "image/webp",
		".pdf":  "application/pdf",
		".doc":  "application/msword",
		".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		".xls":  "application/vnd.ms-excel",
		".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		".ppt":  "application/vnd.ms-powerpoint",
		".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
		".txt":  "text/plain",
		".zip":  "application/zip",
		".rar":  "application/x-rar-compressed",
	}

	if ct, ok := contentTypes[ext]; ok {
		return ct
	}
	return "application/octet-stream"
}
