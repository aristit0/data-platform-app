package services

import (
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "time"
)

type UserService struct {
    apiBaseURL string
    httpClient *http.Client
}

type UserResponse struct {
    ID       string `json:"user_id"`
    Username string `json:"username"`
    Name     string `json:"name"`
    Email    string `json:"email"`
}

func NewUserService(apiBaseURL string) *UserService {
    return &UserService{
        apiBaseURL: apiBaseURL,
        httpClient: &http.Client{
            Timeout: 10 * time.Second,
        },
    }
}

// GetUsers - Get user list from main API
func (s *UserService) GetUsers(token string) ([]UserResponse, error) {
    url := fmt.Sprintf("%s/api/users", s.apiBaseURL)
    
    req, err := http.NewRequest("GET", url, nil)
    if err != nil {
        return nil, fmt.Errorf("failed to create request: %v", err)
    }
    
    // Add authorization header
    req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))
    req.Header.Set("Content-Type", "application/json")
    
    resp, err := s.httpClient.Do(req)
    if err != nil {
        return nil, fmt.Errorf("request failed: %v", err)
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != http.StatusOK {
        body, _ := io.ReadAll(resp.Body)
        return nil, fmt.Errorf("API returned status %d: %s", resp.StatusCode, string(body))
    }
    
    var result struct {
        Users []UserResponse `json:"users"`
    }
    
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, fmt.Errorf("failed to decode response: %v", err)
    }
    
    return result.Users, nil
}

// GetUserByID - Get specific user
func (s *UserService) GetUserByID(userID string, token string) (*UserResponse, error) {
    url := fmt.Sprintf("%s/api/users/%s", s.apiBaseURL, userID)
    
    req, err := http.NewRequest("GET", url, nil)
    if err != nil {
        return nil, fmt.Errorf("failed to create request: %v", err)
    }
    
    req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))
    req.Header.Set("Content-Type", "application/json")
    
    resp, err := s.httpClient.Do(req)
    if err != nil {
        return nil, fmt.Errorf("request failed: %v", err)
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != http.StatusOK {
        return nil, fmt.Errorf("user not found or unauthorized")
    }
    
    var user UserResponse
    if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
        return nil, fmt.Errorf("failed to decode response: %v", err)
    }
    
    return &user, nil
}
