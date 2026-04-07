"use client";

import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  visible: boolean;
  onDone: () => void;
  duration?: number;
}

export function Toast({ message, visible, onDone, duration = 2000 }: ToastProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!visible) {
      setShow(false);
      return;
    }

    // Trigger enter animation
    requestAnimationFrame(() => setShow(true));

    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onDone, 200); // wait for exit animation
    }, duration);

    return () => clearTimeout(timer);
  }, [visible, duration, onDone]);

  if (!visible) return null;

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-dexter-surface border border-dexter-border text-dexter-text text-sm font-medium shadow-lg transition-all duration-200 ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      {message}
    </div>
  );
}
