import { useState } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import './StubPages.css'

const FILE_ICONS = {
  pdf: '📄', doc: '📝', img: '🖼️', audio: '🎵', video: '🎬', archive: '🗜️', default: '📎',
}

function getFileIcon(name) {
  const ext = name.split('.').pop()?.toLowerCase()
  if (['pdf'].includes(ext)) return FILE_ICONS.pdf
  if (['doc', 'docx', 'txt', 'md'].includes(ext)) return FILE_ICONS.doc
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return FILE_ICONS.img
  if (['mp3', 'wav', 'ogg'].includes(ext)) return FILE_ICONS.audio
  if (['mp4', 'mov', 'avi', 'webm'].includes(ext)) return FILE_ICONS.video
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return FILE_ICONS.archive
  return FILE_ICONS.default
}

export default function Files() {
  const { subjects } = useApp()
  const [files, setFiles] = useState([])
  const [subjectId, setSubjectId] = useState('')

  const handleUpload = (e) => {
    const uploaded = Array.from(e.target.files || [])
    const newFiles = uploaded.map(f => ({
      id: Date.now() + Math.random(),
      name: f.name,
      size: f.size,
      type: f.type,
      subject_id: subjectId || null,
      uploadedAt: new Date().toISOString(),
    }))
    setFiles([...files, ...newFiles])
  }

  const deleteFile = (id) => setFiles(files.filter(f => f.id !== id))

  const assignSubject = (id, sid) => setFiles(files.map(f => f.id === id ? { ...f, subject_id: sid } : f))

  const fmtSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  const getSubject = (id) => subjects.find(s => s.id === id)

  return (
    <div className="stub-page files-page">
      <div className="page-toolbar">
        <div><h2>Files</h2><p className="page-desc">Upload and organize your study materials.</p></div>
      </div>

      <div className="card file-upload-card">
        <div className="file-upload-zone">
          <span className="upload-icon">📁</span>
          <p>Click to browse or drag files here</p>
          <input type="file" multiple onChange={handleUpload} className="file-input" />
        </div>
        <div className="form-field">
          <label>Assign to subject</label>
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">No subject</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
          </select>
        </div>
      </div>

      {files.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" style={{ background: 'var(--primary-l)', fontSize: 28 }}>📂</div>
          <h3>No files yet</h3>
          <p>Upload files to organize your study materials.</p>
        </div>
      ) : (
        <div className="file-list">
          {files.map(f => {
            const sub = getSubject(f.subject_id)
            return (
              <div key={f.id} className="file-row">
                <span className="file-icon">{getFileIcon(f.name)}</span>
                <div className="file-info">
                  <div className="file-name">{f.name}</div>
                  <div className="file-meta">{fmtSize(f.size)} · {new Date(f.uploadedAt).toLocaleDateString()}</div>
                </div>
                <select className="file-subject-select" value={f.subject_id || ''} onChange={(e) => assignSubject(f.id, e.target.value)}>
                  <option value="">No subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                </select>
                {sub && <span className="file-subject-tag" style={{ color: sub.color }}>{sub.icon} {sub.name}</span>}
                <button className="btn btn-ghost btn-sm" onClick={() => deleteFile(f.id)}>🗑️</button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
