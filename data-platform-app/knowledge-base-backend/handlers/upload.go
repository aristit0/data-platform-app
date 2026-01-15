package handlers

import (
    "fmt"
    "net/http"
    "path/filepath"
    "strings"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
    "knowledge-base-backend/models"
    "knowledge-base-backend/services"
    "knowledge-base-backend/worker"
)

type UploadHandler struct {
    gcsService       *services.GCSService
    couchbaseService *services.CouchbaseService
    parserWorker     *worker.ParserWorker
}

func NewUploadHandler(
    gcsService *services.GCSService,
    couchbaseService *services.CouchbaseService,
    parserWorker *worker.ParserWorker,
) *UploadHandler {
    return &UploadHandler{
        gcsService:       gcsService,
        couchbaseService: couchbaseService,
        parserWorker:     parserWorker,
    }
}

func (h *UploadHandler) Upload(c *gin.Context) {
    var req models.UploadRequest
    if err := c.ShouldBind(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request", "details": err.Error()})
        return
    }

    file, header, err := c.Request.FormFile("file")
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
        return
    }
    defer file.Close()

    ext := filepath.Ext(header.Filename)
    allowedExts := map[string]bool{
        ".pdf": true, ".docx": true, ".xlsx": true,
        ".csv": true, ".ppt": true, ".pptx": true, ".txt": true,
    }
    if !allowedExts[ext] {
        c.JSON(http.StatusBadRequest, gin.H{"error": "File type not supported"})
        return
    }

    // Generate unique ID
    docID := uuid.New().String()
    
    // Keep original filename (sanitize)
    originalName := header.Filename
    safeName := sanitizeFilename(originalName)
    
    // Build GCS path with original filename
    gcsPath := fmt.Sprintf("knowledge_based/%s/%s/%s/%s",
        req.Product, req.SubProduct, req.Category, safeName)

    ctx := c.Request.Context()
    if err := h.gcsService.UploadFile(ctx, file, safeName, gcsPath); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload file", "details": err.Error()})
        return
    }

    doc := &models.Document{
        ID:           docID,
        FileName:     safeName,  // Original filename
        OriginalName: originalName,
        FileType:     ext,
        FileSize:     header.Size,
        GCSPath:      gcsPath,
        Product:      req.Product,
        SubProduct:   req.SubProduct,
        Category:     req.Category,
        Status:       "uploaded",
        UploadedBy:   c.GetString("user_id"),
        UploadedAt:   time.Now(),
        UpdatedAt:    time.Now(),
    }

    if err := h.couchbaseService.SaveDocument(doc); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save metadata", "details": err.Error()})
        return
    }

    h.parserWorker.AddJob(doc)

    c.JSON(http.StatusOK, gin.H{
        "message": "File uploaded successfully",
        "document": doc,
    })
}

// Sanitize filename to be GCS-safe
func sanitizeFilename(filename string) string {
    // Replace spaces with underscore
    filename = strings.ReplaceAll(filename, " ", "_")
    // Remove special characters except .-_
    var safe strings.Builder
    for _, r := range filename {
        if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || 
           (r >= '0' && r <= '9') || r == '.' || r == '-' || r == '_' {
            safe.WriteRune(r)
        }
    }
    return safe.String()
}
