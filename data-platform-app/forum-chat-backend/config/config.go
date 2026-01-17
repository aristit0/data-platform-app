package config

import (
	"os"
)

type Config struct {
	ServerPort          string
	JWTSecret           string
	CouchbaseURL        string
	CouchbaseUsername   string
	CouchbasePassword   string
	CouchbaseBucket     string
	CouchbaseScope      string
	ChatCollection      string
	ForumCollection     string
	GCSBucketName       string
	GCSProjectID        string
	GCSCredentialsPath  string
	GCSUploadFolder     string
}

func LoadConfig() *Config {
	// DON'T load .env - just use environment variables or defaults
	// This seems to cause connection issues with Couchbase
	
	return &Config{
		ServerPort:         getEnv("SERVER_PORT", "2223"),
		JWTSecret:          getEnv("JWT_SECRET", "your-super-secret-jwt-key-change-this-in-production"),
		CouchbaseURL:       getEnv("COUCHBASE_URL", "couchbases://cb.6mhtjxyi5juqnmgr.cloud.couchbase.com"),
		CouchbaseUsername:  getEnv("COUCHBASE_USERNAME", "aris"),
		CouchbasePassword:  getEnv("COUCHBASE_PASSWORD", "T1ku$H1t4m"),
		CouchbaseBucket:    getEnv("COUCHBASE_BUCKET", "knowledge_based"),
		CouchbaseScope:     getEnv("COUCHBASE_SCOPE", "forum"),
		ChatCollection:     getEnv("CHAT_COLLECTION", "chat"),
		ForumCollection:    getEnv("FORUM_COLLECTION", "forums"),
		GCSBucketName:      getEnv("GCS_BUCKET_NAME", "dla-data-platform"),
		GCSProjectID:       getEnv("GCS_PROJECT_ID", "dla-dataplatform-team-sandbox"),
		GCSCredentialsPath: getEnv("GCS_CREDENTIALS_PATH", "/root/data-platform-app/data-platform-app/knowledge-base-backend/credentials/gcs-key.json"),
		GCSUploadFolder:    "chat_forum",
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
