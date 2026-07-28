import { useState } from 'react';
import { useApp } from '../lib/AppContext.jsx';
import './StubPages.css';

const TYPE_ICONS = {
  pdf: '📄', doc: '📝', image: '🖼️', video: '🎬', audio: '🎵', archive: '🗜️', other: '📎',
};

function fileType(name) {
  const ext = (name.split('.').pop() || '').toLowerCase();
  if (['pdf'].includes(ext)) return 'pdf';
  if (['doc','docx','txt','md'].includes(ext)) return 'doc';
  if (['png','jpg','jpeg','gif','webp','svg'].includes(ext)) return 'image';
  if (['mp4','mov','avi','mkv'].includes(ext)) return 'video';
  if (['mp3','wav','ogg'].includes(ext)) return 'audio';
  if (['zip','rar','7z'].includes(ext)) return 'archive';
  return 'other';
}

export default function Files() {
  const { subjects } = useApp();
  const [files, setFiles] = useState([]);
  const [subjectId, setSubjectId] = useState('');

  const onUpload = (e) => {
    const list = Array.from(e.target.files || []);
    const mapped = list.map(f => ({ id: Date.now() + Math.random(), name: f.name, size: f.size, type: fileType(f.name), subject_id: subjectId || null }));
    setFiles(prev => [...mapped, ...prev]);
  };

  const remove = (id) => setFiles(f => f.filter(x => x.id !== id));
  const assign = (id, sid) => setFiles(f => f.map(x => x.id === id ? { ...x, subject_id: sid } : x));

  return (
    <div className="files-page">
      <div className="page-toolbar"><div><h2>Files</h2><p className="page-desc">Upload and organize your study materials</p></div></div>
      <div className="card form-card">
        <div className="form-row">
          <div className="form-field">
            <label>Assign to subject (optional)</label>
            <select value={subjectId} onChange={e => setSubjectId(e.target.value)}>
              <option value="">None</option>
              {(subjects || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>Upload files</label>
            <input type="file" multiple onChange={onUpload} />
          </div>
        </div>
      </div>

      {files.length === 0 ? (
        <div className="card empty-state"><div className="empty-icon">📁</div><p>No files uploaded yet</p></div>
      ) : (
        <ul className="file-list">
          {files.map(f => {
            const subj = (subjects || []).find(s => s.id === f.subject_id);
            return (
              <li key={f.id} className="file-item card">
                <span className="file-icon">{TYPE_ICONS[f.type]}</span>
                <div className="file-info">
                  <div className="file-name">{f.name}</div>
                  <div className="file-meta">{(f.size / 1024).toFixed(1)} KB</div>
                </div>
                <select value={f.subject_id || ''} onChange={e => assign(f.id, e.target.value)} className="file-subject">
                  <option value="">No subject</option>
                  {(subjects || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <button className="btn btn-ghost btn-sm" onClick={() => remove(f.id)}>🗑 Delete</button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
