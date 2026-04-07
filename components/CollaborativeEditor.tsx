"use client";

import { useEffect, useRef, MutableRefObject } from "react";
import { useRoom, useSelf } from "@liveblocks/react";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";
import * as Y from "yjs";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";
import { yCollab } from "y-codemirror.next";
import { keymap } from "@codemirror/view";

interface CollaborativeEditorProps {
  getCodeRef: MutableRefObject<(() => string) | null>;
  onRunCode?: () => void;
}

export function CollaborativeEditor({
  getCodeRef,
  onRunCode,
}: CollaborativeEditorProps) {
  const room = useRoom();
  const self = useSelf();
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editorRef.current || !self) return;

    const ydoc = new Y.Doc();
    const provider = new LiveblocksYjsProvider(room, ydoc);
    const ytext = ydoc.getText("codemirror");
    const undoManager = new Y.UndoManager(ytext);

    provider.awareness.setLocalStateField("user", {
      name: self.info?.name ?? "Anonymous",
      color: self.info?.color ?? "#58a6ff",
      colorLight: (self.info?.color ?? "#58a6ff") + "40",
    });

    const runKeymap = keymap.of([
      {
        key: "Mod-Enter",
        run: () => {
          onRunCode?.();
          return true;
        },
      },
    ]);

    const state = EditorState.create({
      doc: ytext.toString(),
      extensions: [
        basicSetup,
        python(),
        oneDark,
        runKeymap,
        yCollab(ytext, provider.awareness, { undoManager }),
        EditorView.theme({
          "&": {
            height: "100%",
            fontSize: "14px",
          },
          ".cm-scroller": {
            fontFamily: "var(--font-jetbrains-mono), monospace",
          },
          ".cm-gutters": {
            backgroundColor: "#161b22",
            borderRight: "1px solid #30363d",
          },
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    getCodeRef.current = () => view.state.doc.toString();

    return () => {
      getCodeRef.current = null;
      view.destroy();
      provider.destroy();
      ydoc.destroy();
    };
  }, [room, self, onRunCode, getCodeRef]);

  if (!self) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-dexter-text-muted text-sm">Connecting...</p>
      </div>
    );
  }

  return <div ref={editorRef} className="flex-1 overflow-auto" />;
}
