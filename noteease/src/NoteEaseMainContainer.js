import React, { useState, useMemo, useEffect, useRef } from 'react';
import NoteEditorWithUndoRedo from './NoteEditorWithUndoRedo';

// Hook for swipe detection on note cards (left/right)
function useSwipe(ref, { onSwipeLeft, onSwipeRight, minSwipe = 50 }) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let startX = null;
    let startY = null;
    let isTouch = false;
    let moved = false;

    function onTouchStart(e) {
      isTouch = true;
      if (e.touches && e.touches.length === 1) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        moved = false;
      }
    }
    function onTouchMove(e) {
      if (!isTouch || startX === null || startY === null) return;
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 7) {
        moved = true;
        e.preventDefault();
      }
    }
    function onTouchEnd(e) {
      if (!isTouch || startX === null || startY === null) return;
      const endX = (e.changedTouches && e.changedTouches[0].clientX) || 0;
      const dx = endX - startX;
      if (Math.abs(dx) > minSwipe) {
        if (dx < 0 && onSwipeLeft) onSwipeLeft();
        else if (dx > 0 && onSwipeRight) onSwipeRight();
      }
      isTouch = false; startX = null; startY = null; moved = false;
    }

    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [ref, onSwipeLeft, onSwipeRight, minSwipe]);
}

/**
 * Theme options for UI: Light, Dark, Sepia, High Contrast
 */
const THEME_PRESETS = [
  { id: 'light', name: 'Light', emoji: '🌞' },
  { id: 'dark', name: 'Dark', emoji: '🌚' },
  { id: 'sepia', name: 'Sepia', emoji: '📜' },
  { id: 'contrast', name: 'High Contrast', emoji: '🟨' }
];

// PUBLIC_INTERFACE
function NoteEaseMainContainer() {
  const [notes, setNotes] = useState([
    {
      id: 1,
      title: "Shopping List",
      content: "Milk\nEggs\nBread\nCheese",
      tags: ["Personal", "Groceries"],
      pinned: true,
      favorite: true,
      archived: false,
      trashed: false,
      color: "#FFD966",
      checklist: false,
      reminder: null
    },
    {
      id: 2,
      title: "Project Ideas",
      content: "1. Build a note app\n2. Learn Italian\n3. Start gym routine",
      tags: ["Work", "Ideas"],
      pinned: false,
      favorite: false,
      archived: false,
      trashed: false,
      color: "#84e7ba",
      checklist: true,
      reminder: null
    },
    {
      id: 3,
      title: "Meeting Notes",
      content: "Discussed Q2 targets. Next steps: review budget.",
      tags: ["Work", "Meetings"],
      pinned: false,
      favorite: false,
      archived: true,
      trashed: false,
      color: "#FFD6E0",
      checklist: false,
      reminder: null
    }
  ]);
  const [search, setSearch] = useState('');
  const searchInputRef = useRef(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [editBuffer, setEditBuffer] = useState({ title: '', content: '', tags: [] });
  const [uiTheme, setUITheme] = useState('light');
  const [showEditor, setShowEditor] = useState(false);

  // Sorting/filtering control state
  const [sortBy, setSortBy] = useState('date-desc');
  const [filterTag, setFilterTag] = useState('all');
  const [filterShow, setFilterShow] = useState('all');
  const [showTrashBin, setShowTrashBin] = useState(false);

  useEffect(() => {
    function isTypingInInputTarget(e) {
      const tag = (e.target.tagName || '').toLowerCase();
      return (
        tag === 'input' ||
        tag === 'textarea' ||
        e.target.isContentEditable
      );
    }
    function handleShortcut(e) {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (showEditor) return;
      if (isTypingInInputTarget(e)) return;
      if ((e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        startNewNote();
        return;
      }
      if ((e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        if (searchInputRef.current) searchInputRef.current.focus();
        return;
      }
      if ((e.key === 'p' || e.key === 'P')) {
        if (selectedNote && !selectedNote.trashed) {
          e.preventDefault();
          togglePin(selectedNote.id);
        }
        return;
      }
      if ((e.key === 'A' || e.key === 'a') && e.shiftKey) {
        if (selectedNote && !selectedNote.trashed) {
          e.preventDefault();
          toggleArchive(selectedNote.id);
        }
        return;
      }
    }
    document.addEventListener('keydown', handleShortcut, true);
    return () => document.removeEventListener('keydown', handleShortcut, true);
    // eslint-disable-next-line
  }, [showEditor, selectedNote]);

  const THEME = useMemo(() => ({
    light: {
      background: '#FDF6E3',
      paperEdge: '#f1e8c9',
      line: '#e1dbb6',
      paper: '#FFFBDF',
      border: '#DED09E',
      primary: '#4A90E2',
      accentBrown: '#8B5C2A',
      accentBrownLight: '#B07845',
      text: '#42290d',
      tagColors: ['#F5A623', '#4A90E2', '#BAE15A', '#F86C6B', '#8447FF', '#D3A7F6', '#FFD766'],
      fabBg: '#F5A623',
      fabFg: '#fff',
      searchBg: '#FFFBDF',
      searchBorder: '#DED09E'
    },
    dark: {
      background: '#22201a',
      paperEdge: '#1c180f',
      line: '#38341f',
      paper: '#262318',
      border: '#413a22',
      primary: '#4A90E2',
      accentBrown: '#c19e63',
      accentBrownLight: '#a78551',
      text: '#FFEDBD',
      tagColors: ['#F5A623', '#4A90E2', '#7DEB80', '#FF766C', '#957AFF', '#E6C7F7', '#FFE073'],
      fabBg: '#F5A623',
      fabFg: '#251e1a',
      searchBg: '#262318',
      searchBorder: '#413a22'
    },
    sepia: {
      background: '#f4ecd8',
      paperEdge: '#e4d6b3',
      line: '#ede1c0',
      paper: '#f7f5ef',
      border: '#dfc991',
      primary: '#ab8652',
      accentBrown: '#7F5A36',
      accentBrownLight: '#cbae88',
      text: '#473816',
      tagColors: ['#bf7b26', '#c7a760', '#b0906d', '#bd5633', '#c7b28b', '#ea8c41', '#efd8bd'],
      fabBg: '#b5884a',
      fabFg: '#fff',
      searchBg: '#f6eed6',
      searchBorder: '#dfc991'
    },
    contrast: {
      background: '#fff700',
      paperEdge: '#fff730',
      line: '#000000',
      paper: '#fff',
      border: '#000',
      primary: '#000',
      accentBrown: '#000',
      accentBrownLight: '#111',
      text: '#000',
      tagColors: ['#F90', '#00F', '#0B0', '#D00', '#444', '#AAA', '#F70'],
      fabBg: '#000',
      fabFg: '#FFF700',
      searchBg: '#FFF700',
      searchBorder: '#000'
    }
  }), []);
  const theme = THEME[uiTheme] || THEME.light;

  const allTags = useMemo(() => {
    const tagSet = new Set();
    notes.forEach(n => (n.tags || []).forEach(t => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [notes]);

  const filteredNotes = useMemo(() => {
    function plain(str) {
      const tmp = document.createElement('div');
      tmp.innerHTML = str || '';
      return tmp.textContent || tmp.innerText || '';
    }
    let res = notes.filter(
      n =>
        (n.title && n.title.toLowerCase().includes(search.toLowerCase()))
        || (n.content && plain(n.content).toLowerCase().includes(search.toLowerCase()))
        || (n.tags && n.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase())))
    );
    if (filterShow === 'pinned')
      res = res.filter(n => n.pinned && !n.archived && !n.trashed);
    else if (filterShow === 'favorite')
      res = res.filter(n => n.favorite && !n.archived && !n.trashed);
    else if (filterShow === 'archived')
      res = res.filter(n => n.archived && !n.trashed);
    else
      res = res.filter(n => !n.trashed);

    if (filterTag !== 'all')
      res = res.filter(n => Array.isArray(n.tags) && n.tags.includes(filterTag));

    // Sorting
    res = [...res];
    switch (sortBy) {
      case 'date-asc':
        res.sort((a, b) => (a.id || 0) - (b.id || 0));
        break;
      case 'date-desc':
        res.sort((b, a) => (a.id || 0) - (b.id || 0));
        break;
      case 'title-asc':
        res.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      case 'title-desc':
        res.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
        break;
      case 'tag-az':
        res.sort((a, b) => ((a.tags?.[0] || '').localeCompare(b.tags?.[0] || '')));
        break;
      default:
        break;
    }
    return res;
  }, [notes, search, sortBy, filterTag, filterShow]);

  function getTagColor(tag) {
    let hash = 0;
    for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    return theme.tagColors[Math.abs(hash) % theme.tagColors.length];
  }

  const colorOptions = [
    "#FFD966", "#FFF2CC", "#A5D8FF", "#FFD6E0", "#84e7ba", "#BAE15A"
  ];
  const categoryOptions = [
    "Personal", "Groceries", "Work", "Ideas", "Meetings", "Archive"
  ];

  function togglePin(id) {
    setNotes(notes => notes.map(n =>
      n.id === id ? { ...n, pinned: !n.pinned } : n
    ));
  }
  function toggleFavorite(id) {
    setNotes(notes => notes.map(n =>
      n.id === id ? { ...n, favorite: !n.favorite } : n
    ));
  }
  function toggleArchive(id) {
    setNotes(notes => notes.map(n =>
      n.id === id ? { ...n, archived: !n.archived, pinned: false } : n
    ));
  }
  function trashNote(id) {
    setNotes(notes => notes.map(n =>
      n.id === id ? { ...n, trashed: true, archived: false, pinned: false } : n
    ));
  }
  function restoreNote(id) {
    setNotes(notes => notes.map(n =>
      n.id === id ? { ...n, trashed: false, archived: false } : n
    ));
  }
  function changeColor(id, color) {
    setNotes(notes => notes.map(n =>
      n.id === id ? { ...n, color } : n
    ));
  }
  function changeChecklist(id) {
    setNotes(notes => notes.map(n =>
      n.id === id ? { ...n, checklist: !n.checklist } : n
    ));
  }
  function toggleReminder(id) {
    setNotes(notes => notes.map(n =>
      n.id === id ? { ...n, reminder: n.reminder ? null : new Date(Date.now() + 3600 * 1000).toISOString() } : n
    ));
  }

  function startNewNote() {
    setEditBuffer({ title: '', content: '', tags: [], pinned: false, favorite: false, archived: false, trashed: false, color: colorOptions[0], checklist: false, reminder: null });
    setSelectedNote(null);
    setShowEditor(true);
  }
  function editNote(note) {
    setEditBuffer({ ...note, tags: [...note.tags] });
    setSelectedNote(note);
    setShowEditor(true);
  }
  function saveNote() {
    const stripIfEmpty = (html) => {
      const t = document.createElement('div');
      t.innerHTML = html || '';
      return (t.textContent || t.innerText || '').trim() ? html : '';
    };
    const contentHTML = stripIfEmpty(editBuffer.content);

    if (!editBuffer.title.trim() && !contentHTML) return setShowEditor(false);

    if (selectedNote) {
      setNotes(notes =>
        notes.map(n =>
          n.id === selectedNote.id
            ? { ...n, ...editBuffer, content: contentHTML }
            : n
        )
      );
    } else {
      setNotes(notes =>
        [{ ...editBuffer, content: contentHTML, id: Date.now() }, ...notes]
      );
    }
    setShowEditor(false);
  }
  function deleteNote() {
    if (selectedNote)
      setNotes(notes => notes.filter(n => n.id !== selectedNote.id));
    setShowEditor(false);
  }
  function handleTagInput(e) {
    const val = e.target.value.trim();
    if (e.key === 'Enter' && val && !editBuffer.tags.includes(val)) {
      setEditBuffer(buf => ({ ...buf, tags: [...buf.tags, val] }));
      e.target.value = '';
    }
  }
  function removeTag(idx) {
    setEditBuffer(buf => ({
      ...buf,
      tags: [...buf.tags.slice(0, idx), ...buf.tags.slice(idx + 1)]
    }));
  }

  function handleThemeChange(e) {
    setUITheme(e.target.value);
  }
  function toggleTheme() {
    setUITheme((old) =>
      old === 'light' ? 'dark'
        : old === 'dark' ? 'sepia'
          : old === 'sepia' ? 'contrast'
            : 'light'
    );
  }

  // --- Export/Import/TRASH BIN Modal handlers ---
  function handleExport(format) {
    const exportNotesArr = notes.filter(n => !n.trashed);
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(exportNotesArr, null, 2)], { type: "application/json" });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `noteease-notes-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (format === 'txt') {
      const txt = exportNotesArr.map(n =>
        `Title: ${n.title}\nTags: ${(n.tags || []).join(', ')}\nContent:\n${stripHtml(n.content)}\n---\n`
      ).join('\n');
      const blob = new Blob([txt], { type: "text/plain" });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `noteease-notes-${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }
  function stripHtml(html) {
    var tmp = document.createElement("DIV");
    tmp.innerHTML = html || "";
    return tmp.textContent || tmp.innerText || "";
  }
  function handleImportFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    const reader = new FileReader();
    reader.onload = function (ev) {
      const text = ev.target.result;
      if (ext === 'json') {
        try {
          const arr = JSON.parse(text);
          if (Array.isArray(arr) && arr.every(noteLike)) {
            const ids = new Set(notes.map(n => n.id));
            let nextNotes = [
              ...arr.map(n => ({
                ...n,
                id: !ids.has(n.id) && n.id ? n.id : Date.now() + Math.floor(Math.random() * 10000)
              })),
              ...notes
            ];
            setNotes(nextNotes);
            alert("Notes imported from JSON.");
          } else {
            alert("Not a valid NoteEase JSON.");
          }
        } catch {
          alert("Invalid JSON format.");
        }
      } else if (ext === 'txt') {
        const noteChunks = text.split("\n---\n");
        let parsed = noteChunks.map(chunk => {
          const m1 = chunk.match(/^Title: (.*)$/m);
          const m2 = chunk.match(/^Tags: (.*)$/m);
          const m3 = chunk.match(/Content:\n([\s\S]*)/m);
          return {
            id: Date.now() + Math.floor(Math.random() * 10000),
            title: m1 ? m1[1] : "Imported Note",
            content: (m3 ? m3[1] : chunk).trim(),
            tags: m2 ? m2[1].split(',').map(t => t.trim()).filter(Boolean) : [],
            pinned: false,
            favorite: false,
            archived: false,
            trashed: false,
            color: colorOptions[0],
            checklist: false,
            reminder: null
          };
        });
        setNotes([...parsed, ...notes]);
        alert("TXT notes imported.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }
  function noteLike(obj) {
    return typeof obj === 'object'
      && typeof obj.title === 'string'
      && 'content' in obj;
  }
  function handleRestoreTrash(noteId) {
    setNotes(notes => notes.map(n =>
      n.id === noteId ? { ...n, trashed: false, archived: false } : n
    ));
  }
  function handleDeleteTrash(noteId) {
    setNotes(notes => notes.filter(n => n.id !== noteId));
  }
  function handleEmptyTrash() {
    if (window.confirm("Permanently delete all trashed notes?")) {
      setNotes(notes => notes.filter(n => !n.trashed));
      setShowTrashBin(false);
    }
  }
  const trashedNotes = notes.filter(n => n.trashed);

  const TrashBinModal = showTrashBin ? (
    <div style={{
      position: 'fixed',
      left: 0, top: 0, width: '100vw', height: '100vh',
      background: '#0007',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        minWidth: 320,
        maxWidth: 430,
        background: theme.paper,
        color: theme.text,
        borderRadius: 14,
        boxShadow: '0px 8px 26px #201702bb',
        border: `2.25px solid ${theme.primary}15`,
        padding: '2.2em 0.9em 1.5em 1.1em',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          top: 12,
          right: 19,
          fontSize: 21,
          color: `${theme.primary}`,
          cursor: 'pointer'
        }}
          onClick={() => setShowTrashBin(false)}
          title="Close Trash Bin"
        >⨉</div>
        <div style={{
          fontSize: 21,
          fontWeight: 800,
          marginBottom: 12,
          color: theme.accentBrown
        }}>Trash Bin</div>
        {trashedNotes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 18, opacity: 0.64 }}>Trash is empty.</div>
        ) : (
          <ul style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            maxHeight: 300,
            overflowY: 'auto'
          }}>
            {trashedNotes.map(note => (
              <li key={note.id} style={{
                background: note.color || theme.paperEdge,
                borderRadius: 7,
                padding: '10px 7px 7px 12px',
                marginBottom: 10,
                borderLeft: `5.5px solid ${theme.accentBrownLight}`,
                borderBottom: `1.8px solid ${theme.accentBrownLight}`,
                boxShadow: '0 2px 10px #cdb28b10',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'relative'
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 800,
                    fontSize: 16,
                    color: theme.accentBrown
                  }}>
                    {note.title || <i style={{ color: '#b8aa8b' }}>Untitled</i>}
                  </div>
                  <div style={{
                    fontSize: 13.5,
                    color: `${theme.text}88`,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>{stripHtml(note.content).slice(0, 60)}{stripHtml(note.content).length > 60 ? '…' : ''}</div>
                  <div style={{
                    fontSize: 12.5,
                    color: '#bdac85',
                    letterSpacing: 0.02
                  }}>
                    {(note.tags || []).join(', ')}
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 7,
                  alignItems: 'flex-end',
                  marginLeft: 8,
                  minWidth: 34
                }}>
                  <button
                    aria-label="Restore note"
                    title="Restore"
                    style={{
                      background: '#79e64115',
                      border: `1.6px solid #79e641`,
                      borderRadius: 6,
                      fontSize: 14.5,
                      color: '#368a33',
                      fontWeight: 600,
                      cursor: 'pointer',
                      marginBottom: 1,
                    }}
                    onClick={() => handleRestoreTrash(note.id)}
                  >Restore</button>
                  <button
                    aria-label="Delete note permanently"
                    title="Delete permanently"
                    style={{
                      background: '#e97b7b25',
                      border: `1.6px solid #db4343`,
                      borderRadius: 6,
                      fontSize: 14.5,
                      color: '#b20c0c',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      if (window.confirm('Delete this note permanently?')) handleDeleteTrash(note.id);
                    }}
                  >Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {trashedNotes.length > 0 &&
          <div style={{ textAlign: 'right', marginTop: 12 }}>
            <button
              aria-label="Delete all trashed notes"
              title="Empty Trash (permanent!)"
              style={{
                background: '#d43a366a',
                color: '#fff',
                fontWeight: 700,
                padding: '9px 18px',
                borderRadius: 8,
                fontSize: 15,
                border: 'none',
                cursor: 'pointer'
              }}
              onClick={handleEmptyTrash}
            >Empty Trash</button>
          </div>
        }
      </div>
    </div>
  ) : null;

  const linedPaperBg = `repeating-linear-gradient(
    to bottom, 
    ${theme.paper} 0px, 
    ${theme.paper} 32px, 
    ${theme.line} 33px,
    ${theme.paper} 34px
  )`;
  const tornEdge = `linear-gradient(
    to right, 
    transparent 0%, ${theme.paperEdge} 8%, 
    ${theme.paper} 16%, ${theme.paper} 84%, 
    ${theme.paperEdge} 92%, transparent 100%
  )`;

  // --- MAIN RENDER ---
  return (
    <div
      style={{
        minHeight: '100vh',
        background: theme.background,
        color: theme.text,
        fontFamily: "'Marker Felt', 'Noteworthy', 'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
        transition: 'background 0.3s',
      }}
    >
      {/* Render Trash Bin Modal if open */}
      {TrashBinModal}
      {/* Top: Torn paper edge bar and search */}
      <div
        style={{
          paddingTop: 0,
          width: '100%',
          background: tornEdge,
          height: 32,
          position: 'relative',
        }}
      />
      <div style={{
        maxWidth: 430,
        margin: '0 auto',
        boxShadow: `0 4px 24px -8px ${theme.border}`,
        borderRadius: '0 0 16px 16px',
        overflow: 'hidden',
        background: theme.paper,
        position: 'relative'
      }}>
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 8,
          backdropFilter: 'blur(4px)',
          background: theme.paper,
          borderBottom: `1.5px dashed ${theme.line}`,
          padding: '0.6rem 1.2rem 0.1rem'
        }}>
          {/* ... EXISTING CONTROLS OMITTED FOR BREVITY ... */}
        </div>
        <div
          style={{
            background: linedPaperBg,
            minHeight: 480,
            padding: '0.7em 0.7em 64px 0.7em',
            borderBottomLeftRadius: 16,
            borderBottomRightRadius: 16,
            border: `1.5px solid ${theme.border}`,
            position: 'relative'
          }}
        >
          {/* List of notes */}
          <ul style={{
            listStyle: 'none',
            margin: '0.3em 0 0 0',
            padding: 0
          }}>
            {filteredNotes.length === 0 && (
              <li style={{ padding: '1.5em 0', textAlign: 'center', color: `${theme.text}88` }}>
                No notes found.
              </li>
            )}
            {filteredNotes
              .map(note => {
                // For each note, create a ref for swipe
                const cardRef = React.createRef();
                useSwipe(cardRef, {
                  onSwipeLeft: note.archived
                    ? null
                    : () => {
                      if (window.innerWidth < 700) toggleArchive(note.id);
                    },
                  onSwipeRight: !note.trashed
                    ? () => {
                        if (window.innerWidth < 700) trashNote(note.id);
                      }
                    : null,
                  minSwipe: 46
                });
                let swipeHint = null;
                if (window.innerWidth < 700) {
                  swipeHint = (
                    <div style={{
                      position: "absolute", left: 0, top: 0,
                      width: "100%", height: "100%", pointerEvents: "none",
                      zIndex: 2, display: "flex", justifyContent: "space-between", alignItems: "center"
                    }}>
                      <span style={{
                        fontSize: 16, color: "#b5682eAA", marginLeft: 8, fontWeight: 700,
                        background: "#fff7e957", borderRadius: 8, padding: "2px 10px", minWidth: 28
                      }}>
                        {note.archived || note.trashed ? "" : "⟵ Trash"}
                      </span>
                      <span style={{
                        fontSize: 16, color: "#a78a41AA", marginRight: 8, fontWeight: 700,
                        background: "#fff7e957", borderRadius: 8, padding: "2px 10px", minWidth: 36, textAlign: "right"
                      }}>
                        {!note.archived ? "Archive ⟶" : ""}
                      </span>
                    </div>
                  );
                }
                const mobile = window.innerWidth < 700;
                return (
                  <li key={note.id}
                    tabIndex={0}
                    ref={cardRef}
                    style={{
                      background: note.color || (selectedNote && selectedNote.id === note.id)
                        ? (note.color || `${theme.accentBrown}18`)
                        : 'none',
                      minHeight: 72,
                      marginBottom: mobile ? '16px' : '10px',
                      display: 'flex',
                      flexDirection: mobile ? 'column' : 'row',
                      alignItems: mobile ? 'stretch' : 'stretch',
                      justifyContent: 'space-between',
                      borderRadius: 9,
                      borderLeft: `6px solid ${theme.accentBrown}`,
                      borderBottom: `2px solid ${theme.accentBrownLight}`,
                      boxShadow: note.pinned
                        ? '0px 5px 15px #e6c99e38'
                        : '0px 2.5px 0px 0px #61421c13',
                      position: 'relative',
                      outline: selectedNote && selectedNote.id === note.id ? `2px solid ${theme.primary}` : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.11s',
                      padding: 0,
                      overflow: "hidden",
                      userSelect: mobile ? "none" : "auto",
                      touchAction: "pan-y"
                    }}
                  >
                  {swipeHint}
                  {/* ... note card left controls, content, right controls ... */}
                  </li>
                );
              })}
          </ul>
          {/* ... Floating Action Button and rest unchanged ... */}
        </div>
      </div>
      {/* ...Editor overlay and footer unchanged... */}
    </div>
  );
}

export default NoteEaseMainContainer;
