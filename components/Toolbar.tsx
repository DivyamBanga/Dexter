"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useOthers, useSelf } from "@liveblocks/react";
import { Toast } from "@/components/Toast";

import type { PyodideStatus } from "@/lib/usePyodide";

interface ToolbarProps {
  fileName: string;
  roomId: string;
  onRun: () => void;
  running?: boolean;
  pyodideStatus?: PyodideStatus;
}

export function Toolbar({ fileName, roomId, onRun, running, pyodideStatus }: ToolbarProps) {
  const router = useRouter();
  const self = useSelf();
  const others = useOthers();
  const [toastVisible, setToastVisible] = useState(false);

  function handleShare() {
    const url = `${window.location.origin}/file/${roomId}`;
    navigator.clipboard.writeText(url);
    setToastVisible(true);
  }

  const handleToastDone = useCallback(() => setToastVisible(false), []);

  return (
    <>
      <div className="flex items-center justify-between px-4 py-2 bg-dexter-surface border-b border-dexter-border shrink-0">
        {/* Left: Branding + Back + filename */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-dexter-text-muted hover:text-dexter-text text-sm transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span className="font-bold text-dexter-accent text-sm hidden sm:inline">Dexter</span>
            <span className="text-dexter-border hidden sm:inline">|</span>
            <span>&larr; Back</span>
          </button>
          <span className="text-dexter-border">|</span>
          <span className="text-dexter-text font-mono text-sm truncate max-w-[150px] sm:max-w-none">{fileName}</span>
        </div>

        {/* Center: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onRun}
            disabled={running || pyodideStatus !== "ready"}
            className="px-3 py-1.5 rounded-md bg-dexter-success/90 text-dexter-bg font-semibold text-xs hover:bg-dexter-success transition-colors disabled:opacity-50 cursor-pointer"
          >
            {pyodideStatus === "loading"
              ? "Loading Python..."
              : pyodideStatus === "error"
                ? "Python Error"
                : running
                  ? "Running..."
                  : "Run"}
          </button>
          <button
            onClick={handleShare}
            className="px-3 py-1.5 rounded-md bg-dexter-surface border border-dexter-border text-dexter-text-muted text-xs hover:text-dexter-text hover:border-dexter-accent/40 transition-colors cursor-pointer"
          >
            Share
          </button>
        </div>

        {/* Right: Presence */}
        <div className="flex items-center gap-2">
          {self?.info && (
            <div className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: String(self.info.color) }}
              />
              <span className="text-xs text-dexter-text-muted hidden sm:inline">
                {String(self.info.name)}
              </span>
            </div>
          )}
          {others.map((other) => (
            <div key={other.connectionId} className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: String(other.info?.color ?? "#8b949e") }}
              />
              <span className="text-xs text-dexter-text-muted hidden sm:inline">
                {String(other.info?.name ?? "Anonymous")}
              </span>
            </div>
          ))}
        </div>
      </div>

      <Toast message="Link copied to clipboard!" visible={toastVisible} onDone={handleToastDone} />
    </>
  );
}
