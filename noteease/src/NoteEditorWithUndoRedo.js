import React, { useRef, useEffect, useCallback, useState } from "react";

/**
 * PUBLIC_INTERFACE
 * NoteEditorWithUndoRedo: A content-editable rich text editor with undo/redo history and basic formatting.
 * Props:
 *   - editBuffer: {content: ...}
 *   - setEditBuffer: function to update content
 *   - theme: UI theme color object
 *   - isDark: boolean, dark mode flag
 */
function NoteEditorWithUndoRedo({ editBuffer, setEditBuffer, theme, isDark }) {
  // History state
  const [history, setHistory] = useState([editBuffer.content || ""]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [userInputFlag, setUserInputFlag] = useState(false);

  const contentRef = useRef(null);

  // Keep editBuffer in sync with history if externally updated (e.g. switching notes)
  useEffect(() => {
    if (editBuffer.content !== history[historyIdx]) {
      setHistory([editBuffer.content || ""]);
      setHistoryIdx(0);
    }
    // eslint-disable-next-line
  }, [editBuffer.content]);

  // On input: update buffer, push to history
  const handleInput = useCallback(
    (e) => {
      const html = e.currentTarget.innerHTML;
      setEditBuffer((b) => ({ ...b, content: html }));

      // Optimization: avoid stacking duplicate history entries
      setHistory((h) => {
        if (h[historyIdx] === html) return h;
        // If not at end: discard forward
        const next = [...h.slice(0, historyIdx + 1), html];
        // Limit stack to last 50 entries
        return next.length > 50 ? next.slice(next.length - 50) : next;
      });
      setHistoryIdx((idx) => {
        return idx + 1 > 49 ? 49 : idx + 1;
      });
      setUserInputFlag(true);
    },
    [setEditBuffer, historyIdx]
  );

  // On undo
  const handleUndo = useCallback(() => {
    if (historyIdx > 0) {
      const newIdx = historyIdx - 1;
      setHistoryIdx(newIdx);
      setEditBuffer((b) => ({ ...b, content: history[newIdx] }));
      setUserInputFlag(false);
    }
  }, [history, historyIdx, setEditBuffer]);

  // On redo
  const handleRedo = useCallback(() => {
    if (historyIdx < history.length - 1) {
      const newIdx = historyIdx + 1;
      setHistoryIdx(newIdx);
      setEditBuffer((b) => ({ ...b, content: history[newIdx] }));
      setUserInputFlag(false);
    }
  }, [history, historyIdx, setEditBuffer]);

  // Keyboard shortcuts: Ctrl+Z, Ctrl+Y
  useEffect(() => {
    const handler = (e) => {
      if (
        e.target === contentRef.current &&
        ((e.ctrlKey || e.metaKey) && e.key === "z")
      ) {
        e.preventDefault();
        handleUndo();
      } else if (
        e.target === contentRef.current &&
        ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.shiftKey && e.key === "z")))
      ) {
        e.preventDefault();
        handleRedo();
      }
    };
    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, [handleUndo, handleRedo]);

  // Make sure contentEditable reflects external history change with caret reset
  useEffect(() => {
    if (contentRef.current && !userInputFlag) {
      // Avoid React hydration overwrite loops by not updating on every render
      contentRef.current.innerHTML = history[historyIdx] || "";
      // Optionally: place caret at end
    }
    setUserInputFlag(false);
    // eslint-disable-next-line
  }, [historyIdx]);

  // Formatting button handler
  const execFormat = (cmd) => (e) => {
    e.preventDefault();
    document.execCommand?.(cmd, false, null);
    // Rerun input to store change in history immediately
    if (contentRef.current)
      handleInput({ currentTarget: contentRef.current });
  };

  return (
    <div
      style={{
        border: `1.7px solid ${theme.accentBrownLight}`,
        borderRadius: 7,
        width: "100%",
        marginBottom: 10,
        background: isDark ? theme.paper : "#fff8",
        boxShadow: "0 3.5px 0 #cbb37f15",
        padding: 0,
      }}
    >
      {/* Formatting toolbar & undo/redo */}
      <div
        style={{
          display: "flex",
          gap: 8,
          borderBottom: `1px solid ${theme.accentBrownLight}33`,
          background: isDark ? theme.paperEdge : "#fff5da",
          borderTopLeftRadius: 7,
          borderTopRightRadius: 7,
          padding: "3px 7px",
          fontSize: 16,
          userSelect: "none",
          alignItems: "center",
        }}
      >
        <button
          type="button"
          aria-label="Undo"
          title="Undo (Ctrl+Z)"
          style={{
            background: "none",
            border: "none",
            padding: "2px 8px",
            color: historyIdx > 0 ? "#d58526" : "#bbb8ab",
            fontWeight: 800,
            fontSize: 18,
            cursor: historyIdx > 0 ? "pointer" : "not-allowed",
            borderRadius: 5,
            outline: "none",
          }}
          onClick={handleUndo}
          disabled={historyIdx <= 0}
        >
          ↺
        </button>
        <button
          type="button"
          aria-label="Redo"
          title="Redo (Ctrl+Y)"
          style={{
            background: "none",
            border: "none",
            padding: "2px 8px",
            color: historyIdx < history.length - 1 ? "#23ab7a" : "#bbb8ab",
            fontWeight: 800,
            fontSize: 18,
            cursor: historyIdx < history.length - 1 ? "pointer" : "not-allowed",
            borderRadius: 5,
            outline: "none",
          }}
          onClick={handleRedo}
          disabled={historyIdx >= history.length - 1}
        >
          ↻
        </button>
        <span style={{ marginRight: 4, marginLeft: 3, color: "#b1a684" }}>|</span>
        <button
          type="button"
          aria-label="Bold"
          style={{
            background: "none",
            border: "none",
            color: theme.accentBrown,
            fontWeight: 800,
            fontSize: 18,
            cursor: "pointer",
            padding: "2px 8px",
            borderRadius: 5,
          }}
          onMouseDown={execFormat("bold")}
        >
          <b>B</b>
        </button>
        <button
          type="button"
          aria-label="Italic"
          style={{
            background: "none",
            border: "none",
            color: theme.accentBrownLight,
            fontWeight: 600,
            fontSize: 17,
            cursor: "pointer",
            padding: "2px 8px",
            borderRadius: 5,
          }}
          onMouseDown={execFormat("italic")}
        >
          <i>I</i>
        </button>
        <button
          type="button"
          aria-label="Bulleted list"
          style={{
            background: "none",
            border: "none",
            color: "#ba944b",
            fontWeight: 700,
            fontSize: 18,
            cursor: "pointer",
            padding: "2px 8px",
            borderRadius: 5,
          }}
          onMouseDown={execFormat("insertUnorderedList")}
        >
          • List
        </button>
      </div>
      {/* Rich contentEditable area */}
      <div
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label="Note content editor"
        ref={contentRef}
        style={{
          fontFamily: "'Noteworthy', 'Inter', 'Roboto', sans-serif",
          fontSize: 16,
          color: theme.text,
          border: "none",
          outline: "none",
          minHeight: 90,
          padding: "0.8em",
          borderRadius: "0 0 7px 7px",
          background: "transparent",
          resize: "vertical",
          width: "100%",
          boxSizing: "border-box",
          whiteSpace: "pre-wrap",
          overflowWrap: "break-word",
          margin: 0,
          maxHeight: 295,
          overflowY: "auto",
        }}
        spellCheck={true}
        tabIndex={0}
        onInput={handleInput}
        onBlur={e => {
          // Ensure <div> does not empty to <br>
          if (e.currentTarget.innerHTML === "<br>") {
            setEditBuffer(b => ({ ...b, content: "" }));
          }
        }}
      />
    </div>
  );
}

export default NoteEditorWithUndoRedo;
