import { useState } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import './StubPages.css'

export default function Files() {
  const { subjects } = useApp()
  const [files, setFiles] = useState([])

  const handleUpload = (e) => {
    const newFiles = Array.from(e.target.files).map(f => ({
      id: Date.now() + Math.random(),
      name: f.name,
      size: f.size,
      type: f.type,
      subject: '',
    }))
    setFiles(prev => [...prev, ...newFiles])
  }

  const setFileSubject = (id, subjectId) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, subject: subjectId } : f))
  }

  const deleteFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = (type) => {
    if (type?.includes('pdf')) return '📄'
    if (type?.includes('image')) return '🖼️'
    if (type?.includes('word')) return '📝'
    if (type?.includes('presentation')) return '📊'
    if (type?.includes('video')) return '🎬'
    return '📎'
  }

  return (
    <div className="files-page">
      <div className="page-toolbar">
        <p className="page-desc">Upload and organize your study files by subject. PDFs, images, documents, and more.</p>
        <label className="btn btn-primary btn-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
          Upload files
          <input type="file" multiple onChange={handleUpload} style={{ display: 'none' }} />
        </label>
      </div>

      {files.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" style={{ background: 'var(--primary-l)', color: 'var(--primary)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
          </div>
          <h3>No files uploaded yet</h3>
          <p>Upload PDFs, images, documents, and more. Organize them by subject.</p>
          <label className="btn btn-primary">
            Upload your first file
            <input type="file" multiple onChange={handleUpload} style={{ display: 'none' }} />
          </label>
        </div>
      ) : (
        <div className="file-list">
          {files.map(f => (
            <div key={f.id} className="file-item">
              <span className="file-icon">{getFileIcon(f.type)}</span>
              <div className="file-info">
                <span className="file-name">{f.name}</span>
                <span className="file-size">{formatSize(f.size)}</span>
              </div>
              <select value={f.subject} onChange={e => setFileSubject(f.id, e.target.value)} className="file-subject-select">
                <option value="">No subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
              </select>
              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }} onClick={() => deleteFile(f.id)}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
