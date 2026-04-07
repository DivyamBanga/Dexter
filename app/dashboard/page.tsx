"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getUsername, clearUsername } from "@/lib/username";
import { timeAgo } from "@/lib/time";
import { Spinner } from "@/components/Spinner";

interface FileItem {
  id: string;
  name: string;
  lastConnectionAt: string | null;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [username, setUsernameState] = useState<string | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);

  // New file dialog
  const [showNewFile, setShowNewFile] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [creating, setCreating] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<FileItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchFiles = useCallback(async () => {
    const res = await fetch("/api/files");
    const data = await res.json();
    setFiles(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    const name = getUsername();
    if (!name) {
      router.replace("/");
      return;
    }
    setUsernameState(name);
    fetchFiles();
  }, [router, fetchFiles]);

  async function handleCreateFile(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newFileName.trim();
    if (!trimmed || creating) return;

    setCreating(true);
    const res = await fetch("/api/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    const file = await res.json();
    setCreating(false);
    setShowNewFile(false);
    setNewFileName("");
    router.push(`/file/${file.id}`);
  }

  async function handleDelete() {
    if (!deleteTarget || deleting) return;

    setDeleting(true);
    await fetch(`/api/files/${deleteTarget.id}`, { method: "DELETE" });
    setFiles((prev) => prev.filter((f) => f.id !== deleteTarget.id));
    setDeleting(false);
    setDeleteTarget(null);
  }

  function handleLogout() {
    clearUsername();
    router.replace("/");
  }

  if (!username) return null;

  return (
    <div className="flex flex-1 flex-col px-6 py-8 max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-dexter-text">Dexter</h1>
          <p className="text-sm text-dexter-text-muted mt-1">
            Hey, {username}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewFile(true)}
            className="px-4 py-2 rounded-lg bg-dexter-accent text-dexter-bg font-semibold text-sm hover:bg-dexter-accent-hover transition-colors cursor-pointer"
          >
            + New File
          </button>
          <button
            onClick={handleLogout}
            className="px-3 py-2 rounded-lg text-sm text-dexter-text-muted hover:text-dexter-text hover:bg-dexter-surface transition-colors cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>

      {/* File List */}
      {loading ? (
        <div className="flex flex-1 items-center justify-center gap-2">
          <Spinner />
          <p className="text-dexter-text-muted text-sm">Loading files...</p>
        </div>
      ) : files.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <p className="text-dexter-text-muted">No files yet.</p>
          <button
            onClick={() => setShowNewFile(true)}
            className="text-dexter-accent hover:text-dexter-accent-hover text-sm transition-colors cursor-pointer"
          >
            Create your first Python file
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {files.map((file) => (
            <div
              key={file.id}
              onClick={() => router.push(`/file/${file.id}`)}
              className="flex items-center justify-between px-4 py-3 rounded-lg bg-dexter-surface border border-dexter-border hover:border-dexter-accent/40 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-dexter-accent font-mono text-sm shrink-0">
                  .py
                </span>
                <span className="text-dexter-text text-sm truncate">
                  {file.name}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-dexter-text-muted text-xs whitespace-nowrap">
                  {timeAgo(file.lastConnectionAt ?? file.createdAt)}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(file);
                  }}
                  className="text-dexter-text-muted hover:text-dexter-danger text-xs opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New File Dialog */}
      {showNewFile && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4"
          onClick={() => {
            setShowNewFile(false);
            setNewFileName("");
          }}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreateFile}
            className="bg-dexter-surface border border-dexter-border rounded-xl p-6 w-full max-w-sm flex flex-col gap-4"
          >
            <h2 className="text-lg font-semibold text-dexter-text">
              New File
            </h2>
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="filename"
              autoFocus
              autoComplete="off"
              maxLength={50}
              className="w-full px-4 py-3 rounded-lg bg-dexter-bg border border-dexter-border text-dexter-text placeholder:text-dexter-text-muted/50 outline-none focus:border-dexter-accent transition-colors font-mono text-sm"
            />
            <p className="text-xs text-dexter-text-muted -mt-2">
              .py will be added automatically
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowNewFile(false);
                  setNewFileName("");
                }}
                className="px-4 py-2 rounded-lg text-sm text-dexter-text-muted hover:text-dexter-text transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newFileName.trim() || creating}
                className="px-4 py-2 rounded-lg bg-dexter-accent text-dexter-bg font-semibold text-sm hover:bg-dexter-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-dexter-surface border border-dexter-border rounded-xl p-6 w-full max-w-sm flex flex-col gap-4"
          >
            <h2 className="text-lg font-semibold text-dexter-text">
              Delete File
            </h2>
            <p className="text-sm text-dexter-text-muted">
              Delete{" "}
              <span className="text-dexter-text font-mono">
                {deleteTarget.name}
              </span>
              ? This can&apos;t be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg text-sm text-dexter-text-muted hover:text-dexter-text transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-dexter-danger text-white font-semibold text-sm hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
