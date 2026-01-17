package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"forum-chat-backend/config"
	"forum-chat-backend/handlers"
	"forum-chat-backend/middleware"
	"forum-chat-backend/services"
)

func main() {
	// Load config
	cfg := config.LoadConfig()

	// Set JWT secret
	middleware.SetJWTSecret(cfg.JWTSecret)

	// Initialize Couchbase
	log.Println("Connecting to Couchbase...")
	couchbaseService, err := services.NewCouchbaseService(
		cfg.CouchbaseURL,
		cfg.CouchbaseUsername,
		cfg.CouchbasePassword,
		cfg.CouchbaseBucket,
		cfg.CouchbaseScope,
		cfg.ChatCollection,
		cfg.ForumCollection,
	)
	if err != nil {
		log.Fatalf("Failed to connect to Couchbase: %v", err)
	}
	defer couchbaseService.Close()
	log.Println("✅ Couchbase connected!")

	// Initialize GCS Storage Service
	log.Println("Connecting to GCS...")
	storageService, err := services.NewStorageService(
		cfg.GCSProjectID,
		cfg.GCSBucketName,
		cfg.GCSCredentialsPath,
		cfg.GCSUploadFolder,
	)
	if err != nil {
		log.Fatalf("Failed to initialize GCS: %v", err)
	}
	defer storageService.Close()
	log.Println("✅ GCS connected!")

	// Initialize User Service for fetching user data from Node.js backend
	log.Println("Initializing User Service...")
	userService := services.NewUserService("https://127.0.0.1:2221")
	log.Println("✅ User Service initialized!")

	// Initialize Handlers
	forumHandler := handlers.NewForumHandler(couchbaseService)
	messageHandler := handlers.NewMessageHandler(couchbaseService, storageService, userService)
	stickerHandler := handlers.NewStickerHandler()

	// Setup Router
	r := gin.Default()

	// Increase upload size
	r.MaxMultipartMemory = 50 << 20 // 50 MB

	r.Use(middleware.CORSMiddleware())

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "forum-chat"})
	})

	// API Routes
	api := r.Group("/api")
	api.Use(middleware.AuthMiddleware())
	{
		// Forum routes
		forums := api.Group("/forums")
		{
			forums.GET("", forumHandler.ListForums)
			forums.GET("/:id", forumHandler.GetForum)
			forums.POST("", middleware.AdminMiddleware(), forumHandler.CreateForum)
			forums.PUT("/:id", forumHandler.UpdateForum)
			forums.DELETE("/:id", forumHandler.DeleteForum)
			forums.POST("/:id/members", forumHandler.AddMember)
			forums.DELETE("/:id/members/:memberId", forumHandler.RemoveMember)
		}

		// Message routes
		messages := api.Group("/messages")
		{
			messages.GET("/forum/:forumId", messageHandler.GetMessages)
			messages.POST("", messageHandler.SendMessage)
			messages.POST("/file", messageHandler.SendFile)
			messages.DELETE("/:id", messageHandler.DeleteMessage)
			messages.GET("/:messageId/download", messageHandler.DownloadFile)
			messages.GET("/proxy", messageHandler.ProxyFile) // NEW: Proxy endpoint
		}

		// Sticker routes
		stickers := api.Group("/stickers")
		{
			stickers.GET("", stickerHandler.GetStickers)
		}
	}

	log.Printf("🚀 Forum Chat Server starting on port %s...", cfg.ServerPort)
	if err := r.Run(":" + cfg.ServerPort); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
