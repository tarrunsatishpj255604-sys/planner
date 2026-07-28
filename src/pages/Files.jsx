import { useState, useRef } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import './StubPages.css'

const FILE_ICONS = { pdf: '📄', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊', ppt: '📽️', pptx: '📽️', txt: '📃', md: '📃', jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', zip: '🗜️', rar: '🗜️', mp4: '🎬', mp3: '🎵', default: '📁' }

function getIcon(name) {
  const ext = name.split('.').pop()?.toLowerCase()
  return FILE_ICONS[ext] || FILE_ICONS.default
}

export default function Files() {
  const { subjects } = useApp()
  const [files, setFiles] = useState([])
  const [subjectId, setSubjectId] = useState('')
  const inputRef = useRef(null)

  const handleUpload = (e) => {
    const selected = Array.from(e.target.files || [])
    const newFiles = selected.map(f => ({ id: Date.now() + Math.random(), name: f.name, size: f.size, subjectId: subjectId || null }))
    setFiles(prev => [...prev, ...newFiles])
    if (inputRef.current) inputRef.current.value = ''
  }

  const removeFile = (id) => setFiles(prev => prev.filter(f => f.id !== id))

  const formatSize = (bytes) => { if (bytes < 1024) return bytes + ' B'; if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'; return (bytes / 1048576).toFixed(1) + ' MB' }

  return (
    <div className="stub-page files-page">
      <div className="stub-hero">
        <div className="stub-hero-icon">📁</div>
        <h1>Files</h1>
        <p className="stub-tagline">Upload and organize your study materials — coming soon!</p>
        <div className="stub-badge">Beta</div>
      </div>

      <div className="files-upload-card">
        <div className="files-upload-row">
          <select value={subjectId} onChange={e => setSubjectId(e.target.value)} className="files-select">
            <option value="">No subject</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => inputRef.current?.click()}>+ Upload Files</button>
          <input ref={inputRef} type="file" multiple style={{ display: 'none' }} onChange={handleUpload} />
        </div>
      </div>

      {files.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" style={{ background: 'var(--primary-l)', color: 'var(--primary)' }}>📂</div>
          <h3>No files uploaded</h3>
          <p>Upload your study materials to keep them organized.</p>
        </div>
      ) : (
        <div className="files-list">
          {files.map(f => {
            const subject = subjects.find(s => s.id === f.subjectId)
            return (
              <div key={f.id} className="file-item">
                <span className="file-icon">{getIcon(f.name)}</span>
                <div className="file-info">
                  <span className="file-name">{f.name}</span>
                  <span className="file-meta">{formatSize(f.size)}{subject && ` · ${subject.icon} ${subject.name}`}</span>
                </div>
                <button className="btn btn-sm btn-ghost" onClick={() => removeFile(f.id)}>🗑️</button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
