import React, { useState, useMemo, useEffect, useRef } from 'react';
import NoteEditorWithUndoRedo from './NoteEditorWithUndoRedo';

/**
 * Theme options for UI: Light, Dark, Sepia, High Contrast
 */
const THEME_PRESETS = [
  {
    id: 'light',
    name: 'Light',
    emoji: '🌞',
  },
  {
    id: 'dark',
    name: 'Dark',
    emoji: '🌚',
  },
  {
    id: 'sepia',
    name: 'Sepia',
    emoji: '📜',
  },
  {
    id: 'contrast',
    name: 'High Contrast',
    emoji: '🟨',
  }
];

/**
 * Keyboard Shortcuts (global, except inside editor/input):
 *   - Ctrl+N: New note
 *   - Ctrl+F: Focus on Search
 *   - Ctrl+P: Pin/unpin selected note
 *   - Ctrl+Shift+A: Archive/unarchive selected note
 * See bottom legend for details.
 */

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
  const searchInputRef = useRef(null); // for Ctrl+F focus
  const [selectedNote, setSelectedNote] = useState(null);
  const [editBuffer, setEditBuffer] = useState({ title: '', content: '', tags: [] });
  // Theme modes: 'light', 'dark', 'sepia', 'contrast'
  const [uiTheme, setUITheme] = useState('light');
  const [showEditor, setShowEditor] = useState(false);

  // Sorting/filtering control state
  const [sortBy, setSortBy] = useState('date-desc'); // 'date-desc', 'date-asc', 'title-asc', 'title-desc', 'tag-az'
  const [filterTag, setFilterTag] = useState('all');
  const [filterShow, setFilterShow] = useState('all'); // 'all', 'pinned', 'favorite', 'archived'

  // Keyboard shortcuts effect
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
      // Only proceed on ctrl/cmd keys
      if (!(e.ctrlKey || e.metaKey)) return;

      // Do not trigger in the note editor overlay
      if (showEditor) return;

      // Do not trigger if typing into inputs/fields
      if (isTypingInInputTarget(e)) return;

      // (Ctrl+N) New Note
      if ((e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        startNewNote();
        return;
      }

      // (Ctrl+F) Focus search
      if ((e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        if (searchInputRef.current) searchInputRef.current.focus();
        return;
      }

      // (Ctrl+P) Pin/unpin selected note (only if one is selected)
      if ((e.key === 'p' || e.key === 'P')) {
        if (selectedNote && !selectedNote.trashed) {
          e.preventDefault();
          togglePin(selectedNote.id);
        }
        return;
      }

      // (Ctrl+Shift+A) Archive/unarchive selected note (only if selected)
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
  }, [showEditor, selectedNote]); // Only recompute if editor/selected changes

  // Similar theme palette extended for sepia/high-contrast
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

  // All tags for filtering
  const allTags = useMemo(() => {
    const tagSet = new Set();
    notes.forEach(n => (n.tags || []).forEach(t => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [notes]);

  // Filtering/search logic
  const filteredNotes = useMemo(() => {
    // Helper to extract plain text from HTML for search
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

  // Utility for selecting tag color
  function getTagColor(tag) {
    // Pick a color based on string hash
    let hash = 0;
    for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    return theme.tagColors[Math.abs(hash) % theme.tagColors.length];
  }

  // Custom icon controls: utility variables for colors/categories, emoji-UI mapping.
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
      n.id === id ? { ...n, reminder: n.reminder ? null : new Date(Date.now()+3600*1000).toISOString() } : n
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

  // PUBLIC_INTERFACE
  // Change full theme
  function handleThemeChange(e) {
    setUITheme(e.target.value);
  }
  // PUBLIC_INTERFACE
  function toggleTheme() {
    setUITheme((old) =>
      old === 'light' ? 'dark'
      : old === 'dark' ? 'sepia'
      : old === 'sepia' ? 'contrast'
      : 'light'
    );
  }

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

  // Main container structure
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
          {/* UI controls: Search, Theme Switcher, Export/Import, TrashBin */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            {/* Trash Bin button */}
            <button
              title="View Trash Bin"
              aria-label="Open Trash Bin"
              onClick={() => setShowTrashBin(true)}
              style={{
                background: 'none',
                border: `2px solid ${theme.accentBrownLight}`,
                borderRadius: 10,
                fontSize: 17,
                color: '#fe4304',
                fontWeight: 700,
                padding: '4px 10px',
                marginRight: 3,
                cursor: 'pointer',
                transition: 'background 0.13s'
              }}
            >🗑️</button>
            {/* Export JSON */}
            <button
              title="Export notes as JSON"
              aria-label="Export notes (JSON)"
              onClick={() => handleExport('json')}
              style={{
                background: 'none',
                border: `2px solid ${theme.primary}`,
                borderRadius: 10,
                fontSize: 15.5,
                color: theme.primary,
                fontWeight: 'bold',
                padding: '4px 8px',
                cursor: 'pointer'
              }}
            >⭳ JSON</button>
            {/* Export TXT */}
            <button
              title="Export notes as TXT"
              aria-label="Export notes (TXT)"
              onClick={() => handleExport('txt')}
              style={{
                background: 'none',
                border: `2px solid ${theme.accentBrownLight}`,
                borderRadius: 10,
                fontSize: 15.5,
                color: theme.accentBrownLight,
                fontWeight: 'bold',
                padding: '4px 8px',
                marginRight: 2,
                cursor: 'pointer'
              }}
            >⭳ TXT</button>
            {/* Import button */}
            <label style={{
              background: 'none',
              border: `2px solid ${theme.accentBrown}`,
              color: theme.accentBrown,
              fontWeight: 'bold',
              fontSize: 15.2,
              borderRadius: 10,
              padding: '4px 10px',
              cursor: 'pointer',
              marginRight: 7
            }}>
              ⬆️ Import
              <input
                type="file"
                style={{ display: "none" }}
                accept=".json,.txt"
                onChange={handleImportFile}
                aria-label="Import notes"
              />
            </label>
            <input
              type="text"
              value={search}
              ref={searchInputRef}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search notes..."
              style={{
                flex: 1,
                fontSize: 18,
                padding: "0.5em 1em",
                border: `1.5px solid ${theme.searchBorder}`,
                borderRadius: 28,
                background: theme.searchBg,
                color: theme.text,
                boxShadow: `inset 0 1.5px 2px #eed18f16`,
                outline: 'none',
                fontFamily: "'Marker Felt', 'Noteworthy', 'Inter', sans-serif"
              }}
            />
            {/* Theme Switcher */}
            <select
              aria-label="Theme switcher"
              value={uiTheme}
              onChange={handleThemeChange}
              style={{
                padding: '4px 7px 4px 6px',
                fontWeight: 500,
                fontSize: 17,
                background: theme.paper,
                color: theme.primary,
                border: `1.1px solid ${theme.primary}52`,
                borderRadius: 10,
                minWidth: 36,
                cursor: 'pointer',
                transition: 'background 0.18s',
                marginLeft: 6
              }}
            >
              {THEME_PRESETS.map(opt => (
                <option value={opt.id} key={opt.id}>{opt.emoji + " " + opt.name}</option>
              ))}
            </select>
            {/* Legacy button for quick cycling through themes */}
            <button
              aria-label="Quick toggle theme"
              onClick={toggleTheme}
              style={{
                border: 'none',
                background: 'none',
                marginLeft: 1,
                cursor: 'pointer',
                fontSize: 21,
                color: theme.primary,
                padding: 2,
                verticalAlign: 'middle'
              }}>
              {
                uiTheme === 'dark' ? '🌚'
                  : uiTheme === 'sepia' ? '📜'
                    : uiTheme === 'contrast' ? '🟨'
                      : '🌞'
              }
            </button>
          </div>
          {/* Sorting and Filtering controls */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 9, marginBottom: 2, alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 13.6, color: theme.accentBrownLight, minWidth: 37 }}>Sort:</span>
              <select
                value={sortBy}
                aria-label="Sort notes by"
                onChange={e => setSortBy(e.target.value)}
                style={{
                  fontSize: 15.5,
                  borderRadius: 24,
                  border: `1px solid ${theme.accentBrownLight}22`,
                  padding: '1.5px 7px',
                  background: theme.paper,
                  color: theme.text,
                  marginRight: 4
                }}
              >
                <option value="date-desc">Newest</option>
                <option value="date-asc">Oldest</option>
                <option value="title-asc">Title A-Z</option>
                <option value="title-desc">Title Z-A</option>
                <option value="tag-az">Tag A-Z</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 13.6, color: theme.accentBrownLight, minWidth: 36 }}>Tag:</span>
              <select
                value={filterTag}
                aria-label="Filter by tag"
                onChange={e => setFilterTag(e.target.value)}
                style={{
                  fontSize: 14.5,
                  borderRadius: 24,
                  border: `1px solid ${theme.accentBrownLight}22`,
                  padding: '1.5px 7px',
                  background: theme.paper,
                  color: theme.text,
                  marginRight: 4
                }}
              >
                <option value="all">All</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 7, alignItems: 'center', minWidth: 68 }}>
              <span style={{ fontSize: 13.6, color: theme.accentBrownLight, minWidth: 40 }}>Show:</span>
              <select
                value={filterShow}
                aria-label="Show notes type"
                onChange={e => setFilterShow(e.target.value)}
                style={{
                  fontSize: 14.5,
                  borderRadius: 24,
                  border: `1px solid ${theme.accentBrownLight}22`,
                  padding: '1.5px 7px',
                  background: theme.paper,
                  color: theme.text,
                }}
              >
                <option value="all">All</option>
                <option value="pinned">Pinned</option>
                <option value="favorite">Favorite</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
          {/* Keyboard Shortcuts Legend */}
          <div
            style={{
              margin: "10px 0 3px 0",
              background: `${theme.searchBg}`,
              color: `${theme.accentBrown}`,
              border: `1px dashed ${theme.accentBrownLight}`,
              borderRadius: 10,
              padding: "7px 11px 5px 11px",
              fontSize: 13.5,
              fontFamily: "'Inter', 'Noteworthy', sans-serif",
              letterSpacing: 0.01,
              opacity: 0.85,
              boxShadow: "0 2px 11px #e3d6aa08",
              maxWidth: 340,
            }}
          >
            <span style={{ fontWeight: 600, marginRight: 12, color: theme.accentBrownLight, fontSize: 14 }}>
              Shortcuts:
            </span>
            <span title="Add new note (Ctrl+N)"> <b>Ctrl+N</b> New </span>
            <span style={{ marginLeft: 7 }} title="Focus search (Ctrl+F)"><b>Ctrl+F</b> Search </span>
            <span style={{ marginLeft: 7 }} title="Pin/unpin note (Ctrl+P)"><b>Ctrl+P</b> Pin</span>
            <span style={{ marginLeft: 7 }} title="Archive/unarchive note (Ctrl+Shift+A)"><b>Ctrl+Shift+A</b> Archive</span>
          </div>
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
              .map(note => (
                <li key={note.id}
                  tabIndex={0}
                  style={{
                    background: note.color || (selectedNote && selectedNote.id === note.id)
                      ? (note.color || `${theme.accentBrown}18`)
                      : 'none',
                    minHeight: 72,
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'stretch',
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
                    padding: 0
                  }}
                >
                  {/* Left controls: Pin, Favorite, Color */}
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '0 7px 0 4px', gap: 3, minWidth: 30
                  }}>
                    <button title="Pin/unpin" tabIndex={-1} style={{
                      background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: note.pinned ? theme.primary : theme.accentBrownLight
                    }} onClick={e => { e.stopPropagation(); togglePin(note.id); }}>
                      {note.pinned ? '📌' : '📍'}
                    </button>
                    <button title="Favorite" tabIndex={-1} style={{
                      background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: note.favorite ? '#ffb934' : '#ad9f7a'
                    }} onClick={e => { e.stopPropagation(); toggleFavorite(note.id); }}>
                      {note.favorite ? '★' : '☆'}
                    </button>
                    <div style={{ height: 8 }}></div>
                    {/* Color picker dropdown */}
                    <div style={{ position: 'relative' }}>
                      <button
                        title="Color"
                        tabIndex={-1}
                        style={{
                          width: 18, height: 18, borderRadius: '50%', border: `2px solid ${theme.accentBrownLight}`,
                          background: note.color, cursor: 'pointer', outline: 'none', marginTop: 2, marginBottom: 2
                        }}
                        onClick={e => {
                          e.stopPropagation();
                          setNotes(notes =>
                            notes.map(n =>
                              n.id === note.id
                                ? ({ ...n, colorPaletteOpen: !n.colorPaletteOpen })
                                : ({ ...n, colorPaletteOpen: false })
                            )
                          );
                        }}
                      />
                      {note.colorPaletteOpen && (
                        <div style={{
                          position: 'absolute', left: 26, top: -10, background: theme.paper, border: `1.7px solid ${theme.accentBrownLight}88`, borderRadius: 7, zIndex: 20,
                          boxShadow: '0px 2.5px 12px #6d48211a', padding: 4, display: 'flex', gap: 6
                        }}>
                          {colorOptions.map(col => (
                            <button key={col}
                              onClick={e => { e.stopPropagation(); changeColor(note.id, col); setNotes(ns => ns.map(n => n.id === note.id ? { ...n, colorPaletteOpen: false } : n)); }}
                              style={{ background: col, border: '1.3px solid #8888', width: 18, height: 18, borderRadius: '50%', cursor: 'pointer' }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Center – Main note info and tags; click to open edit */}
                  <div onClick={() => editNote(note)} style={{
                    flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', cursor: 'pointer', padding: '8px 4px 6px 6px'
                  }}>
                    <div style={{
                      fontWeight: 800,
                      fontSize: 18,
                      fontFamily: "'Marker Felt', 'Noteworthy', 'Inter', sans-serif",
                      color: theme.accentBrown,
                      letterSpacing: '0.05em',
                      lineHeight: '21px', textShadow: `0px 1px 0px ${theme.accentBrownLight}22`
                    }}>
                      {note.title}
                      {note.checklist && <span title="Checklist" style={{ marginLeft: 6, fontSize: 17, color: '#68aa4a' }}>☑️</span>}
                      {note.reminder && <span title="Reminder Set" style={{ marginLeft: 2, fontSize: 17, color: '#edb419' }}>⏰</span>}
                    </div>
                    <div style={{
                      fontSize: 14,
                      color: `${theme.text}ac`,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginTop: '-2px',
                      letterSpacing: 0.01,
                    }}>
                      {
                        (() => {
                          const tmp = document.createElement('div');
                          tmp.innerHTML = note.content || '';
                          const snip = tmp.textContent || tmp.innerText || '';
                          return snip.slice(0, 78) + (snip.length > 78 ? '…' : '');
                        })()
                      }
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 1 }}>
                      {note.tags && note.tags.map((tag, idx) => (
                        <span key={idx}
                          style={{
                            fontSize: 13,
                            padding: '3px 11px 1.5px 11px',
                            borderRadius: 7,
                            fontWeight: 500,
                            background: `${getTagColor(tag)}cc`,
                            color: uiTheme === 'dark' ? theme.accentBrown : '#3a2617',
                            border: `1px solid ${theme.accentBrownLight}44`,
                            boxShadow: '0px 1px 6px #ae917a19',
                            letterSpacing: 0.01
                          }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  {/* Right controls: Archive/restore, Trash/delete, Checklist, Reminder */}
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '0 6px 0 5px', gap: 3, minWidth: 35
                  }}>
                    <button title={note.archived ? "Restore from Archive" : "Archive"}
                      tabIndex={-1}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer', fontSize: 17, color: '#B07845'
                      }}
                      onClick={e => { e.stopPropagation(); toggleArchive(note.id); }}>
                      {note.archived ? '🗂️' : '🗄️'}
                    </button>
                    <button title="Trash" tabIndex={-1} style={{
                      background: 'none', border: 'none', cursor: 'pointer', fontSize: 17, color: '#fe4304'
                    }} onClick={e => { e.stopPropagation(); trashNote(note.id); }}>
                      🗑️
                    </button>
                    <div style={{ height: 8 }}></div>
                    <button title="Toggle Checklist" tabIndex={-1} style={{
                      background: 'none', border: 'none', cursor: 'pointer', fontSize: 17, color: note.checklist ? '#68aa4a' : '#B07845'
                    }} onClick={e => { e.stopPropagation(); changeChecklist(note.id); }}>
                      {note.checklist ? '☑️' : '☐'}
                    </button>
                    <button title="Toggle Reminder" tabIndex={-1} style={{
                      background: 'none', border: 'none', cursor: 'pointer', fontSize: 17, color: note.reminder ? '#edb419' : '#b8ae6b'
                    }} onClick={e => { e.stopPropagation(); toggleReminder(note.id); }}>
                      ⏰
                    </button>
                  </div>
                </li>
              ))}
          </ul>

          {/* Floating Action Button */}
          <button
            aria-label="Add note"
            onClick={startNewNote}
            style={{
              position: 'absolute',
              right: 22,
              bottom: 24,
              background: theme.fabBg,
              color: theme.fabFg,
              border: 'none',
              borderRadius: '50%',
              width: 58,
              height: 58,
              boxShadow: '0 5px 20px -6px #4443',
              fontSize: 34,
              fontWeight: 900,
              cursor: 'pointer',
              outline: 'none',
              zIndex: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: '.21s box-shadow',
              borderBottom: `4px solid ${theme.primary}aa`
            }}
            tabIndex={0}
          >+</button>
        </div>
      </div>

      {/* Editor overlay */}
      {showEditor && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, width: '100vw', height: '100vh',
          background: '#0007',
          display: 'flex',
          zIndex: 9000,
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            borderRadius: 18,
            padding: '2.3em 1.6em 1.8em 1.6em',
            background: theme.paper,
            minWidth: 320,
            minHeight: 260,
            boxShadow: '0 7px 28px -4px #241f17bb',
            border: `2.2px solid ${theme.primary}15`,
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute', top: 13, right: 18,
              color: theme.text, fontSize: 22,
              cursor: 'pointer', border: 'none', background: 'none'
            }} onClick={() => setShowEditor(false)}>
              ⨉
            </div>
            <div style={{
              fontSize: 22,
              marginBottom: 14,
              color: theme.accentBrown,
              fontWeight: 700,
              fontFamily: "'Marker Felt', 'Noteworthy', 'Inter', sans-serif",
              letterSpacing: '0.05em',
              textShadow: `0 1px 0 ${theme.accentBrownLight}22`
            }}>
              {selectedNote ? 'Edit Note' : 'New Note'}
            </div>
            <input
              type="text"
              placeholder="Title"
              value={editBuffer.title}
              onChange={e => setEditBuffer(b => ({ ...b, title: e.target.value }))}
              style={{
                fontSize: 18,
                fontWeight: 700,
                border: 'none',
                outline: 'none',
                width: '100%',
                background: 'none',
                borderBottom: `2px solid ${theme.accentBrownLight}`,
                marginBottom: 10,
                color: theme.text,
                padding: '0.35em 0'
              }}
            />
            <div style={{display:'flex',gap:10,marginBottom:8}}>
              <span style={{fontSize:13,color:theme.accentBrownLight,marginRight:4,marginTop:5}}>Color:</span>
              <div style={{display:'flex',gap:6,alignItems:'center'}}>
                {colorOptions.map(col=>(
                  <button key={col}
                    style={{
                      background: col,
                      border: editBuffer.color===col?`2.3px solid ${theme.primary}`:'1.5px solid #8887',
                      width: 20, height: 20, borderRadius: '50%', cursor: 'pointer'
                    }}
                    onClick={e=>setEditBuffer(b=>({...b, color: col}))}
                  />
                ))}
              </div>
              <span style={{fontSize:13,color:theme.accentBrownLight,marginLeft:18,marginTop:5}}>Checklist:</span>
              <button style={{
                padding:'1.5px 10px',
                fontSize:16,
                border:`1.7px solid ${theme.accentBrownLight}`,
                borderRadius:7,
                background:editBuffer.checklist?'#e8fbd2':'#fffbe6',
                color: editBuffer.checklist?'#68aa4a':theme.accentBrownLight,
                fontWeight:600,
                cursor:'pointer',
                marginLeft:2
              }}
              onClick={()=>setEditBuffer(b=>({...b, checklist:!b.checklist}))}>
                {editBuffer.checklist?'☑️':'☐'}
              </button>
              <span style={{fontSize:13,color:theme.accentBrownLight,marginLeft:18,marginTop:5}}>Reminder:</span>
              <button style={{
                padding:'2px 10px',
                fontSize:15.5,
                border:`1.7px solid ${theme.accentBrownLight}`,
                borderRadius:7,
                background:editBuffer.reminder?'#f0e2a9':'#fffbe6',
                color: editBuffer.reminder?'#edb419':theme.accentBrownLight,
                fontWeight:600,
                cursor:'pointer',
                marginLeft:2
              }}
              onClick={()=>setEditBuffer(b=>({...b, reminder: b.reminder?null:new Date(Date.now()+3600*1000).toISOString()}))}>
                ⏰
              </button>
            </div>
            {/* Rich Text Editor for Notes */}
            <NoteEditorWithUndoRedo 
              editBuffer={editBuffer}
              setEditBuffer={setEditBuffer}
              theme={theme}
              isDark={uiTheme === 'dark' || uiTheme === 'contrast'}
            />
            {/* Tag adder */}
            <div style={{ marginBottom: 8 }}>
              <div style={{
                fontSize: 15,
                color: theme.accentBrown,
                fontWeight: 700,
                marginBottom: 2,
                letterSpacing: 0.13,
                textShadow: `0 1px 0 ${theme.accentBrownLight}22`
              }}>Tags:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {editBuffer.tags.map((tag, idx) => (
                  <div
                    key={tag + idx}
                    style={{
                      background: getTagColor(tag),
                      color: uiTheme === 'dark' ? '#251e1a' : '#261c13',
                      padding: '2px 9px 2px 7px',
                      borderRadius: 7,
                      marginRight: 2,
                      fontSize: 13.3,
                      display: 'flex',
                      alignItems: 'center',
                      fontWeight: 500,
                      border: `1px solid ${theme.accentBrownLight}44`,
                      boxShadow: '0px 1.5px 7px #ae917a19'
                    }}>
                    {tag}
                    <span style={{
                      marginLeft: 3,
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: 15
                    }}
                      title="Remove tag"
                      onClick={() => removeTag(idx)}
                    >&times;</span>
                  </div>
                ))}
                <input
                  type="text"
                  maxLength={15}
                  style={{
                    fontSize: 12.5,
                    border: `1.3px solid ${theme.accentBrownLight}`,
                    borderRadius: 7,
                    padding: '2.3px 7px',
                    minWidth: 45,
                    outline: 'none',
                    boxShadow: '0 2px 0 #b9956935'
                  }}
                  placeholder="+add"
                  onKeyDown={handleTagInput}
                  aria-label="Add tag"
                />
              </div>
            </div>
            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, marginTop: 10, justifyContent: 'flex-end' }}>
              {selectedNote && (
                <button
                  onClick={deleteNote}
                  style={{
                    background: '#fe4304cc',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 7,
                    fontWeight: 600,
                    fontSize: 15,
                    padding: '8px 18px',
                    cursor: 'pointer'
                  }}
                >Delete</button>
              )}
              <button
                onClick={saveNote}
                style={{
                  background: theme.primary,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 7,
                  fontWeight: 600,
                  fontSize: 15,
                  padding: '8px 19px',
                  cursor: 'pointer'
                }}
              >Save</button>
            </div>
          </div>
        </div>
      )}
      {/* Attribution for old iPhone notepad look */}
      <div style={{
        textAlign: 'center',
        fontFamily: 'monospace',
        color: `${theme.text}77`,
        fontSize: 11,
        marginTop: 28,
        letterSpacing: 0.05
      }}>NoteEase &mdash; Inspired by the old iPhone Notes app</div>
    </div>
  );
}

export default NoteEaseMainContainer;
