// Pyodide Web Worker — executes Python code in WebAssembly.

const PYODIDE_CDN = "https://cdn.jsdelivr.net/pyodide/v0.29.3/full/";

let pyodide = null;
let signalBuffer = null;
let dataBuffer = null;

function waitForInput(prompt) {
  if (!signalBuffer) {
    self.postMessage({
      type: "stderr",
      text: "[input() requires cross-origin isolation headers for SharedArrayBuffer]",
    });
    return "";
  }

  const signal = new Int32Array(signalBuffer);
  const data = new Uint8Array(dataBuffer);

  self.postMessage({ type: "input-request", prompt: prompt || "" });

  // Block worker until main thread provides input
  Atomics.store(signal, 0, 0);
  Atomics.wait(signal, 0, 0);

  const length = Atomics.load(signal, 1);
  return new TextDecoder().decode(data.slice(0, length));
}

async function init(buffers) {
  if (buffers) {
    signalBuffer = buffers.signal;
    dataBuffer = buffers.data;
  }

  importScripts(`${PYODIDE_CDN}pyodide.js`);

  pyodide = await self.loadPyodide({
    indexURL: PYODIDE_CDN,
    stdout: (text) => self.postMessage({ type: "stdout", text }),
    stderr: (text) => self.postMessage({ type: "stderr", text }),
  });

  // Expose input helper to Python via the js module
  self._waitForInput = waitForInput;

  // Override input() to route through our helper
  pyodide.runPython(`
import js

def _dexter_input(prompt=""):
    result = js._waitForInput(str(prompt))
    return str(result)

__builtins__.input = _dexter_input
`);

  self.postMessage({ type: "ready" });
}

async function run(code) {
  if (!pyodide) return;
  try {
    await pyodide.runPythonAsync(code);
    self.postMessage({ type: "done" });
  } catch (err) {
    self.postMessage({ type: "error", message: err.message });
  }
}

self.onmessage = async (e) => {
  const { type } = e.data;
  if (type === "init") {
    try {
      await init(e.data.buffers);
    } catch (err) {
      self.postMessage({
        type: "error",
        message: "Failed to load Python: " + err.message,
      });
    }
  } else if (type === "run") {
    await run(e.data.code);
  }
};
