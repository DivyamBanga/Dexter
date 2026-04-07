"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getUsername } from "@/lib/username";
import { LiveblocksWrapper } from "@/components/LiveblocksWrapper";
import { CollaborativeEditor } from "@/components/CollaborativeEditor";
import { Toolbar } from "@/components/Toolbar";
import { usePyodide } from "@/lib/usePyodide";

interface FileInfo {
  id: string;
  name: string;
}

function EditorContent({ file }: { file: FileInfo }) {
  const getCodeRef = useRef<(() => string) | null>(null);
  const { status, output, isRunning, executionTime, runCode, clearOutput } =
    usePyodide();

  const handleRun = useCallback(() => {
    const code = getCodeRef.current?.();
    if (code == null) return;
    runCode(code);
  }, [runCode]);

  return (
    <div className="flex flex-1 flex-col h-full overflow-hidden">
      <Toolbar
        fileName={file.name}
        roomId={file.id}
        onRun={handleRun}
        running={isRunning}
        pyodideStatus={status}
      />
      <div className="flex flex-1 overflow-hidden">
        {/* Editor pane */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <CollaborativeEditor getCodeRef={getCodeRef} onRunCode={handleRun} />
        </div>

        {/* Output pane */}
        <div className="flex flex-col w-[380px] border-l border-dexter-border shrink-0">
          <div className="flex items-center justify-between px-3 py-2 border-b border-dexter-border bg-dexter-surface">
            <span className="text-xs text-dexter-text-muted font-semibold uppercase tracking-wide">
              Output
            </span>
            <div className="flex items-center gap-3">
              {executionTime != null && (
                <span className="text-xs text-dexter-text-muted tabular-nums">
                  {executionTime < 1000
                    ? `${Math.round(executionTime)}ms`
                    : `${(executionTime / 1000).toFixed(2)}s`}
                </span>
              )}
              {output && (
                <button
                  onClick={clearOutput}
                  className="text-xs text-dexter-text-muted hover:text-dexter-text transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-auto p-3">
            {output ? (
              <pre className="text-sm font-mono text-dexter-text whitespace-pre-wrap break-words">
                {output}
              </pre>
            ) : (
              <p className="text-sm text-dexter-text-muted/50 italic">
                {status === "loading"
                  ? "Python is loading..."
                  : status === "error"
                    ? "Failed to load Python."
                    : "Run your code to see output here."}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FilePage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  const [file, setFile] = useState<FileInfo | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!getUsername()) {
      router.replace("/");
      return;
    }

    fetch(`/api/files`)
      .then((res) => res.json())
      .then((files: FileInfo[]) => {
        const found = files.find((f) => f.id === roomId);
        if (found) {
          setFile(found);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true));
  }, [roomId, router]);

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center flex-col gap-3">
        <p className="text-dexter-text-muted">File not found.</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="text-dexter-accent hover:text-dexter-accent-hover text-sm transition-colors cursor-pointer"
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-dexter-text-muted text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <LiveblocksWrapper roomId={file.id}>
      <EditorContent file={file} />
    </LiveblocksWrapper>
  );
}
