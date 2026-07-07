package handlers

import (
	"net/http"
	"path/filepath"

	"game-rewrite/pkg/db"

	"github.com/gin-gonic/gin"
)

func SetupRouter(devMode bool) *gin.Engine {
	if devMode {
		gin.SetMode(gin.DebugMode)
	} else {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	// API endpoints
	r.GET("/api/state", func(c *gin.Context) {
		sf, slots, err := db.LoadStateFromDB()
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

		if err := db.SaveSlotToDB(req.Slot, req.Data, historyLog); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save slot: " + err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"success": true})
	})

	r.POST("/api/save-sf", func(c *gin.Context) {
		var req struct {
			SF map[string]interface{} `json:"sf"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body: " + err.Error()})
			return
		}

		if err := db.SaveSFToDB(req.SF); err != nil {
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
