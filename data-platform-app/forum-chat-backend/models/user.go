package models

type User struct {
    ID       string `json:"id"`
    Username string `json:"username"`
    Photo    string `json:"photo"`
    Role     string `json:"role"` // admin or user
}
