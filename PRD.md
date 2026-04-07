# Dexter — Product Requirements Document

## 1. Overview

**Dexter** is a minimal, dark-themed, real-time collaborative Python code editor built for two people: you and your girlfriend. It replaces Replit with something fast, simple, and purpose-built for your workflow.

**Core promise:** Open the app → enter your name → create or open a Python file → write code together in real-time → run it → save it.

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
│  │  📄 main.py         — Last edited 2 min ago      │  │
│  │  📄 sorting.py      — Last edited yesterday      │  │
│  │  📄 game.py         — Last edited 3 days ago     │  │
│  │                                                   │  │
│  └──────────────────────────────────────────────────┘  │
│                    │                                    │
│          Click file or create new                       │
│                    │                                    │
│                    ▼                                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │              EDITOR VIEW                          │  │
│  │                                                   │  │
│  │  [Back] [Save] [Run] [Share Link]   👤 Divya     │  │
│  │  ─────────────────────────┬──────────────────── │  │
│  │  Code Editor (CodeMirror) │  Output Panel       │  │
│  │                           │                      │  │
│  │  1 │ def hello():        │  >>> Hello World!    │  │
│  │  2 │     print("Hello")  │                      │  │
│  │  3 │                     │                      │  │
│  │  4 │ hello()      ▊      │                      │  │
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
- Lists all saved Python files, sorted by last edited
- Each file shows: name, last edited timestamp, who edited last
- **"+ New File"** button → prompts for filename → creates `filename.py` → opens editor
- Click any file → opens it in the editor
- Delete file option (with simple confirmation)

### F3. Code Editor
- **CodeMirror 6** with Python syntax highlighting
- Dark theme (One Dark or similar)
- Line numbers, bracket matching, auto-indent
- Comfortable monospace font (JetBrains Mono or Fira Code)
- Standard keybindings (undo/redo, find/replace, etc.)

### F4. Real-Time Collaboration
- When two people have the same file open, edits sync in real-time
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

### F6. Save & Persistence
- **Manual save** via Save button or `Ctrl+S` / `Cmd+S`
- Files stored in **Supabase Postgres**:
  - File content (the Python source code)
  - File name
  - Liveblocks room ID (for real-time sync)
  - Created timestamp
  - Last edited timestamp
  - Last edited by (username)
- Liveblocks also persists the Yjs document state, so if both users disconnect and reconnect, the real-time state is preserved
- Files are globally accessible — no per-user isolation (only 2 users)

### F7. Share Link
- Each file has a unique URL: `dexter.vercel.app/file/[file-id]`
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
| Real-time | **Yjs + Liveblocks** | CRDT-based collaborative editing |
| Python runner | **Pyodide** | In-browser Python via WebAssembly |
| Database | **Supabase (Postgres)** | File storage & metadata |
| Styling | **Tailwind CSS** | Dark theme, utility-first |
| Deployment | **Vercel** | Hosting & serverless functions |

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
                     │ • Presence   │
                     │ • Cursors    │
                     │ • Doc persist│
                     └──────────────┘

           │                                  │
           ▼                                  ▼
  ┌──────────────────────────────────────────────────┐
  │              Vercel (Serverless)                  │
  │                                                   │
  │  /api/liveblocks-auth  → Liveblocks token         │
  │  /api/files            → CRUD operations          │
  │  /api/files/[id]       → Get/Update/Delete file   │
  │                                                   │
  └──────────────────────┬───────────────────────────┘
                         │
                  ┌──────┴──────┐
                  │  Supabase   │
                  │  (Postgres) │
                  │             │
                  │  files      │
                  │  ├─ id      │
                  │  ├─ name    │
                  │  ├─ content │
                  │  ├─ room_id │
                  │  ├─ created │
                  │  ├─ updated │
                  │  └─ edited_by│
                  └─────────────┘
```

### How It All Connects

1. **Page loads** → Next.js serves the app. Username is read from localStorage (or prompted).
2. **Dashboard** → API route fetches file list from Supabase → renders file cards.
3. **Open file** → Navigates to `/file/[id]`. Liveblocks room is joined using the file's `room_id`. Yjs doc syncs to CodeMirror via `y-codemirror.next`. Both users see each other's cursors.
4. **Editing** → Keystrokes update the local Yjs doc → Liveblocks syncs to the other user in ~50ms. No save needed for real-time (it's always synced).
5. **Save** → Serializes Yjs doc to string → POSTs to `/api/files/[id]` → Supabase updates the row. This is the "persistent save" for when both users close the tab.
6. **Run** → Editor content is sent to a Pyodide Web Worker → Python executes → stdout/stderr piped back to the output panel. Entirely client-side.
7. **Share** → Copy the URL `/file/[id]` → she opens it → joins the same Liveblocks room → real-time sync begins.

---

## 6. Database Schema

```sql
CREATE TABLE files (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  content     TEXT DEFAULT '',
  room_id     TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  edited_by   TEXT DEFAULT ''
);
```

Single table. That's it.

---

## 7. Pages & Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing | Username entry → redirect to dashboard |
| `/dashboard` | Dashboard | File list, create new file |
| `/file/[id]` | Editor | CodeMirror + output panel + real-time |

3 pages total.

---

## 8. UI Design Direction

- **Dark theme everywhere** — dark background (#0d1117 or similar GitHub dark), light text
- **Minimal chrome** — no sidebars, no menus, no settings panels
- **Editor-first** — the editor should take up maximum screen real estate
- **Split pane** — editor on left, output on right (resizable)
- **Accent color** — a single accent (teal/cyan or purple) for interactive elements
- **Typography** — JetBrains Mono for code, Inter or system font for UI
- **Cursor colors** — User 1 gets one color (e.g., cyan), User 2 gets another (e.g., pink)

---

## 9. Implementation Tasks

### Phase 1: Project Setup
- [ ] **Task 1.1** — Initialize Next.js project with TypeScript, Tailwind CSS, App Router
- [ ] **Task 1.2** — Set up project structure (`/app`, `/components`, `/lib`, `/workers`)
- [ ] **Task 1.3** — Configure Tailwind with dark theme tokens
- [ ] **Task 1.4** — Set up Supabase project and create `files` table
- [ ] **Task 1.5** — Set up Liveblocks account and get API keys
- [ ] **Task 1.6** — Install all dependencies (CodeMirror, Yjs, Liveblocks, Pyodide, Supabase client)
- [ ] **Task 1.7** — Create environment variables (`.env.local`) for Liveblocks secret key and Supabase URL/key

### Phase 2: Landing Page & Username
- [ ] **Task 2.1** — Build landing page with "Welcome to Dexter" + name input
- [ ] **Task 2.2** — Store username in localStorage on submit
- [ ] **Task 2.3** — Redirect to `/dashboard` after entry
- [ ] **Task 2.4** — Add middleware/logic: if username exists in localStorage, skip landing and go to dashboard

### Phase 3: Dashboard (File Manager)
- [ ] **Task 3.1** — Create `/api/files` GET route — fetch all files from Supabase, sorted by `updated_at`
- [ ] **Task 3.2** — Create `/api/files` POST route — create new file (name, empty content, generate room_id)
- [ ] **Task 3.3** — Create `/api/files/[id]` DELETE route — delete a file
- [ ] **Task 3.4** — Build dashboard page with file list and "New File" button
- [ ] **Task 3.5** — Add "New File" modal/dialog to input filename
- [ ] **Task 3.6** — Add delete file functionality with confirmation

### Phase 4: Code Editor with Real-Time Collaboration
- [ ] **Task 4.1** — Create `/api/liveblocks-auth` route — returns Liveblocks auth token with user info
- [ ] **Task 4.2** — Set up Liveblocks client and provider (`liveblocks.config.ts`)
- [ ] **Task 4.3** — Build editor page (`/file/[id]`) — fetch file metadata from Supabase
- [ ] **Task 4.4** — Integrate CodeMirror 6 with Python language support and dark theme
- [ ] **Task 4.5** — Connect Yjs to CodeMirror via `y-codemirror.next`
- [ ] **Task 4.6** — Connect Yjs to Liveblocks provider for real-time sync
- [ ] **Task 4.7** — Add remote cursor/selection awareness with username labels and colors
- [ ] **Task 4.8** — Add presence indicator ("Divya is here", "Priya is here")
- [ ] **Task 4.9** — Add toolbar: Back button, Save button, Run button, Share Link button

### Phase 5: Save Functionality
- [ ] **Task 5.1** — Create `/api/files/[id]` PUT route — update file content, `updated_at`, `edited_by`
- [ ] **Task 5.2** — Wire Save button to serialize editor content and call PUT
- [ ] **Task 5.3** — Wire `Ctrl+S` / `Cmd+S` keyboard shortcut to save
- [ ] **Task 5.4** — Show save status indicator (Saved / Saving... / Unsaved changes)
- [ ] **Task 5.5** — On file open, load content from Supabase if Yjs doc is empty (initial load)

### Phase 6: Python Execution
- [ ] **Task 6.1** — Create Pyodide Web Worker (`/workers/pyodide.worker.ts`)
- [ ] **Task 6.2** — Handle worker initialization (load Pyodide WASM, show loading state)
- [ ] **Task 6.3** — Wire Run button: send editor content to worker, receive stdout/stderr
- [ ] **Task 6.4** — Build output panel with stdout/stderr display and clear button
- [ ] **Task 6.5** — Handle `input()` calls via prompt dialog or inline input
- [ ] **Task 6.6** — Show execution time after run completes
- [ ] **Task 6.7** — Add `Ctrl+Enter` / `Cmd+Enter` shortcut to run

### Phase 7: Polish & Deploy
- [ ] **Task 7.1** — Add loading states (Pyodide loading, file loading, saving)
- [ ] **Task 7.2** — Add share link copy button (copies URL to clipboard with toast)
- [ ] **Task 7.3** — Responsive layout — ensure it works on different screen sizes
- [ ] **Task 7.4** — Add "Dexter" branding/logo in the header
- [ ] **Task 7.5** — Deploy to Vercel, configure environment variables
- [ ] **Task 7.6** — Test end-to-end: two browsers, real-time sync, run, save, reload

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
    "y-codemirror.next": "latest",
    "@supabase/supabase-js": "latest",
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

---

## 11. External Services Setup Required

| Service | What to Do | Free Tier |
|---------|-----------|-----------|
| **Liveblocks** | Create account → get secret key | Unlimited MAUs, 500 rooms/month |
| **Supabase** | Create project → create `files` table → get URL + anon key | 500MB Postgres, free |
| **Vercel** | Connect GitHub repo → deploy | Free for personal projects |

---

## 12. What This Is NOT

- Not a full IDE (no file trees, no terminal, no git integration)
- Not multi-tenant (no user accounts, no permissions)
- Not multi-language (Python only, for now)
- Not offline-capable (needs internet for real-time sync)
- Not mobile-optimized (desktop-first, should be usable on tablet)

---

## 13. Future Possibilities (Not in Scope)

- Add more languages (JavaScript, etc.)
- Terminal emulator
- File tree with folders
- Themes / font customization
- Version history (time-travel through edits)
- Voice chat while coding
