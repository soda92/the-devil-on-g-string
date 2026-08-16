# Save / Load & Multi-Tier Database Persistence

The engine features a modern **Document Archives (档案管理)** manager ([`ArchivesModal.tsx`](file:///home/soda/Downloads/G%E5%BC%A6%E4%B8%8A%E7%9A%84%E9%AD%94%E7%8E%8B/web-app/src/components/ArchivesModal.tsx)) backed by an **optimistic multi-tier synchronization architecture** combining fast local storage caching, a Go REST API, and SQLite database persistence.

---

## 🏛️ System Architecture

```
   ┌─────────────────────────────────────────────────────────────┐
   │                Frontend (React / Vite)                      │
   │  • Unified Document Archives (ArchivesModal.tsx)            │
   │  • Fast in-memory state + Note, Pin, Search, Chapter Index  │
   │  • Synchronous localStorage Caching (Zero load latency)     │
   └──────────────────────────────┬──────────────────────────────┘
                                  │ (Sync via REST & Headers)
                                  │ X-Username: <username>
                                  │ X-Client-ID: <uuid>
                                  ▼
   ┌─────────────────────────────────────────────────────────────┐
   │                Backend Server (Go / Gin)                    │
   │  • Multi-user Session Lockout & Heartbeat Check             │
   │  • REST Endpoints: /api/state, /api/save-slot, /api/save-sf │
   └──────────────────────────────┬──────────────────────────────┘
                                  │
                                  ▼
   ┌─────────────────────────────────────────────────────────────┐
   │             SQLite Database via GORM (saves.db)             │
   │  • Table 1: system_flags (Username, Global SF JSON)         │
   │  • Table 2: save_slots   (Username, SlotID, SaveData JSON)  │
   │  • Table 3: save_progress (Normalized Relational History)   │
   └─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema & GORM Entities ([`pkg/db/db.go`](file:///home/soda/Downloads/G%E5%BC%A6%E4%B8%8A%E7%9A%84%E9%AD%94%E7%8E%8B/pkg/db/db.go))

The backend stores all player states in `saves.db` using SQLite with GORM:

```go
type SystemFlag struct {
    Username string `gorm:"primaryKey"`
    SF       string `gorm:"type:text;not null"`
}

type SaveSlot struct {
    Username string         `gorm:"primaryKey"`
    SlotID   string         `gorm:"primaryKey"`
    SaveData string         `gorm:"type:text;not null"`
    Progress []SaveProgress `gorm:"foreignKey:Username,SlotID;references:Username,SlotID;constraint:OnDelete:CASCADE"`
}

type SaveProgress struct {
    Username     string `gorm:"primaryKey"`
    SlotID       string `gorm:"primaryKey"`
    EntryIndex   int    `gorm:"primaryKey"`
    ScenarioName string `gorm:"not null"`
    Pointer      int    `gorm:"not null"`
    SpeakerJP    string
    SpeakerEN    string
    TextJP       string
    TextEN       string
    Voice        string
    Snapshot     string
}
```

### Key Schema Characteristics
1. **Multi-User Composite Primary Keys**:
   - `(Username, SlotID)` isolates each user (`default`, `alice`, `bob`) without collision.
   - Includes 24 manual slots (`0..23`), auto-save (`autosave`), and special chapter transition slot (`150`).
2. **Relational Dialogue Normalization (`save_progress`)**:
   - Backlog dialogues are parsed and stored relationally in `save_progress`, enabling efficient backend queries, search, and lightweight payloads.

---

## ⚡ Multi-Tier Optimistic Dual-Sync Protocol

1. **Instant Write (Optimistic UI)**:
   - When a save is triggered, the frontend immediately writes to `localStorage` (`${prefix}_save_slot_${id}` and `${prefix}_sf`) and updates React state, giving the player instant feedback without waiting for network I/O.
2. **Background Async Replication**:
   - Dispatches `POST /api/save-slot` and `POST /api/save-sf` in the background with `X-Username` and `X-Client-ID` headers.
3. **On-Boot Two-Way Reconciliation**:
   - When loading the app, `GET /api/state` retrieves server database records.
   - The engine compares timestamps (`date`) between local storage and database entries:
     - Newer database records refresh local storage.
     - Newer offline local records upload to the database.
   - If running in standalone static mode without the Go server, the web app functions autonomously using `localStorage`.

---

## 🛡️ Multi-Tab Conflict Prevention (Session Heartbeat)

- Every browser tab generates a unique `session_client_id` (UUID).
- A 3-second heartbeat (`POST /api/heartbeat`) reports active status to the backend.
- If another tab opens the same profile, inactive tabs receive a safety overlay preventing concurrent overwrite race conditions:
  - **⚡ 强制接管此会话 (Force Take Over)**: Generates a new client ID to claim active ownership with one click.
  - **👤 切换用户 (Switch User)**: Switches to another profile directly without reloading.

---

## 🗂️ Unified Document Archives Features ([`ArchivesModal.tsx`](file:///home/soda/Downloads/G%E5%BC%A6%E4%B8%8A%E7%9A%84%E9%AD%94%E7%8E%8B/web-app/src/components/ArchivesModal.tsx))

1. **Custom Save Notes (备忘笔记)**:
   - Attach customizable memos (e.g. *"Before deciding to trust Kanon"*, *"Ch3 climax scene"*).
   - Editable inline anytime without reloading the save slot.
2. **Multi-Dimensional Views & Filtering**:
   - 🕒 **All Archives (最新优先)**: Shows all saves sorted chronologically.
   - 📖 **By Chapter & Route (按章节分类)**: Groups saves by story milestones (Chapter 1–5, Tsubaki Route, Kanon Route, Mizuha Route, Haru Epilogue).
   - ⭐ **Pinned / Favorites (标星收藏)**: Protects favorite saves from accidental deletion or overwriting.
   - 🔍 **Real-time Full-Text Search**: Instant search across custom notes, spoken lines, speaker names, and scenario IDs.
3. **Sensitive Content Blur**:
   - Live thumbnails for intimate/H-scenes are automatically frosted (`filter: blur(12px) brightness(0.65)`) with an interactive **🔞 点击揭开** reveal toggle.
