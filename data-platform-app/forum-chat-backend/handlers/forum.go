package handlers

import (
        "fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"forum-chat-backend/models"
	"forum-chat-backend/services"
)

type ForumHandler struct {
	couchbaseService *services.CouchbaseService
}

func NewForumHandler(couchbaseService *services.CouchbaseService) *ForumHandler {
	return &ForumHandler{
		couchbaseService: couchbaseService,
	}
}

// CreateForum - Admin only
func (h *ForumHandler) CreateForum(c *gin.Context) {
	var req models.ForumCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request", "details": err.Error()})
		return
	}

	// Get user info dari context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	username, _ := c.Get("username")
	if username == "" {
		username = "Unknown"
	}

	userIDStr := fmt.Sprintf("%v", userID)
	usernameStr := fmt.Sprintf("%v", username)

	// Create forum dengan creator sebagai admin dan member
	members := []string{userIDStr}
	if req.Members != nil {
		members = append(members, req.Members...)
	}

	forum := &models.Forum{
		ID:          uuid.New().String(),
		Name:        req.Name,
		Description: req.Description,
		CreatedBy:   usernameStr,
		Members:     members,
		Admins:      []string{userIDStr}, // Creator adalah admin
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := h.couchbaseService.CreateForum(forum); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create forum", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Forum created successfully",
		"forum":   forum,
	})
}

// ListForums - Get forums user is member of
func (h *ForumHandler) ListForums(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	role, _ := c.Get("role")
	userIDStr := fmt.Sprintf("%v", userID)
	roleStr := fmt.Sprintf("%v", role)

	var forums []models.Forum
	var err error

	// System admin bisa lihat semua forum
	if roleStr == "admin" {
		forums, err = h.couchbaseService.ListAllForums()
	} else {
		// Regular users hanya lihat forum mereka
		forums, err = h.couchbaseService.ListForums(userIDStr)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list forums", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"forums": forums,
		"total":  len(forums),
	})
}

// GetForum - Get forum details
func (h *ForumHandler) GetForum(c *gin.Context) {
	forumID := c.Param("id")
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	role, _ := c.Get("role")
	userIDStr := fmt.Sprintf("%v", userID)
	roleStr := fmt.Sprintf("%v", role)

	forum, err := h.couchbaseService.GetForum(forumID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Forum not found"})
		return
	}

	// System admin atau member bisa akses
	if roleStr != "admin" {
		isMember := false
		for _, memberID := range forum.Members {
			if memberID == userIDStr {
				isMember = true
				break
			}
		}

		if !isMember {
			c.JSON(http.StatusForbidden, gin.H{"error": "You are not a member of this forum"})
			return
		}
	}

	c.JSON(http.StatusOK, forum)
}

// UpdateForum - Admin only
func (h *ForumHandler) UpdateForum(c *gin.Context) {
	forumID := c.Param("id")
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	role, _ := c.Get("role")
	userIDStr := fmt.Sprintf("%v", userID)
	roleStr := fmt.Sprintf("%v", role)

	var req models.ForumUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request", "details": err.Error()})
		return
	}

	forum, err := h.couchbaseService.GetForum(forumID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Forum not found"})
		return
	}

	// System admin atau forum admin bisa update
	isAdmin := roleStr == "admin"
	isForumAdmin := false
	for _, adminID := range forum.Admins {
		if adminID == userIDStr {
			isForumAdmin = true
			break
		}
	}

	if !isAdmin && !isForumAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only forum admins can update"})
		return
	}

	// Update forum
	if req.Name != "" {
		forum.Name = req.Name
	}
	if req.Description != "" {
		forum.Description = req.Description
	}
	forum.UpdatedAt = time.Now()

	if err := h.couchbaseService.UpdateForum(forum); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update forum", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Forum updated successfully",
		"forum":   forum,
	})
}

// DeleteForum - Admin only
func (h *ForumHandler) DeleteForum(c *gin.Context) {
	forumID := c.Param("id")
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	role, _ := c.Get("role")
	userIDStr := fmt.Sprintf("%v", userID)
	roleStr := fmt.Sprintf("%v", role)

	forum, err := h.couchbaseService.GetForum(forumID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Forum not found"})
		return
	}

	// System admin atau forum admin bisa delete
	isAdmin := roleStr == "admin"
	isForumAdmin := false
	for _, adminID := range forum.Admins {
		if adminID == userIDStr {
			isForumAdmin = true
			break
		}
	}

	if !isAdmin && !isForumAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only admins can delete forum"})
		return
	}

	if err := h.couchbaseService.DeleteForum(forumID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete forum", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Forum deleted successfully",
	})
}

// AddMember - Admin only
func (h *ForumHandler) AddMember(c *gin.Context) {
	forumID := c.Param("id")
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	role, _ := c.Get("role")
	userIDStr := fmt.Sprintf("%v", userID)
	roleStr := fmt.Sprintf("%v", role)

	var req models.ForumMemberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request", "details": err.Error()})
		return
	}

	forum, err := h.couchbaseService.GetForum(forumID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Forum not found"})
		return
	}

	// System admin atau forum admin bisa add member
	isAdmin := roleStr == "admin"
	isForumAdmin := false
	for _, adminID := range forum.Admins {
		if adminID == userIDStr {
			isForumAdmin = true
			break
		}
	}

	if !isAdmin && !isForumAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only admins can add members"})
		return
	}

	// Check if already member
	for _, memberID := range forum.Members {
		if memberID == req.UserID {
			c.JSON(http.StatusBadRequest, gin.H{"error": "User is already a member"})
			return
		}
	}

	// Add member
	forum.Members = append(forum.Members, req.UserID)
	forum.UpdatedAt = time.Now()

	if err := h.couchbaseService.UpdateForum(forum); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add member", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Member added successfully",
		"forum":   forum,
	})
}

// RemoveMember - Admin only
func (h *ForumHandler) RemoveMember(c *gin.Context) {
	forumID := c.Param("id")
	memberID := c.Param("memberId")
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	role, _ := c.Get("role")
	userIDStr := fmt.Sprintf("%v", userID)
	roleStr := fmt.Sprintf("%v", role)

	forum, err := h.couchbaseService.GetForum(forumID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Forum not found"})
		return
	}

	// System admin atau forum admin bisa remove member
	isAdmin := roleStr == "admin"
	isForumAdmin := false
	for _, adminID := range forum.Admins {
		if adminID == userIDStr {
			isForumAdmin = true
			break
		}
	}

	if !isAdmin && !isForumAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only admins can remove members"})
		return
	}

	// Cannot remove creator
	if len(forum.Admins) > 0 && memberID == forum.Admins[0] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot remove forum creator"})
		return
	}

	// Remove member
	newMembers := []string{}
	found := false
	for _, m := range forum.Members {
		if m != memberID {
			newMembers = append(newMembers, m)
		} else {
			found = true
		}
	}

	if !found {
		c.JSON(http.StatusNotFound, gin.H{"error": "Member not found in forum"})
		return
	}

	forum.Members = newMembers
	forum.UpdatedAt = time.Now()

	if err := h.couchbaseService.UpdateForum(forum); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove member", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Member removed successfully",
		"forum":   forum,
	})
}
