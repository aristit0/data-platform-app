package handlers

import (
    "context"
    "fmt"
    "net/http"
    "strings"

    "github.com/gin-gonic/gin"
    "knowledge-base-backend/models"
    "knowledge-base-backend/services"
)

type DocumentsHandler struct {
    gcsService       *services.GCSService
    couchbaseService *services.CouchbaseService
}

func NewDocumentsHandler(
    gcsService *services.GCSService,
    couchbaseService *services.CouchbaseService,
) *DocumentsHandler {
    return &DocumentsHandler{
        gcsService:       gcsService,
        couchbaseService: couchbaseService,
    }
}

func (h *DocumentsHandler) ListDocuments(c *gin.Context) {
    path := c.Query("path")
    
    var product, subProduct, category string
    
    if path != "" {
        parts := strings.Split(strings.Trim(path, "/"), "/")
        if len(parts) >= 1 {
            product = parts[0]
        }
        if len(parts) >= 2 {
            subProduct = parts[1]
        }
        if len(parts) >= 3 {
            category = parts[2]
        }
    }

    ctx := context.Background()
    gcsPrefix := "knowledge_based/"
    if path != "" {
        gcsPrefix += path + "/"
    }

    folders, err := h.gcsService.ListFolders(ctx, gcsPrefix)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list folders", "details": err.Error()})
        return
    }

    var folderItems []models.FolderItem
    for _, folder := range folders {
        folderName := strings.TrimPrefix(folder, gcsPrefix)
        folderName = strings.TrimSuffix(folderName, "/")
        
        folderItems = append(folderItems, models.FolderItem{
            Name: folderName,
            Type: "folder",
            Path: strings.TrimPrefix(folder, "knowledge_based/"),
        })
    }

    documents, err := h.couchbaseService.ListDocumentsByPath(product, subProduct, category)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list documents", "details": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "folders":   folderItems,
        "documents": documents,
        "total":     len(documents),
    })
}

func (h *DocumentsHandler) GetDocument(c *gin.Context) {
    docID := c.Param("id")
    
    doc, err := h.couchbaseService.GetDocument(docID)
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Document not found"})
        return
    }

    c.JSON(http.StatusOK, doc)
}

// NEW: Download document from GCS
func (h *DocumentsHandler) DownloadDocument(c *gin.Context) {
    docID := c.Param("id")
    
    // Get document metadata from Couchbase
    doc, err := h.couchbaseService.GetDocument(docID)
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Document not found"})
        return
    }

    // Download file from GCS
    ctx := c.Request.Context()
    fileData, err := h.gcsService.DownloadFile(ctx, doc.GCSPath)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to download file", "details": err.Error()})
        return
    }

    // Set headers for file download
    c.Header("Content-Description", "File Transfer")
    c.Header("Content-Transfer-Encoding", "binary")
    c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", doc.FileName))
    c.Header("Content-Type", getContentType(doc.FileType))
    c.Data(http.StatusOK, getContentType(doc.FileType), fileData)
}

// NEW: Delete document
func (h *DocumentsHandler) DeleteDocument(c *gin.Context) {
    docID := c.Param("id")
    
    // Get document metadata
    doc, err := h.couchbaseService.GetDocument(docID)
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Document not found"})
        return
    }

    // Delete from GCS
    ctx := c.Request.Context()
    if err := h.gcsService.DeleteFile(ctx, doc.GCSPath); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete from GCS", "details": err.Error()})
        return
    }

    // Delete from Couchbase
    if err := h.couchbaseService.DeleteDocument(docID); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete metadata", "details": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "message": "Document deleted successfully",
        "id":      docID,
    })
}

func getContentType(fileType string) string {
    switch fileType {
    case ".pdf":
        return "application/pdf"
    case ".docx":
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    case ".xlsx":
        return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    case ".csv":
        return "text/csv"
    case ".ppt", ".pptx":
        return "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    case ".txt":
        return "text/plain"
    default:
        return "application/octet-stream"
    }
}
