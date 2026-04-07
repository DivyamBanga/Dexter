# Dexter

A minimal, real-time collaborative Python editor built for two people. No accounts, no setup. Just open it, type your name, and start coding together.

**[Try Dexter](https://dexter-three-pi.vercel.app/)**

## What It Does

- Write and run Python directly in your browser (powered by Pyodide/WebAssembly)
- Real-time collaboration with live cursors and presence indicators
- Auto-saves everything, no save button needed
- Share a link and your partner joins instantly
- Dark theme, clean UI, zero distractions

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router) |
| Editor | CodeMirror 6 |
| Real-time | Yjs + Liveblocks |
| Python Runner | Pyodide (WebAssembly) |
| Styling | Tailwind CSS |
| Hosting | Vercel |

## Running Locally

1. Clone the repo

```bash
git clone https://github.com/DivCodez/OnlinePythonIDE.git
cd OnlinePythonIDE
```

2. Install dependencies

```bash
npm install
```

3. Create a `.env.local` file with your [Liveblocks](https://liveblocks.io) secret key

```
LIVEBLOCKS_SECRET_KEY=sk_your_key_here
```

4. Start the dev server

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## How It Works

Each file is a Liveblocks room. When you open a file, your browser joins the room and syncs a shared Yjs document through Liveblocks. Edits appear on the other person's screen in real-time. Liveblocks also persists the document, so your code survives tab closes and browser restarts.

Python runs entirely in your browser using Pyodide (CPython compiled to WebAssembly). No server involved. Each user runs code independently on their own machine.

## Project Structure

```
app/
  page.tsx              Landing page (name entry)
  dashboard/page.tsx    File manager
  file/[id]/page.tsx    Editor view
  api/
    liveblocks-auth/    Auth endpoint
    files/              List, create, delete files
components/
  CollaborativeEditor   CodeMirror + Yjs + Liveblocks
  Toolbar               Run, share, presence
  Toast                 Clipboard notification
  Spinner               Loading indicator
lib/
  usePyodide            Hook for Python execution
  username              localStorage helpers
  liveblocks-server     Server-side Liveblocks client
public/
  pyodide-worker.js     Web Worker for Python execution
```
