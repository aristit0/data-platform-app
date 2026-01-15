package models

import "time"

type Document struct {
    ID              string    `json:"id"`
    FileName        string    `json:"file_name"`
    OriginalName    string    `json:"original_name"`
    FileType        string    `json:"file_type"`
    FileSize        int64     `json:"file_size"`
    GCSPath         string    `json:"gcs_path"`
    Product         string    `json:"product"`          // cloudera
    SubProduct      string    `json:"sub_product"`      // cdp
    Category        string    `json:"category"`         // services
    ParsedText      string    `json:"parsed_text"`
    Keywords        []string  `json:"keywords"`
    ErrorMessages   []string  `json:"error_messages"`
    Status          string    `json:"status"`           // uploaded, parsing, parsed, error
    ParsedAt        *time.Time `json:"parsed_at,omitempty"`
    UploadedBy      string    `json:"uploaded_by"`
    UploadedAt      time.Time `json:"uploaded_at"`
    UpdatedAt       time.Time `json:"updated_at"`
}

type UploadRequest struct {
    Product    string `form:"product" binding:"required"`
    SubProduct string `form:"sub_product" binding:"required"`
    Category   string `form:"category" binding:"required"`
}

type SearchResponse struct {
    Documents []Document `json:"documents"`
    Total     int        `json:"total"`
}

type FolderItem struct {
    Name      string `json:"name"`
    Type      string `json:"type"` // folder or file
    Path      string `json:"path"`
    FileCount int    `json:"file_count,omitempty"`
}
