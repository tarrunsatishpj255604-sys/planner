import { useState, useRef } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import './StubPages.css'

const FILE_ICONS = { pdf: '📄', doc: '📝', img: '🖼️', vid: '🎬', audio: '🎵', default: '📎' }

function getFileType(name) {
  const ext = name.split('.').pop()?.toLowerCase()
  if (['pdf'].includes(ext)) return 'pdf'
  if (['doc', 'docx', 'txt'].includes(ext)) return 'doc'
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return 'img'
  if (['mp4', 'mov', 'avi'].includes(ext)) return 'vid'
  if (['mp3', 'wav'].includes(ext)) return 'audio'
  return 'default'
}

export default function Files() {
  const { subjects } = useApp()
  const [files, setFiles] = useState([])
  const [subjectId, setSubjectId] = useState('')
  const inputRef = useRef(null)

  const handleUpload = (e) => {
    const selected = Array.from(e.target.files || [])
    const newFiles = selected.map(f => ({ id: Date.now() + Math.random(), name: f.name, size: f.size, type: getFileType(f.name), subject_id: subjectId || null }))
    setFiles(prev => [...newFiles, ...prev])
    if (inputRef.current) inputRef.current.value = ''
  }

  const deleteFile = (id) => setFiles(prev => prev.filter(f => f.id !== id))
  const assignSubject = (id, subId) => setFiles(prev => prev.map(f => f.id === id ? { ...f, subject_id: subId || null } : f))

  const formatSize = (bytes) => bytes < 1024 ? `${bytes}B` : bytes < 1048576 ? `${(bytes / 1024).toFixed(1)}KB` : `${(bytes / 1048576).toFixed(1)}MB`

  return (
    <div className="stub-page files-page">
      <div className="page-toolbar">
        <div><h2>Files</h2><p className="page-desc">Upload and organize your study materials. Stored locally for now.</p></div>
        <div className="files-upload-row">
          <select value={subjectId} onChange={e => setSubjectId(e.target.value)}><option value="">No subject</option>{(subjects || []).map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}</select>
          <button className="btn btn-primary" onClick={() => inputRef.current?.click()}>+ Upload</button>
          <input ref={inputRef} type="file" multiple style={{ display: 'none' }} onChange={handleUpload} />
        </div>
      </div>

      {files.length === 0 ? (
        <div className="empty-state"><div className="empty-icon" style={{ background: 'var(--primary-l)' }}>📁</div><h3>No files yet</h3><p>Upload study materials to get started.</p><button className="btn btn-primary" onClick={() => inputRef.current?.click()}>+ Upload Files</button></div>
      ) : (
        <div className="files-list">
          {files.map(f => {
            const subject = (subjects || []).find(s => s.id === f.subject_id)
            return (
              <div key={f.id} className="card file-item">
                <span className="file-icon">{FILE_ICONS[f.type]}</span>
                <div className="file-info">
                  <span className="file-name">{f.name}</span>
                  <span className="file-size">{formatSize(f.size)}</span>
                </div>
                <select value={f.subject_id || ''} onChange={e => assignSubject(f.id, e.target.value)} className="file-subject-select"><option value="">No subject</option>{(subjects || []).map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}</select>
                {subject && <span className="file-subject-tag" style={{ color: subject.color, background: `${subject.color}18` }}>{subject.icon} {subject.name}</span>}
                <button className="btn btn-ghost btn-sm" onClick={() => deleteFile(f.id)}>🗑️</button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
