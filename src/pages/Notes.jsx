import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useApp } from '../lib/AppContext.jsx';
import { supabase } from '../lib/supabaseClient.js';
import { formatDate } from '../lib/helpers.js';
import './NotesPage.css';

const FOLDERS = ['All', 'General', 'Important', 'Archive'];

export default function Notes() {
  const { profile, subjects, notes, refresh } = useApp();
  const [search, setSearch] = useState('');
  const [folder, setFolder] = useState('All');
  const [activeId, setActiveId] = useState(null);
  const [draft, setDraft] = useState({ title: '', content: '', subject_id: '', folder: 'General', tags: '', pinned: false, favorite: false });
  const saveTimer = useRef(null);

  const filtered = useMemo(() => {
    return (notes || [])
      .filter(n => {
        if (folder !== 'All' && (n.folder || 'General') !== folder) return false;
        if (search && !((n.title || '') + (n.content || '')).toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (b.created_at || '').localeCompare(a.created_at || ''));
  }, [notes, folder, search]);

  const active = useMemo(() => (notes || []).find(n => n.id === activeId), [notes, activeId]);

  useEffect(() => {
    if (active) {
      setDraft({ title: active.title || '', content: active.content || '', subject_id: active.subject_id || '', folder: active.folder || 'General', tags: (active.tags || []).join(', '), pinned: !!active.pinned, favorite: !!active.favorite });
    } else {
      setDraft({ title: '', content: '', subject_id: '', folder: 'General', tags: '', pinned: false, favorite: false });
    }
  }, [activeId, active]);

  const save = useCallback(async (id, data) => {
    try {
      const payload = {
        ...data,
        tags: typeof data.tags === 'string' ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : data.tags,
      };
      if (id) {
        await supabase.from('notes').update(payload).eq('id', id);
      } else {
        const { data: created } = await supabase.from('notes').insert({ ...payload, user_id: profile?.id, created_at: new Date().toISOString() }).select();
        if (created && created[0]) setActiveId(created[0].id);
      }
      refresh();
    } catch (e) { console.error(e); }
  }, [profile, refresh]);

  const debouncedSave = useCallback((id, data) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(id, data), 1500);
  }, [save]);

  const update = (field, value) => {
    const next = { ...draft, [field]: value };
    setDraft(next);
    if (activeId || next.title || next.content) debouncedSave(activeId, next);
  };

  const newNote = () => { setActiveId(null); setDraft({ title: '', content: '', subject_id: '', folder: 'General', tags: '', pinned: false, favorite: false }); };

  const togglePin = async () => {
    if (!activeId) return;
    await supabase.from('notes').update({ pinned: !draft.pinned }).eq('id', activeId);
    setDraft(d => ({ ...d, pinned: !d.pinned })); refresh();
  };
  const toggleFav = async () => {
    if (!activeId) return;
    await supabase.from('notes').update({ favorite: !draft.favorite }).eq('id', activeId);
    setDraft(d => ({ ...d, favorite: !d.favorite })); refresh();
  };
  const del = async () => {
    if (!activeId || !confirm('Delete this note?')) return;
    await supabase.from('notes').delete().eq('id', activeId);
    setActiveId(null); refresh();
  };

  return (
    <div className="notes-page">
      <div className="notes-sidebar">
        <div className="notes-search">
          <input type="text" placeholder="🔍 Search notes..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="folder-filters">
          {FOLDERS.map(f => (
            <button key={f} className={`folder-chip ${folder === f ? 'active' : ''}`} onClick={() => setFolder(f)}>{f}</button>
          ))}
        </div>
        <button className="btn btn-primary btn-sm new-note-btn" onClick={newNote}>+ New Note</button>
        <ul className="note-list">
          {filtered.length === 0 && <li className="empty-state"><p>No notes</p></li>}
          {filtered.map(n => (
            <li key={n.id} className={`note-item ${activeId === n.id ? 'active' : ''}`} onClick={() => setActiveId(n.id)}>
              {n.pinned && <span className="pin">📌</span>}
              <div className="note-title">{n.title || 'Untitled'}</div>
              <div className="note-preview">{(n.content || '').slice(0, 50)}</div>
            </li>
          ))}
        </ul>
      </div>

      <div className="notes-editor">
        {active || (!activeId && (draft.title || draft.content)) ? (
          <>
            <div className="editor-toolbar">
              <input className="editor-title" type="text" value={draft.title} onChange={e => update('title', e.target.value)} placeholder="Note title" />
              <button className="btn btn-ghost btn-sm" onClick={togglePin}>{draft.pinned ? '📌' : '📍'}</button>
              <button className="btn btn-ghost btn-sm" onClick={toggleFav}>{draft.favorite ? '⭐' : '☆'}</button>
              <button className="btn btn-ghost btn-sm" onClick={del}>🗑</button>
            </div>
            <div className="editor-meta">
              <select value={draft.folder} onChange={e => update('folder', e.target.value)}>
                {FOLDERS.filter(f => f !== 'All').map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <select value={draft.subject_id} onChange={e => update('subject_id', e.target.value)}>
                <option value="">No subject</option>
                {(subjects || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <input type="text" placeholder="tags (comma separated)" value={draft.tags} onChange={e => update('tags', e.target.value)} />
            </div>
            <textarea className="editor-content" value={draft.content} onChange={e => update('content', e.target.value)} placeholder="Start writing..." />
            <div className="editor-footer">Auto-saved</div>
          </>
        ) : (
          <div className="empty-state"><div className="empty-icon">📝</div><p>Select or create a note</p></div>
        )}
      </div>
    </div>
  );
}
