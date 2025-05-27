import React, { useRef, useEffect, useCallback, useState } from "react";

/**
 * PUBLIC_INTERFACE
 * NoteEditorWithUndoRedo: A content-editable rich text editor with undo/redo history and basic formatting.
 * Props:
 *   - editBuffer: {content: ...}
 *   - setEditBuffer: function to update content
 *   - theme: UI theme color object
 *   - isDark: boolean, dark mode flag
 *
 * This component provides a toolbar with Undo and Redo controls. Undo and Redo
 * are available both by button (↺, ↻) and via keyboard shortcut Ctrl+Z / Ctrl+Y.
 * Undo/Redo work only within the current editor session for a note.
 * History is reset upon switching/editing another note.
 */
function NoteEditorWithUndoRedo({ editBuffer, setEditBuffer, theme, isDark }) {
  // History stack for the note editor session (only content string)
  const [history, setHistory] = useState([editBuffer.content || ""]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [userInputFlag, setUserInputFlag] = useState(false);

  const contentRef = useRef(null);

  // If the editBuffer.content changes (note is switched), reset history stack
  useEffect(() => {
    if (editBuffer.content !== history[historyIdx]) {
      setHistory([editBuffer.content || ""]);
      setHistoryIdx(0);
    }
    // eslint-disable-next-line
  }, [editBuffer.content]);

  // On editor input: update content and push to history
  const handleInput = useCallback(
    (e) => {
      const html = e.currentTarget.innerHTML;
      setEditBuffer((b) => ({ ...b, content: html }));

      setHistory((h) => {
        // Avoid stacking duplicate entries
        if (h[historyIdx] === html) return h;
        // Branch cut: discard redo stack if editing after undo
        const next = [...h.slice(0, historyIdx + 1), html];
        // Limit stack to last 50 entries for memory efficiency
        return next.length > 50 ? next.slice(next.length - 50) : next;
      });
      setHistoryIdx((idx) => {
        // Make sure index matches new stack
        return idx + 1 > 49 ? 49 : idx + 1;
      });
      setUserInputFlag(true);
    },
    [setEditBuffer, historyIdx]
  );

  // Undo handler
  // PUBLIC_INTERFACE
  const handleUndo = useCallback(() => {
    if (historyIdx > 0) {
      const newIdx = historyIdx - 1;
      setHistoryIdx(newIdx);
      setEditBuffer((b) => ({ ...b, content: history[newIdx] }));
      setUserInputFlag(false);
    }
  }, [history, historyIdx, setEditBuffer]);

  // Redo handler
  // PUBLIC_INTERFACE
  const handleRedo = useCallback(() => {
    if (historyIdx < history.length - 1) {
      const newIdx = historyIdx + 1;
      setHistoryIdx(newIdx);
      setEditBuffer((b) => ({ ...b, content: history[newIdx] }));
      setUserInputFlag(false);
    }
  }, [history, historyIdx, setEditBuffer]);

  // Keyboard shortcuts for undo/redo within the editor
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

  // When undo/redo (not editor input): sync contentEditable view to stack
  // Only trigger when not coming from direct input (avoid infinite loop)
  useEffect(() => {
    if (contentRef.current && !userInputFlag) {
      contentRef.current.innerHTML = history[historyIdx] || "";
      // Optionally: move caret to end after undo/redo for UX
    }
    setUserInputFlag(false);
    // eslint-disable-next-line
  }, [historyIdx]);

  // Text formatting (bold/italic/ulist)
  const execFormat = (cmd) => (e) => {
    e.preventDefault();
    document.execCommand?.(cmd, false, null);
    // Rerun input to store change in history immediately
    if (contentRef.current)
      handleInput({ currentTarget: contentRef.current });
  };

  // Toolbar and editable area
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
      {/* Toolbar: Undo/Redo (as requested), and formatting buttons */}
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
      {/* Rich contentEditable area for note editing */}
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
          // Protect against save of <br> when empty
          if (e.currentTarget.innerHTML === "<br>") {
            setEditBuffer(b => ({ ...b, content: "" }));
          }
        }}
      />
    </div>
  );
}

export default NoteEditorWithUndoRedo;
