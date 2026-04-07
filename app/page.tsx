"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUsername, setUsername } from "@/lib/username";

export default function LandingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (getUsername()) {
      router.replace("/dashboard");
    } else {
      setReady(true);
    }
  }, [router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setUsername(trimmed);
    router.push("/dashboard");
  }

  if (!ready) return null;

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-center gap-8 w-full max-w-sm"
      >
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-5xl font-bold tracking-tight text-dexter-text">
            Dexter
          </h1>
          <p className="text-dexter-text-muted text-sm">
            A tiny Python editor for two.
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <label htmlFor="name" className="text-sm text-dexter-text-muted">
            What&apos;s your name?
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            autoFocus
            autoComplete="off"
            maxLength={20}
            className="w-full px-4 py-3 rounded-lg bg-dexter-surface border border-dexter-border text-dexter-text placeholder:text-dexter-text-muted/50 outline-none focus:border-dexter-accent transition-colors font-mono text-sm"
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-3 rounded-lg bg-dexter-accent text-dexter-bg font-semibold text-sm hover:bg-dexter-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Enter
          </button>
        </div>
      </form>
    </div>
  );
}
