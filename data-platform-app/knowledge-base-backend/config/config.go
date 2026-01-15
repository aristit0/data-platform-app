package config

import (
    "log"
    "os"
    "path/filepath"

    "github.com/joho/godotenv"
)

type Config struct {
    ServerPort          string
    JWTSecret          string  // NEW
    GCSBucketName      string
    GCSProjectID       string
    GCSCredentialsPath string
    CouchbaseURL       string
    CouchbaseUsername  string
    CouchbasePassword  string
    CouchbaseBucket    string
    CouchbaseScope     string
    CouchbaseCollection string
    WorkerChannelSize  int
}

func LoadConfig() *Config {
    // Load .env file
    if err := godotenv.Load(); err != nil {
        log.Printf("Warning: .env file not found, using environment variables")
    }

    // Get absolute path to credentials
    credPath := getEnv("GCS_CREDENTIALS_PATH", "credentials/gcs-key.json")
    
    if !filepath.IsAbs(credPath) {
        absPath, err := filepath.Abs(credPath)
        if err == nil {
            credPath = absPath
        }
    }

    return &Config{
        ServerPort:          getEnv("SERVER_PORT", "2222"),
        JWTSecret:          getEnv("JWT_SECRET", "your-super-secret-jwt-key-change-this-in-production"),  // NEW
        GCSBucketName:      getEnv("GCS_BUCKET_NAME", "dla-data-platform"),
        GCSProjectID:       getEnv("GCS_PROJECT_ID", "dla-dataplatform-team-sandbox"),
        GCSCredentialsPath: credPath,
        CouchbaseURL:       getEnv("COUCHBASE_URL", "couchbases://cb.6mhtjxyi5juqnmgr.cloud.couchbase.com"),
        CouchbaseUsername:  getEnv("COUCHBASE_USERNAME", "aris"),
        CouchbasePassword:  getEnv("COUCHBASE_PASSWORD", "T1ku$H1t4m"),
        CouchbaseBucket:    getEnv("COUCHBASE_BUCKET", "knowledge_based"),
        CouchbaseScope:     getEnv("COUCHBASE_SCOPE", "master_document"),
        CouchbaseCollection: getEnv("COUCHBASE_COLLECTION", "document"),
        WorkerChannelSize:  10,
    }
}

func getEnv(key, defaultValue string) string {
    if value := os.Getenv(key); value != "" {
        return value
    }
    return defaultValue
}
