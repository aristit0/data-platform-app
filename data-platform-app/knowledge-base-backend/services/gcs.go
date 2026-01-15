package services

import (
    "context"
    "fmt"
    "io"
    "mime/multipart"
    "path/filepath"
    "strings"

    "cloud.google.com/go/storage"
    "google.golang.org/api/iterator"
    "google.golang.org/api/option"  // NEW
)

type GCSService struct {
    client     *storage.Client
    bucketName string
}

// NEW: Updated to accept credentials path
func NewGCSService(projectID, bucketName, credentialsPath string) (*GCSService, error) {
    ctx := context.Background()
    
    var client *storage.Client
    var err error
    
    // Use credentials file if provided
    if credentialsPath != "" {
        client, err = storage.NewClient(ctx, option.WithCredentialsFile(credentialsPath))
    } else {
        // Fallback to default credentials (environment variable or Application Default Credentials)
        client, err = storage.NewClient(ctx)
    }
    
    if err != nil {
        return nil, fmt.Errorf("failed to create GCS client: %v", err)
    }

    return &GCSService{
        client:     client,
        bucketName: bucketName,
    }, nil
}

func (s *GCSService) UploadFile(ctx context.Context, file multipart.File, fileName, gcsPath string) error {
    bucket := s.client.Bucket(s.bucketName)
    obj := bucket.Object(gcsPath)
    
    writer := obj.NewWriter(ctx)
    writer.ContentType = getContentType(fileName)
    
    if _, err := io.Copy(writer, file); err != nil {
        writer.Close()
        return fmt.Errorf("failed to copy file: %v", err)
    }
    
    if err := writer.Close(); err != nil {
        return fmt.Errorf("failed to close writer: %v", err)
    }
    
    return nil
}

func (s *GCSService) DownloadFile(ctx context.Context, gcsPath string) ([]byte, error) {
    bucket := s.client.Bucket(s.bucketName)
    obj := bucket.Object(gcsPath)
    
    reader, err := obj.NewReader(ctx)
    if err != nil {
        return nil, fmt.Errorf("failed to create reader: %v", err)
    }
    defer reader.Close()
    
    data, err := io.ReadAll(reader)
    if err != nil {
        return nil, fmt.Errorf("failed to read file: %v", err)
    }
    
    return data, nil
}

func (s *GCSService) ListFolders(ctx context.Context, prefix string) ([]string, error) {
    bucket := s.client.Bucket(s.bucketName)
    
    // Ensure prefix ends with /
    if prefix != "" && !strings.HasSuffix(prefix, "/") {
        prefix += "/"
    }
    
    query := &storage.Query{
        Prefix:    prefix,
        Delimiter: "/",
    }
    
    var folders []string
    it := bucket.Objects(ctx, query)
    
    for {
        attrs, err := it.Next()
        if err == iterator.Done {
            break
        }
        if err != nil {
            return nil, fmt.Errorf("failed to iterate: %v", err)
        }
        
        if attrs.Prefix != "" {
            folders = append(folders, attrs.Prefix)
        }
    }
    
    return folders, nil
}


// Add this method to GCSService

func (s *GCSService) DeleteFile(ctx context.Context, gcsPath string) error {
    bucket := s.client.Bucket(s.bucketName)
    obj := bucket.Object(gcsPath)
    
    if err := obj.Delete(ctx); err != nil {
        return fmt.Errorf("failed to delete file: %v", err)
    }
    
    return nil
}

func getContentType(fileName string) string {
    ext := filepath.Ext(fileName)
    switch ext {
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

func (s *GCSService) Close() {
    s.client.Close()
}
