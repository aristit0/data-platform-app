package services

import (
	"fmt"
	"time"

	"github.com/couchbase/gocb/v2"
	"forum-chat-backend/models"
)

type CouchbaseService struct {
	cluster         *gocb.Cluster
	chatCollection  *gocb.Collection
	forumCollection *gocb.Collection
	bucketName      string
	scopeName       string
}

func NewCouchbaseService(url, username, password, bucketName, scopeName, chatColl, forumColl string) (*CouchbaseService, error) {
	// Setup cluster options
	options := gocb.ClusterOptions{
		Authenticator: gocb.PasswordAuthenticator{
			Username: username,
			Password: password,
		},
	}

	// Apply WAN Development profile untuk Capella
	if err := options.ApplyProfile(gocb.ClusterConfigProfileWanDevelopment); err != nil {
		return nil, fmt.Errorf("failed to apply WAN profile: %v", err)
	}

	// Connect to cluster
	cluster, err := gocb.Connect(url, options)
	if err != nil {
		return nil, fmt.Errorf("connect failed: %v", err)
	}

	// Get bucket reference
	bucket := cluster.Bucket(bucketName)

	// Wait until bucket is ready - use 5 seconds like official example
	err = bucket.WaitUntilReady(5*time.Second, nil)
	if err != nil {
		cluster.Close(nil)
		return nil, fmt.Errorf("bucket not ready: %v", err)
	}

	// Get collections
	chatCollection := bucket.Scope(scopeName).Collection(chatColl)
	forumCollection := bucket.Scope(scopeName).Collection(forumColl)

	return &CouchbaseService{
		cluster:         cluster,
		chatCollection:  chatCollection,
		forumCollection: forumCollection,
		bucketName:      bucketName,
		scopeName:       scopeName,
	}, nil
}

// Forum Methods
func (s *CouchbaseService) CreateForum(forum *models.Forum) error {
	_, err := s.forumCollection.Insert(forum.ID, forum, nil)
	if err != nil {
		return fmt.Errorf("failed to create forum: %v", err)
	}
	return nil
}

func (s *CouchbaseService) GetForum(forumID string) (*models.Forum, error) {
	result, err := s.forumCollection.Get(forumID, nil)
	if err != nil {
		return nil, fmt.Errorf("forum not found: %v", err)
	}

	var forum models.Forum
	if err := result.Content(&forum); err != nil {
		return nil, fmt.Errorf("failed to decode forum: %v", err)
	}

	return &forum, nil
}

func (s *CouchbaseService) UpdateForum(forum *models.Forum) error {
	_, err := s.forumCollection.Upsert(forum.ID, forum, nil)
	if err != nil {
		return fmt.Errorf("failed to update forum: %v", err)
	}
	return nil
}

func (s *CouchbaseService) DeleteForum(forumID string) error {
	_, err := s.forumCollection.Remove(forumID, nil)
	if err != nil {
		return fmt.Errorf("failed to delete forum: %v", err)
	}
	return nil
}

func (s *CouchbaseService) ListForums(userID string) ([]models.Forum, error) {
	query := fmt.Sprintf(`
		SELECT f.* FROM %s.%s.forums f
		WHERE $1 IN f.members
		ORDER BY f.created_at DESC
	`, "`"+s.bucketName+"`", "`"+s.scopeName+"`")

	results, err := s.cluster.Query(query, &gocb.QueryOptions{
		PositionalParameters: []interface{}{userID},
	})
	if err != nil {
		return nil, fmt.Errorf("query failed: %v", err)
	}

	var forums []models.Forum
	for results.Next() {
		var forum models.Forum
		if err := results.Row(&forum); err != nil {
			continue
		}
		forums = append(forums, forum)
	}

	if err := results.Err(); err != nil {
		return nil, fmt.Errorf("query iteration error: %v", err)
	}

	return forums, nil
}

func (s *CouchbaseService) ListAllForums() ([]models.Forum, error) {
	query := fmt.Sprintf(`
		SELECT f.* FROM %s.%s.forums f
		ORDER BY f.created_at DESC
	`, "`"+s.bucketName+"`", "`"+s.scopeName+"`")

	results, err := s.cluster.Query(query, nil)
	if err != nil {
		return nil, fmt.Errorf("query failed: %v", err)
	}

	var forums []models.Forum
	for results.Next() {
		var forum models.Forum
		if err := results.Row(&forum); err != nil {
			continue
		}
		forums = append(forums, forum)
	}

	if err := results.Err(); err != nil {
		return nil, fmt.Errorf("query iteration error: %v", err)
	}

	return forums, nil
}

// Message Methods
func (s *CouchbaseService) CreateMessage(message *models.Message) error {
	_, err := s.chatCollection.Insert(message.ID, message, nil)
	if err != nil {
		return fmt.Errorf("failed to create message: %v", err)
	}
	return nil
}

func (s *CouchbaseService) GetMessages(forumID string, limit int) ([]models.Message, error) {
	if limit == 0 {
		limit = 100
	}

	query := fmt.Sprintf(`
		SELECT m.* FROM %s.%s.chat m
		WHERE m.forum_id = $1
		ORDER BY m.created_at DESC
		LIMIT $2
	`, "`"+s.bucketName+"`", "`"+s.scopeName+"`")

	results, err := s.cluster.Query(query, &gocb.QueryOptions{
		PositionalParameters: []interface{}{forumID, limit},
	})
	if err != nil {
		return nil, fmt.Errorf("query failed: %v", err)
	}

	var messages []models.Message
	for results.Next() {
		var message models.Message
		if err := results.Row(&message); err != nil {
			continue
		}
		messages = append(messages, message)
	}

	if err := results.Err(); err != nil {
		return nil, fmt.Errorf("query iteration error: %v", err)
	}

	// Reverse to show oldest first
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}

	return messages, nil
}

func (s *CouchbaseService) DeleteMessage(messageID string) error {
	_, err := s.chatCollection.Remove(messageID, nil)
	if err != nil {
		return fmt.Errorf("failed to delete message: %v", err)
	}
	return nil
}

func (s *CouchbaseService) Close() {
	if s.cluster != nil {
		s.cluster.Close(nil)
	}
}
