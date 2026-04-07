"use client";

import { useRouter } from "next/navigation";
import { useOthers, useSelf } from "@liveblocks/react";

interface ToolbarProps {
  fileName: string;
  roomId: string;
  onRun: () => void;
  running?: boolean;
}

export function Toolbar({ fileName, roomId, onRun, running }: ToolbarProps) {
  const router = useRouter();
  const self = useSelf();
  const others = useOthers();

  function handleShare() {
    const url = `${window.location.origin}/file/${roomId}`;
    navigator.clipboard.writeText(url);
    // Brief visual feedback via the button text
    const btn = document.getElementById("share-btn");
    if (btn) {
      btn.textContent = "Copied!";
      setTimeout(() => {
        btn.textContent = "Share";
      }, 1500);
    }
  }

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-dexter-surface border-b border-dexter-border shrink-0">
      {/* Left: Back + filename */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-dexter-text-muted hover:text-dexter-text text-sm transition-colors cursor-pointer"
        >
          &larr; Back
        </button>
        <span className="text-dexter-border">|</span>
        <span className="text-dexter-text font-mono text-sm">{fileName}</span>
      </div>

      {/* Center: Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onRun}
          disabled={running}
          className="px-3 py-1.5 rounded-md bg-dexter-success/90 text-dexter-bg font-semibold text-xs hover:bg-dexter-success transition-colors disabled:opacity-50 cursor-pointer"
        >
          {running ? "Running..." : "Run"}
        </button>
        <button
          id="share-btn"
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
            <span className="text-xs text-dexter-text-muted">
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
            <span className="text-xs text-dexter-text-muted">
              {String(other.info?.name ?? "Anonymous")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
