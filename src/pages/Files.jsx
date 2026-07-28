import { useState, useRef } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import './StubPages.css'

export default function Files() {
  const { subjects } = useApp()
  const [files, setFiles] = useState([])
  const [subjectId, setSubjectId] = useState('')
  const inputRef = useRef(null)

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files || [])
    const mapped = selected.map(f => ({
      id: `${f.name}-${Date.now()}-${Math.random()}`,
      name: f.name,
      size: f.size,
      type: f.type || 'file',
      subject_id: subjectId || null,
      uploadedAt: new Date().toISOString(),
    }))
    setFiles(prev => [...mapped, ...prev])
    if (inputRef.current) inputRef.current.value = ''
  }

  const remove = (id) => setFiles(prev => prev.filter(f => f.id !== id))
  const assignSubject = (id, subId) => setFiles(prev => prev.map(f => f.id === id ? { ...f, subject_id: subId } : f))

  const fmtSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const fileIcon = (type) => {
    if (type.startsWith('image/')) return '🖼️'
    if (type.startsWith('video/')) return '🎬'
    if (type.includes('pdf')) return '📄'
    if (type.includes('word') || type.includes('document')) return '📝'
    if (type.includes('sheet') || type.includes('excel')) return '📊'
    if (type.includes('presentation')) return '📑'
    if (type.startsWith('audio/')) return '🎵'
    return '📎'
  }

  return (
    <div className="files-page">
      <div className="page-toolbar">
        <div>
          <h2>Files</h2>
          <p className="page-desc">Upload and organize study materials by subject. (Stored locally for now.)</p>
        </div>
        <button className="btn btn-primary" onClick={() => inputRef.current?.click()}>+ Upload Files</button>
        <input ref={inputRef} type="file" multiple style={{ display: 'none' }} onChange={handleFiles} />
      </div>

      <div className="form-card">
        <div className="form-head"><h3>Upload Settings</h3></div>
        <div className="form-field">
          <label>Assign new uploads to subject</label>
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">No subject</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
          </select>
        </div>
        <button className="btn btn-outline" onClick={() => inputRef.current?.click()}>Choose Files</button>
      </div>

      {files.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" style={{ background: '#e8efff', color: '#4f7cff' }}>📁</div>
          <h3>No files uploaded</h3>
          <p>Upload study materials, notes, or resources to keep them organized.</p>
          <button className="btn btn-primary" onClick={() => inputRef.current?.click()}>+ Upload Files</button>
        </div>
      ) : (
        <div className="files-list">
          {files.map(f => {
            const subj = subjects.find(s => s.id === f.subject_id)
            return (
              <div key={f.id} className="file-item">
                <span className="file-icon">{fileIcon(f.type)}</span>
                <div className="file-main">
                  <span className="file-name">{f.name}</span>
                  <div className="file-meta">
                    <span className="file-size">{fmtSize(f.size)}</span>
                    {subj && <span className="file-subject" style={{ background: subj.color + '22', color: subj.color }}>{subj.icon} {subj.name}</span>}
                  </div>
                </div>
                <select className="file-subject-select" value={f.subject_id || ''} onChange={(e) => assignSubject(f.id, e.target.value)}>
                  <option value="">No subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                </select>
                <button className="file-delete" onClick={() => remove(f.id)}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
