package handlers

import (
	"net/http"
	"path/filepath"
	"sync"
	"time"

	"game-rewrite/pkg/db"

	"github.com/gin-gonic/gin"
)

type UserSession struct {
	ClientID string
	LastSeen time.Time
}

var (
	sessions     = make(map[string]UserSession)
	sessionsLock sync.Mutex
)

func getUsername(c *gin.Context) string {
	username := c.GetHeader("X-Username")
	if username == "" {
		username = "default"
	}
	return username
}

func verifySession(username string, clientID string) bool {
	sessionsLock.Lock()
	defer sessionsLock.Unlock()

	if clientID == "" {
		return false
	}

	now := time.Now()
	current, exists := sessions[username]
	if !exists {
		return true
	}

	if now.Sub(current.LastSeen) < 8*time.Second && current.ClientID != clientID {
		return false
	}

	return true
}

func SetupRouter(devMode bool) *gin.Engine {
	if devMode {
		gin.SetMode(gin.DebugMode)
	} else {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	// Heartbeat endpoint
	r.POST("/api/heartbeat", func(c *gin.Context) {
		username := getUsername(c)
		var req struct {
			ClientID string `json:"clientId"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
			return
		}

		sessionsLock.Lock()
		defer sessionsLock.Unlock()

		now := time.Now()
		current, exists := sessions[username]
		isActive := exists && now.Sub(current.LastSeen) < 8*time.Second

		if isActive && current.ClientID != req.ClientID {
			c.JSON(http.StatusOK, gin.H{
				"status":  "conflict",
				"message": "User session active in another window",
			})
			return
		}

		sessions[username] = UserSession{
			ClientID: req.ClientID,
			LastSeen: now,
		}

		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// API endpoints
	r.GET("/api/state", func(c *gin.Context) {
		username := getUsername(c)
		sf, slots, err := db.LoadStateFromDB(username)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load state: " + err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"sf":    sf,
			"slots": slots,
		})
	})

	r.POST("/api/save-slot", func(c *gin.Context) {
		username := getUsername(c)
		clientID := c.GetHeader("X-Client-ID")
		if !verifySession(username, clientID) {
			c.JSON(http.StatusConflict, gin.H{"error": "Session conflict: another window has ownership"})
			return
		}

		var req struct {
			Slot string                 `json:"slot"`
			Data map[string]interface{} `json:"data"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body: " + err.Error()})
			return
		}

		var historyLog []interface{}
		if histVal, ok := req.Data["historyLog"]; ok {
			if histList, ok := histVal.([]interface{}); ok {
				historyLog = histList
			}
		}

		delete(req.Data, "historyLog")

		if err := db.SaveSlotToDB(username, req.Slot, req.Data, historyLog); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save slot: " + err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"success": true})
	})

	r.POST("/api/save-sf", func(c *gin.Context) {
		username := getUsername(c)
		clientID := c.GetHeader("X-Client-ID")
		if !verifySession(username, clientID) {
			c.JSON(http.StatusConflict, gin.H{"error": "Session conflict: another window has ownership"})
			return
		}

		var req struct {
			SF map[string]interface{} `json:"sf"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body: " + err.Error()})
			return
		}

		if err := db.SaveSFToDB(username, req.SF); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save system flags: " + err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"success": true})
	})

	// Serve scenarios
	r.StaticFS("/scenarios", http.Dir("./extracted_data/scenarios"))

	// Serve local media assets from extracted_data
	assetDirs := []string{
		"alter", "bgimage", "bgm", "bland_call", "evimage", "evimage_h_scene",
		"face", "fgimage", "font", "image", "others", "rule", "sound", "voice", "voice_h_scene",
	}
	for _, dir := range assetDirs {
		r.StaticFS("/"+dir, http.Dir(filepath.Join("./extracted_data", dir)))
	}

	// Serve frontend static assets (Vite production build)
	r.StaticFS("/assets", http.Dir("./web-app/dist/assets"))

	// SPA Routing Fallback
	r.NoRoute(func(c *gin.Context) {
		c.File("./web-app/dist/index.html")
	})

	return r
}
