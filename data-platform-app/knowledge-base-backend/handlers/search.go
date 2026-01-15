package handlers

import (
    "net/http"

    "github.com/gin-gonic/gin"
    "knowledge-base-backend/services"
)

type SearchHandler struct {
    couchbaseService *services.CouchbaseService
}

func NewSearchHandler(couchbaseService *services.CouchbaseService) *SearchHandler {
    return &SearchHandler{
        couchbaseService: couchbaseService,
    }
}

func (h *SearchHandler) Search(c *gin.Context) {
    query := c.Query("q")
    if query == "" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Query parameter 'q' is required"})
        return
    }

    product := c.Query("product")
    subProduct := c.Query("sub_product")
    category := c.Query("category")

    documents, err := h.couchbaseService.SearchDocuments(query, product, subProduct, category)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Search failed", "details": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "documents": documents,
        "total":     len(documents),
    })
}
