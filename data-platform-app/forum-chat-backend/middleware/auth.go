package middleware

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

var jwtSecret []byte

func SetJWTSecret(secret string) {
	jwtSecret = []byte(secret)
}

type Claims struct {
	UserID   interface{} `json:"user_id"`  // Bisa int atau string
	Email    string      `json:"email"`
	Username string      `json:"username"`
	Role     string      `json:"role"`
	jwt.RegisteredClaims
}

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")

		// NO-AUTH MODE untuk development/testing
		if authHeader == "" {
			// Set default admin user
			c.Set("user_id", "1")
			c.Set("username", "admin")
			c.Set("email", "admin@dataplatform.com")
			c.Set("role", "admin")
			c.Next()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization format"})
			c.Abort()
			return
		}

		tokenString := parts[1]

		token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return jwtSecret, nil
		})

		if err != nil {
			// Jika token invalid, fallback ke default admin
			c.Set("user_id", "1")
			c.Set("username", "admin")
			c.Set("email", "admin@dataplatform.com")
			c.Set("role", "admin")
			c.Next()
			return
		}

		if claims, ok := token.Claims.(*Claims); ok && token.Valid {
			// Handle both int and string user IDs
			var userIDStr string
			switch v := claims.UserID.(type) {
			case float64:
				userIDStr = fmt.Sprintf("%.0f", v)
			case string:
				userIDStr = v
			case int:
				userIDStr = fmt.Sprintf("%d", v)
			default:
				userIDStr = "1" // Default fallback
			}

			c.Set("user_id", userIDStr)
			c.Set("username", claims.Username)
			c.Set("email", claims.Email)
			c.Set("role", claims.Role)
		} else {
			// Fallback to default admin
			c.Set("user_id", "1")
			c.Set("username", "admin")
			c.Set("email", "admin@dataplatform.com")
			c.Set("role", "admin")
		}

		c.Next()
	}
}

func AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists || role != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
			c.Abort()
			return
		}
		c.Next()
	}
}
