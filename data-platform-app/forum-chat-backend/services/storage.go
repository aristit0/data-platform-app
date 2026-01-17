package services

import (
    "context"
    "fmt"
    "io"
    "mime/multipart"
    "path/filepath"
    "time"

    "cloud.google.com/go/storage"
    "google.golang.org/api/option"
)

type StorageService struct {
    client       *storage.Client
    bucketName   string
    uploadFolder string
}

func NewStorageService(projectID, bucketName, credentialsPath, uploadFolder string) (*StorageService, error) {
    ctx := context.Background()
    
    var client *storage.Client
    var err error
    
    if credentialsPath != "" {
        client, err = storage.NewClient(ctx, option.WithCredentialsFile(credentialsPath))
    } else {
        client, err = storage.NewClient(ctx)
    }
    
    if err != nil {
        return nil, fmt.Errorf("failed to create GCS client: %v", err)
    }

    return &StorageService{
        client:       client,
        bucketName:   bucketName,
        uploadFolder: uploadFolder,
    }, nil
}

func (s *StorageService) SaveFile(file *multipart.FileHeader, filename string) (string, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
    defer cancel()

    // Open uploaded file
    src, err := file.Open()
    if err != nil {
        return "", fmt.Errorf("failed to open file: %v", err)
    }
    defer src.Close()

    // Build GCS path: chat_forum/filename
    gcsPath := fmt.Sprintf("%s/%s", s.uploadFolder, filename)

    // Upload to GCS
    bucket := s.client.Bucket(s.bucketName)
    obj := bucket.Object(gcsPath)
    
    writer := obj.NewWriter(ctx)
    writer.ContentType = getContentType(filepath.Ext(filename))
    
    if _, err := io.Copy(writer, src); err != nil {
        writer.Close()
        return "", fmt.Errorf("failed to upload to GCS: %v", err)
    }
    
    if err := writer.Close(); err != nil {
        return "", fmt.Errorf("failed to close writer: %v", err)
    }

    return gcsPath, nil
}

func (s *StorageService) DeleteFile(gcsPath string) error {
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    bucket := s.client.Bucket(s.bucketName)
    obj := bucket.Object(gcsPath)
    
    if err := obj.Delete(ctx); err != nil {
        return fmt.Errorf("failed to delete from GCS: %v", err)
    }

    return nil
}

func (s *StorageService) GetFileURL(gcsPath string) string {
    // Return public URL or signed URL
    return fmt.Sprintf("https://storage.googleapis.com/%s/%s", s.bucketName, gcsPath)
}

func (s *StorageService) DownloadFile(ctx context.Context, gcsPath string) ([]byte, error) {
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

func (s *StorageService) Close() {
    if s.client != nil {
        s.client.Close()
    }
}

func getContentType(ext string) string {
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
    
    if contentType, ok := contentTypes[ext]; ok {
        return contentType
    }
    return "application/octet-stream"
}

