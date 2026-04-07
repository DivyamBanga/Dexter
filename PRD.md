# Dexter — Product Requirements Document

## 1. Overview

**Dexter** is a minimal, dark-themed, real-time collaborative Python code editor built for two people: you and your girlfriend. It replaces Replit with something fast, simple, and purpose-built for your workflow.

**Core promise:** Open the app → enter your name → create or open a Python file → write code together in real-time → run it.

---

## 2. Users & Constraints

| Dimension | Detail |
|-----------|--------|
| Users | 2 (you + girlfriend) |
| Auth | None. Username entry only (stored in localStorage) |
| Language | Python only |
| Deployment | Vercel (frontend + API routes) |
| Theme | Dark only |
| Security | Not a concern — private use only |
| Cost | $0 — all services on free tiers |

---

## 3. User Flow

```
┌─────────────────────────────────────────────────────────┐
│                    OPEN DEXTER                          │
│                                                         │
│  ┌──────────────────────────────┐                       │
│  │  "Welcome to Dexter"        │                       │
│  │  Enter your name: [_______] │                       │
│  │  [Enter]                    │                       │
│  └──────────────────────────────┘                       │
│                    │                                    │
│                    ▼                                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │              DASHBOARD                            │  │
│  │                                                   │  │
│  │  [+ New File]                                    │  │
│  │                                                   │  │
│  │  main.py         — Last active 2 min ago          │  │
│  │  sorting.py      — Last active yesterday          │  │
│  │  game.py         — Last active 3 days ago         │  │
│  │                                                   │  │
│  └──────────────────────────────────────────────────┘  │
│                    │                                    │
│          Click file or create new                       │
│                    │                                    │
│                    ▼                                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │              EDITOR VIEW                          │  │
│  │                                                   │  │
│  │  [Back] [Run] [Share Link]        Divya | Priya   │  │
│  │  ─────────────────────────┬──────────────────── │  │
│  │  Code Editor (CodeMirror) │  Output Panel       │  │
│  │                           │                      │  │
│  │  1 | def hello():        │  >>> Hello World!    │  │
│  │  2 |     print("Hello")  │                      │  │
│  │  3 |                     │                      │  │
│  │  4 | hello()      |      │                      │  │
│  │       ^ her cursor       │                      │  │
│  │                           │                      │  │
│  └──────────────────────────┴──────────────────────┘  │
│                                                         │
│  She opens the same share link → sees the same file,   │
│  both cursors visible, edits sync in real-time.         │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Feature Breakdown

### F1. Username Entry (Landing Page)
- Single input field: "What's your name?"
- Stored in `localStorage` so you don't re-enter it each visit
- No password, no email, no auth
- Goes straight to the dashboard

### F2. Dashboard (File Manager)
- Lists all Python files (fetched from Liveblocks REST API — each file is a room)
- Each file shows: name, last active timestamp
- **"+ New File"** button → prompts for filename → creates room → opens editor
- Click any file → opens it in the editor
- Delete file option (with simple confirmation — deletes the Liveblocks room)

### F3. Code Editor
- **CodeMirror 6** with Python syntax highlighting
- Dark theme (One Dark or similar)
- Line numbers, bracket matching, auto-indent
- Comfortable monospace font (JetBrains Mono or Fira Code)
- Standard keybindings (undo/redo, find/replace, etc.)

### F4. Real-Time Collaboration
- When two people have the same file open, edits sync in real-time (~50ms)
- Each person's cursor is visible with their name label and a distinct color
- Selection ranges are highlighted for each user
- Powered by **Yjs** CRDT synced through **Liveblocks**
- No conflict resolution needed — CRDTs handle it automatically
- Presence awareness: see who's currently in the file

### F5. Python Execution
- **"Run"** button executes the current editor content
- Uses **Pyodide** (CPython compiled to WebAssembly) — runs entirely in-browser
- Output panel shows `stdout` and `stderr`
- Supports `input()` via a simple prompt dialog
- Runs in a **Web Worker** so the UI stays responsive
- Clear output button
- Shows execution time
- Each user runs code independently on their own browser

### F6. Persistence (Auto-Save via Liveblocks)
- **No manual save needed.** Liveblocks automatically persists the Yjs document as you type.
- Close the tab, come back tomorrow → rejoin the room → all code is still there.
- File metadata (name, language) stored as Liveblocks room metadata.
- `lastConnectionAt` on the room provides "last active" timestamps for the dashboard.
- No database. No external storage. Liveblocks is the single source of truth.

### F7. Share Link
- Each file has a unique URL: `dexter.vercel.app/file/[room-id]`
- Copy share link button in the editor toolbar
- Opening a share link brings you directly into the editor for that file
- If you haven't entered a username yet, it prompts for one first

---

## 5. Technical Architecture

### Stack

| Layer | Technology | Role |
|-------|-----------|------|
| Framework | **Next.js 14+ (App Router)** | Frontend + API routes, Vercel-native |
| Editor | **CodeMirror 6** | Code editing with Python mode |
| Real-time + Storage | **Yjs + Liveblocks** | CRDT sync, cursor awareness, document persistence, file metadata |
| Python runner | **Pyodide** | In-browser Python via WebAssembly |
| Styling | **Tailwind CSS** | Dark theme, utility-first |
| Deployment | **Vercel** | Hosting & serverless functions |

**No database. No Supabase. No Firebase.** Liveblocks handles both real-time and persistence.

### How Liveblocks Replaces a Database

Each "file" in Dexter is a Liveblocks room. Here's the mapping:

| Operation | How It Works |
|-----------|-------------|
| **Create file** | `POST /v2/rooms` — creates a room with metadata `{ name: "main.py" }` |
| **List files** | `GET /v2/rooms` — returns all rooms with metadata and `lastConnectionAt` |
| **Open file** | Join the room → Yjs doc loads automatically with all persisted content |
| **Edit file** | Type in CodeMirror → Yjs updates → Liveblocks syncs + persists automatically |
| **Delete file** | `DELETE /v2/rooms/{roomId}` — removes room and its Yjs document |
| **Read file content (server-side)** | `GET /v2/rooms/{roomId}/ydoc` — returns the Yjs document as text |

Room metadata supports up to 50 key-value pairs (values up to 256 chars). More than enough for filename, language, etc.

### Architecture Diagram

```
  ┌─────────────────┐              ┌─────────────────┐
  │   Your Browser   │              │   Her Browser    │
  │                  │              │                  │
  │  Next.js App     │              │  Next.js App     │
  │  ├─ CodeMirror 6 │              │  ├─ CodeMirror 6 │
  │  ├─ Yjs Doc      │◄────────────►│  ├─ Yjs Doc      │
  │  ├─ Pyodide      │  Liveblocks  │  ├─ Pyodide      │
  │  │  (Web Worker)  │  (WebSocket) │  │  (Web Worker)  │
  │  └─ Presence      │              │  └─ Presence      │
  └────────┬─────────┘              └────────┬─────────┘
           │                                  │
           │         ┌──────────────┐         │
           │         │  Liveblocks  │         │
           └────────►│  (Managed)   │◄────────┘
                     │              │
                     │ • Yjs sync   │
                     │ • Persistence│
                     │ • Presence   │
                     │ • Cursors    │
                     │ • Room CRUD  │
                     │ • Metadata   │
                     └──────────────┘
                            ▲
                            │ REST API
                            │
  ┌──────────────────────────────────────────────────┐
  │              Vercel (Serverless)                  │
  │                                                   │
  │  /api/liveblocks-auth  → Auth token for rooms     │
  │  /api/files            → List/Create rooms        │
  │  /api/files/[id]       → Delete room              │
  │                                                   │
  └──────────────────────────────────────────────────┘
```

### How It All Connects — Step by Step

1. **Page loads** → Next.js serves the app. Username is read from localStorage (or prompted on landing page).
2. **Dashboard** → Client calls `/api/files` → API route calls Liveblocks REST API `GET /v2/rooms` → returns room list with metadata (filenames) and `lastConnectionAt` timestamps → renders file cards sorted by most recent.
3. **Create file** → User clicks "+ New File", enters name → Client calls `/api/files` POST → API route calls Liveblocks `POST /v2/rooms` with metadata `{ name: "main.py" }` and `defaultAccesses: ["room:write"]` → redirects to `/file/[roomId]`.
4. **Open file** → Navigate to `/file/[roomId]`. Client joins the Liveblocks room. `LiveblocksYjsProvider` connects. Yjs doc loads from Liveblocks (persisted state). `y-codemirror.next` binds the Yjs doc to CodeMirror. Code appears. Cursors sync.
5. **Editing** → Keystrokes update the local Yjs doc → Liveblocks syncs to the other user in ~50ms → Liveblocks also persists the doc state on their servers automatically. No save button needed.
6. **Run** → Editor content is read from CodeMirror → sent to a Pyodide Web Worker → Python executes in WebAssembly → stdout/stderr piped back to the output panel. Entirely client-side, no server.
7. **Share** → Copy the URL `dexter.vercel.app/file/[roomId]` → she opens it → joins the same Liveblocks room → real-time sync begins instantly.
8. **Close & reopen** → User closes the tab. Comes back hours/days later. Opens the file. Liveblocks room still exists with the persisted Yjs doc. All code is intact.

### Auth Endpoint (Minimal)

The Liveblocks auth endpoint is a single API route that gives users access to rooms:

```
/api/liveblocks-auth (POST)
  → Reads username from request body (passed from localStorage)
  → Calls liveblocks.prepareSession(userId, { userInfo: { name, color } })
  → Grants full access to the requested room
  → Returns auth token
```

This is ~15 lines of code. No passwords, no OAuth, no sessions.

---

## 6. Pages & Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing | Username entry → redirect to dashboard |
| `/dashboard` | Dashboard | File list, create new file, delete files |
| `/file/[id]` | Editor | CodeMirror + output panel + real-time collab |

3 pages. 3 API routes. That's the entire app.

---

## 7. API Routes

| Route | Method | What It Does |
|-------|--------|-------------|
| `/api/liveblocks-auth` | POST | Returns Liveblocks auth token with user info (name, color) |
| `/api/files` | GET | Lists all Liveblocks rooms (files) with metadata |
| `/api/files` | POST | Creates a new Liveblocks room with filename metadata |
| `/api/files/[id]` | DELETE | Deletes a Liveblocks room and its persisted Yjs doc |

All API routes use the `@liveblocks/node` SDK to talk to Liveblocks REST API using the secret key.

---

## 8. UI Design Direction

- **Dark theme everywhere** — dark background (`#0d1117` or similar GitHub dark), light text
- **Minimal chrome** — no sidebars, no menus, no settings panels
- **Editor-first** — the editor should take up maximum screen real estate
- **Split pane** — editor on left, output on right (resizable divider)
- **Accent color** — a single accent (teal/cyan) for interactive elements and buttons
- **Typography** — JetBrains Mono for code, Inter or system font for UI text
- **Cursor colors** — User 1 gets cyan, User 2 gets pink — distinct and visible on dark background
- **Presence pills** — small colored pills with names in the toolbar showing who's online

---

## 9. Implementation Tasks

### Phase 1: Project Setup
- [ ] **Task 1.1** — Initialize Next.js project with TypeScript, Tailwind CSS, App Router
- [ ] **Task 1.2** — Set up project structure (`/app`, `/components`, `/lib`, `/workers`)
- [ ] **Task 1.3** — Configure Tailwind with dark theme color tokens
- [ ] **Task 1.4** — Install all dependencies (CodeMirror, Yjs, Liveblocks, Pyodide)
- [ ] **Task 1.5** — Create `.env.local` with `LIVEBLOCKS_SECRET_KEY`

### Phase 2: Landing Page & Username
- [ ] **Task 2.1** — Build landing page: "Welcome to Dexter" + name input + dark themed
- [ ] **Task 2.2** — Store username in localStorage on submit
- [ ] **Task 2.3** — Redirect to `/dashboard` after entry
- [ ] **Task 2.4** — If username exists in localStorage, skip landing → go to dashboard

### Phase 3: Liveblocks Auth + API Routes
- [ ] **Task 3.1** — Create `/api/liveblocks-auth` POST route (prepareSession with username + color)
- [ ] **Task 3.2** — Create `/api/files` GET route (call Liveblocks `GET /v2/rooms`, return room list)
- [ ] **Task 3.3** — Create `/api/files` POST route (call Liveblocks `POST /v2/rooms` with filename metadata)
- [ ] **Task 3.4** — Create `/api/files/[id]` DELETE route (call Liveblocks `DELETE /v2/rooms/{id}`)

### Phase 4: Dashboard (File Manager)
- [ ] **Task 4.1** — Build dashboard page: fetch files from `/api/files`, render as cards/list
- [ ] **Task 4.2** — Show filename and "last active" time (from `lastConnectionAt`)
- [ ] **Task 4.3** — "+ New File" button with filename input dialog
- [ ] **Task 4.4** — Delete file button with confirmation dialog
- [ ] **Task 4.5** — Click file → navigate to `/file/[roomId]`

### Phase 5: Code Editor with Real-Time Collaboration
- [ ] **Task 5.1** — Set up Liveblocks client config (`liveblocks.config.ts`)
- [ ] **Task 5.2** — Build `/file/[id]` page with `RoomProvider` wrapping the editor
- [ ] **Task 5.3** — Integrate CodeMirror 6 with Python language support + One Dark theme
- [ ] **Task 5.4** — Create Yjs doc, bind to CodeMirror via `y-codemirror.next`
- [ ] **Task 5.5** — Connect Yjs to `LiveblocksYjsProvider` for real-time sync
- [ ] **Task 5.6** — Add remote cursor/selection awareness with username labels and colors
- [ ] **Task 5.7** — Add presence indicator in toolbar (who's online in this file)
- [ ] **Task 5.8** — Add toolbar: Back button, Run button, Share Link copy button

### Phase 6: Python Execution
- [ ] **Task 6.1** — Create Pyodide Web Worker (`/workers/pyodide.worker.ts`)
- [ ] **Task 6.2** — Handle worker initialization (load Pyodide WASM, show loading state)
- [ ] **Task 6.3** — Wire Run button: send editor content to worker, receive stdout/stderr
- [ ] **Task 6.4** — Build output panel (right side of split pane) with stdout/stderr display
- [ ] **Task 6.5** — Add clear output button
- [ ] **Task 6.6** — Handle `input()` calls via prompt dialog
- [ ] **Task 6.7** — Show execution time after run completes
- [ ] **Task 6.8** — Add keyboard shortcut: `Ctrl+Enter` / `Cmd+Enter` to run

### Phase 7: Polish & Deploy
- [ ] **Task 7.1** — Add loading states (Pyodide loading, file loading, connecting to room)
- [ ] **Task 7.2** — Share link copy button with clipboard toast notification
- [ ] **Task 7.3** — Add "Dexter" branding in the header/toolbar
- [ ] **Task 7.4** — Responsive layout tweaks for different screen sizes
- [ ] **Task 7.5** — Deploy to Vercel, configure `LIVEBLOCKS_SECRET_KEY` env variable
- [ ] **Task 7.6** — End-to-end test: two browsers, real-time sync, run Python, close & reopen

---

## 10. Dependencies

```json
{
  "dependencies": {
    "next": "^14",
    "@liveblocks/client": "latest",
    "@liveblocks/react": "latest",
    "@liveblocks/node": "latest",
    "@liveblocks/yjs": "latest",
    "yjs": "latest",
    "@codemirror/state": "latest",
    "@codemirror/view": "latest",
    "@codemirror/lang-python": "latest",
    "@codemirror/theme-one-dark": "latest",
    "codemirror": "latest",
    "y-codemirror.next": "latest",
    "pyodide": "latest"
  },
  "devDependencies": {
    "typescript": "^5",
    "tailwindcss": "^3",
    "@types/node": "latest",
    "@types/react": "latest"
  }
}
```

**No `@supabase/supabase-js`. No database client. Just Liveblocks + editor + runner.**

---

## 11. External Services Required

| Service | Setup | Free Tier | Concerns |
|---------|-------|-----------|----------|
| **Liveblocks** | Create account → copy secret key → paste in `.env.local` | 500 rooms/month, 256MB storage, unlimited users | 500 files max. Storage grows with Yjs edit history over time. |
| **Vercel** | Connect GitHub repo → deploy | Free for personal projects | None |

**That's it. Two services. One API key.**

### Liveblocks Free Tier Details

| Resource | Limit | Impact on Dexter |
|----------|-------|-----------------|
| Monthly active rooms | 500 | 500 files max — plenty for personal use |
| Simultaneous connections/room | 10 | Only need 2 — no issue |
| Realtime data storage | 256 MB | Each .py file is a few KB. Thousands of files before hitting this. |
| Data per room | 10 MB | A single Python file would never approach this. |
| Monthly active users | Unlimited | Only 2 users — no issue |

---

## 12. Known Limitations & Gotchas

1. **Pyodide cold start** — First page load downloads ~10MB of WebAssembly. Cached after that. Show a loading indicator ("Python is loading...").
2. **Pyodide package limits** — C-extension packages not pre-built for Emscripten won't work (e.g., `requests`). Standard library + numpy/pandas work fine.
3. **No stdout streaming** — Pyodide captures stdout after execution completes. Long-running scripts won't show incremental output.
4. **Yjs doc history accumulates** — Yjs stores change history. Heavily-edited files grow in storage over time. The 256MB free tier should last a very long time for 2 users, but worth knowing.
5. **`lastConnectionAt` vs "last edited"** — Liveblocks provides `lastConnectionAt` (when someone last connected to the room), not "last edited at". Opening a file without editing still updates this timestamp. Good enough for 2 users.
6. **Room metadata value limit** — 256 characters per value. Filenames are well within this.
7. **No offline mode** — Requires internet for Liveblocks sync. Pyodide execution works offline after initial load, but edits won't sync.

---

## 13. What This Is NOT

- Not a full IDE (no file trees, no terminal, no git integration)
- Not multi-tenant (no user accounts, no permissions)
- Not multi-language (Python only, for now)
- Not offline-capable (needs internet for real-time sync)
- Not mobile-optimized (desktop-first, should be usable on tablet)

---

## 14. Future Possibilities (Not in Scope)

- Add more languages (JavaScript, etc.)
- Terminal emulator
- File tree with folders
- Themes / font customization
- Version history (time-travel through edits)
- Voice chat while coding
- Mobile layout
