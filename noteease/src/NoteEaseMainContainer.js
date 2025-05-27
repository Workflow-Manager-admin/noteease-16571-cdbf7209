import React, { useState, useMemo } from 'react';

// PUBLIC_INTERFACE
function NoteEaseMainContainer() {
  // Demo state for notes and tags
  const [notes, setNotes] = useState([
    {
      id: 1,
      title: "Shopping List",
      content: "Milk\nEggs\nBread\nCheese",
      tags: ["Personal", "Groceries"]
    },
    {
      id: 2,
      title: "Project Ideas",
      content: "1. Build a note app\n2. Learn Italian\n3. Start gym routine",
      tags: ["Work", "Ideas"]
    },
    {
      id: 3,
      title: "Meeting Notes",
      content: "Discussed Q2 targets. Next steps: review budget.",
      tags: ["Work", "Meetings"]
    }
  ]);
  const [search, setSearch] = useState('');
  const [selectedNote, setSelectedNote] = useState(null);
  const [editBuffer, setEditBuffer] = useState({ title: '', content: '', tags: [] });
  const [isDark, setIsDark] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  // Add brown color accent for notebook feel
  const THEME = useMemo(() => ({
    light: {
      background: '#FDF6E3',
      paperEdge: '#f1e8c9',
      line: '#e1dbb6',
      paper: '#FFFBDF',
      border: '#DED09E',
      primary: '#4A90E2',
      // Brown accent: notebook style
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
    }
  }), []);
  const theme = isDark ? THEME.dark : THEME.light;

  // Utility for selecting tag color
  function getTagColor(tag) {
    // Pick a color based on string hash
    let hash = 0;
    for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    return theme.tagColors[Math.abs(hash) % theme.tagColors.length];
  }

  // Filtered notes with search applied
  const filteredNotes = useMemo(() =>
    notes.filter(
      n =>
        n.title.toLowerCase().includes(search.toLowerCase())
        || n.content.toLowerCase().includes(search.toLowerCase())
        || (n.tags && n.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase())))
    ),
    [notes, search]
  );

  // Handlers for FAB, editing, etc.
  function startNewNote() {
    setEditBuffer({ title: '', content: '', tags: [] });
    setSelectedNote(null);
    setShowEditor(true);
  }
  function editNote(note) {
    setEditBuffer({ ...note, tags: [...note.tags] });
    setSelectedNote(note);
    setShowEditor(true);
  }
  function saveNote() {
    if (!editBuffer.title.trim() && !editBuffer.content.trim()) return setShowEditor(false);
    if (selectedNote) {
      setNotes(notes =>
        notes.map(n => n.id === selectedNote.id ? { ...n, ...editBuffer } : n)
      );
    } else {
      // Assign unique id
      setNotes(notes =>
        [{ ...editBuffer, id: Date.now() }, ...notes]
      );
    }
    setShowEditor(false);
  }
  function deleteNote() {
    if (selectedNote)
      setNotes(notes => notes.filter(n => n.id !== selectedNote.id));
    setShowEditor(false);
  }

  // Tag management for simple tag entry (demo)
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

  // Toggle theme (PUBLIC_INTERFACE)
  function toggleTheme() {
    setIsDark(d => !d);
  }

  // Inline CSS for "notepad" skeuomorphic look
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="text"
              value={search}
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
                boxShadow: `inset 0 1.5px 2px ${isDark ? '#14110a33' : '#eed18f16'}`,
                outline: 'none',
                fontFamily: "'Marker Felt', 'Noteworthy', 'Inter', sans-serif"
              }}
            />
            <button
              aria-label="Toggle theme"
              onClick={toggleTheme}
              style={{
                border: 'none',
                background: 'none',
                marginLeft: 6,
                cursor: 'pointer',
                fontSize: 24,
                color: theme.primary,
                padding: 2
              }}>
              {isDark ? '🌚' : '🌞'}
            </button>
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
            {/* 
                Notepad lines are 34px cycles, so set each card height to match a multiple of 34px.
                Space between cards: 32px height, with margin to match the 2px brown notepad line.
            */}
            {filteredNotes.map(note => (
              <li key={note.id}
                onClick={() => editNote(note)}
                tabIndex={0}
                style={{
                  background: 'none',
                  // Height = 68px (2 lines) to ensure alignment with lines (34px per line on background)
                  minHeight: 68,
                  maxHeight: 102,
                  lineHeight: '34px',
                  margin: '0 0 0.5px 0', // 0.5px to exactly match the 1px line separation
                  marginBottom: '6px',
                  padding: '0 0.7em 0 1.1em',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  borderRadius: 9,
                  // Left border brown accent (notebook spiral feel)
                  borderLeft: `6px solid ${theme.accentBrown}`,
                  borderBottom: `2px solid ${theme.accentBrownLight}`,
                  boxShadow: '0px 2.5px 0px 0px #61421c13',
                  cursor: 'pointer',
                  position: 'relative',
                  outline: 'none',
                  transition: 'background 0.11s, box-shadow 0.11s',
                  background: (selectedNote && selectedNote.id === note.id)
                    ? `${theme.accentBrown}18` : 'none',
                }}
                onKeyPress={e => e.key === 'Enter' && editNote(note)}
              >
                {/* Title with brown accent */}
                <div style={{
                  fontWeight: 800,
                  fontSize: 18,
                  fontFamily: "'Marker Felt', 'Noteworthy', 'Inter', sans-serif",
                  color: theme.accentBrown,
                  letterSpacing: '0.05em',
                  lineHeight: '34px',
                  textShadow: `0px 1px 0px ${theme.accentBrownLight}22`
                }}>
                  {note.title}
                </div>
                <div style={{
                  fontSize: 14,
                  color: `${theme.text}ac`,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  marginTop: '-11px',
                  letterSpacing: 0.01,
                }}>
                  {note.content.replace(/\n/g, ' ').slice(0, 78)}{note.content.length > 78 ? '…' : ''}
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
                        color: isDark ? theme.accentBrown : '#3a2617',
                        border: `1px solid ${theme.accentBrownLight}44`,
                        boxShadow: '0px 1px 6px #ae917a19',
                        letterSpacing: 0.01
                      }}>
                      {tag}
                    </span>
                  ))}
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
              fontSize: 20,
              marginBottom: 14,
              color: theme.primary,
              fontWeight: 600,
              fontFamily: "'Marker Felt', 'Noteworthy', 'Inter', sans-serif"
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
                fontWeight: 600,
                border: 'none',
                outline: 'none',
                width: '100%',
                background: 'none',
                borderBottom: `1.5px solid ${theme.line}`,
                marginBottom: 10,
                color: theme.text,
                padding: '0.3em 0'
              }}
            />
            <textarea
              placeholder="Write your notes here…"
              value={editBuffer.content}
              onChange={e => setEditBuffer(b => ({ ...b, content: e.target.value }))}
              rows={6}
              style={{
                fontSize: 16,
                border: `1.3px solid ${theme.line}`,
                borderRadius: 6,
                width: '100%',
                padding: '0.7em',
                marginBottom: 10,
                color: theme.text,
                fontFamily: "'Noteworthy', 'Inter', 'Roboto', sans-serif",
                background: isDark ? theme.paper : '#fff8',
                resize: 'vertical',
                minHeight: 90,
              }}
            />
            {/* Tag adder */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 14.5, color: theme.primary, fontWeight: 600, marginBottom: 2, letterSpacing: 0.1 }}>Tags:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {editBuffer.tags.map((tag, idx) => (
                  <div
                    key={tag + idx}
                    style={{
                      background: getTagColor(tag),
                      color: isDark ? '#251e1a' : '#261c13',
                      padding: '2px 9px 2px 7px',
                      borderRadius: 7,
                      marginRight: 2,
                      fontSize: 13.3,
                      display: 'flex',
                      alignItems: 'center',
                      fontWeight: 500
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
                    border: `1.1px solid ${theme.line}`,
                    borderRadius: 7,
                    padding: '2.3px 7px',
                    minWidth: 45,
                    outline: 'none'
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
