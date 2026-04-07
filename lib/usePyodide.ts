"use client";

import { useRef, useState, useCallback, useEffect } from "react";

export type PyodideStatus = "idle" | "loading" | "ready" | "error";

export function usePyodide() {
  const workerRef = useRef<Worker | null>(null);
  const signalRef = useRef<SharedArrayBuffer | null>(null);
  const dataRef = useRef<SharedArrayBuffer | null>(null);
  const startTimeRef = useRef(0);

  const [status, setStatus] = useState<PyodideStatus>("idle");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  useEffect(() => {
    const worker = new Worker("/pyodide-worker.js");
    workerRef.current = worker;

    // Create shared buffers for input() if the browser supports it
    let buffers: { signal: SharedArrayBuffer; data: SharedArrayBuffer } | undefined;
    if (typeof SharedArrayBuffer !== "undefined") {
      const signal = new SharedArrayBuffer(8); // [0]=flag, [1]=length
      const data = new SharedArrayBuffer(4096); // up to 4KB input text
      signalRef.current = signal;
      dataRef.current = data;
      buffers = { signal, data };
    }

    worker.onmessage = (e: MessageEvent) => {
      const { type } = e.data;

      switch (type) {
        case "ready":
          setStatus("ready");
          break;

        case "stdout":
          setOutput((prev) => prev + e.data.text + "\n");
          break;

        case "stderr":
          setOutput((prev) => prev + e.data.text + "\n");
          break;

        case "done":
          setExecutionTime(performance.now() - startTimeRef.current);
          setIsRunning(false);
          break;

        case "error":
          setOutput((prev) => prev + e.data.message + "\n");
          setExecutionTime(performance.now() - startTimeRef.current);
          setIsRunning(false);
          break;

        case "input-request": {
          const value = window.prompt(e.data.prompt || "Input requested:");

          // Echo the prompt + user input to output
          if (e.data.prompt) {
            setOutput((prev) => prev + e.data.prompt);
          }
          setOutput((prev) => prev + (value ?? "") + "\n");

          // Write response to shared buffer and unblock worker
          if (signalRef.current && dataRef.current) {
            const signal = new Int32Array(signalRef.current);
            const data = new Uint8Array(dataRef.current);
            const encoded = new TextEncoder().encode(value ?? "");
            data.set(encoded);
            Atomics.store(signal, 1, encoded.length);
            Atomics.store(signal, 0, 1);
            Atomics.notify(signal, 0);
          }
          break;
        }
      }
    };

    worker.onerror = () => {
      setStatus("error");
    };

    setStatus("loading");
    worker.postMessage({ type: "init", buffers });

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const runCode = useCallback(
    (code: string) => {
      if (!workerRef.current || status !== "ready") return;
      setOutput("");
      setExecutionTime(null);
      setIsRunning(true);
      startTimeRef.current = performance.now();
      workerRef.current.postMessage({ type: "run", code });
    },
    [status],
  );

  const clearOutput = useCallback(() => {
    setOutput("");
    setExecutionTime(null);
  }, []);

  return { status, output, isRunning, executionTime, runCode, clearOutput };
}
