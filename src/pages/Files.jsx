import { useState, useRef } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import './FilesPage.css'

const FILE_ICONS = {
  pdf: '📄', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊', ppt: '📽️', pptx: '📽️',
  jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', webp: '🖼️',
  mp4: '🎬', mov: '🎬', avi: '🎬', mp3: '🎵', wav: '🎵',
  zip: '🗜️', rar: '🗜️', txt: '📃', md: '📃', default: '📎',
}

function getFileIcon(name) {
  const ext = name?.split('.').pop()?.toLowerCase()
  return FILE_ICONS[ext] || FILE_ICONS.default
}

function formatSize(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function Files() {
  const { files, subjects, user, loading, refresh, unlockAchievement } = useApp()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  if (loading) return <div className="dash-loading"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)', width: 28, height: 28 }} /></div>

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true); setError('')
    const filePath = `${user.id}/${Date.now()}-${file.name}`
    const { error: upErr } = await supabase.storage.from('user_files').upload(filePath, file)
    if (upErr) { setError(upErr.message); setUploading(false); return }
    const { error: insErr } = await supabase.from('user_files').insert({
      file_name: file.name, file_path: filePath, file_size: file.size, file_type: file.type, subject_id: null,
    })
    if (insErr) { setError(insErr.message); setUploading(false); return }
    if (files.length === 0) await unlockAchievement('files_1')
    refresh()
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const updateFileSubject = async (fileId, subjectId) => {
    await supabase.from('user_files').update({ subject_id: subjectId || null }).eq('id', fileId)
    refresh()
  }

  const downloadFile = async (filePath, fileName) => {
    const { data } = supabase.storage.from('user_files').getPublicUrl(filePath)
    if (data?.publicUrl) {
      const a = document.createElement('a')
      a.href = data.publicUrl
      a.download = fileName
      a.target = '_blank'
      a.click()
    }
  }

  const deleteFile = async (file) => {
    await supabase.storage.from('user_files').remove([file.file_path])
    await supabase.from('user_files').delete().eq('id', file.id)
    refresh()
  }

  return (
    <div className="files-page">
      <div className="page-toolbar">
        <div><h2>Files</h2><p className="page-desc">Upload and organize your study materials. Assign files to subjects for easy access.</p></div>
        <div>
          <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleUpload} />
          <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? <><span className="spinner" /> Uploading...</> : '⬆ Upload File'}
          </button>
        </div>
      </div>

      {error && <div className="form-error">⚠ {error}</div>}

      {files.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" style={{ background: 'var(--primary-l)', color: 'var(--primary)', fontSize: 28 }}>📁</div>
          <h3>No files uploaded yet</h3>
          <p>Upload study materials, notes, or resources to keep them organized.</p>
          <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>⬆ Upload Your First File</button>
        </div>
      ) : (
        <div className="file-list">
          {files.map(file => {
            const subj = subjects.find(s => s.id === file.subject_id)
            return (
              <div key={file.id} className="file-row">
                <span className="file-icon">{getFileIcon(file.file_name)}</span>
                <div className="file-main">
                  <span className="file-name">{file.file_name}</span>
                  <span className="file-meta">{formatSize(file.file_size)} · {file.file_type || 'Unknown'}</span>
                </div>
                {subj && <span className="file-subject" style={{ background: subj.color + '22', color: subj.color }}>{subj.icon} {subj.name}</span>}
                <select className="file-subject-select" value={file.subject_id || ''} onChange={e => updateFileSubject(file.id, e.target.value)}>
                  <option value="">No subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                </select>
                <div className="file-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => downloadFile(file.file_path, file.file_name)}>⬇</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => deleteFile(file)}>🗑️</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
