package handlers

import (
    "net/http"

    "github.com/gin-gonic/gin"
)

type StickerHandler struct{}

func NewStickerHandler() *StickerHandler {
    return &StickerHandler{}
}

// GetStickers - Get available anime stickers
func (h *StickerHandler) GetStickers(c *gin.Context) {
    // Cute anime stickers from various free APIs
    stickers := []map[string]string{
        {"id": "happy1", "url": "https://media.tenor.com/images/da23cb5e1e514204a85d2a91ce5edb5a/tenor.gif", "name": "Happy"},
        {"id": "cute1", "url": "https://media.tenor.com/images/f9c4e4a8d5e84f2db8e27f1b8fb9c9a0/tenor.gif", "name": "Cute"},
        {"id": "excited1", "url": "https://media.tenor.com/images/7a2e5a3f5e8f4e2db8e27f1b8fb9c9a0/tenor.gif", "name": "Excited"},
        {"id": "shy1", "url": "https://media.tenor.com/images/5b3c6d4f5e8f4e2db8e27f1b8fb9c9a0/tenor.gif", "name": "Shy"},
        {"id": "laugh1", "url": "https://media.tenor.com/images/9e4f5d3f5e8f4e2db8e27f1b8fb9c9a0/tenor.gif", "name": "Laugh"},
        {"id": "love1", "url": "https://media.tenor.com/images/1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p/tenor.gif", "name": "Love"},
        {"id": "cry1", "url": "https://media.tenor.com/images/2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q/tenor.gif", "name": "Cry"},
        {"id": "angry1", "url": "https://media.tenor.com/images/3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r/tenor.gif", "name": "Angry"},
    }

    c.JSON(http.StatusOK, gin.H{
        "stickers": stickers,
        "total":    len(stickers),
    })
}
