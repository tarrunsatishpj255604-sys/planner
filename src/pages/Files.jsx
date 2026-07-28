import { useRef, useState } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import './StubPages.css'

const FILE_ICONS = {
  pdf: '📄', doc: '📝', docx: '📝', txt: '📄', img: '🖼️', png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️', webp: '🖼️',
  zip: '🗜️', rar: '🗜️', mp3: '🎵', wav: '🎵', mp4: '🎬', mov: '🎬', ppt: '📊', pptx: '📊', xls: '📈', xlsx: '📈',
  default: '📎',
}

function getFileIcon(file) {
  const ext = (file.file_name || '').split('.').pop()?.toLowerCase() || ''
  const type = (file.file_type || '').split('/')[0]
  if (FILE_ICONS[ext]) return FILE_ICONS[ext]
  if (type === 'image') return '🖼️'
  if (type === 'video') return '🎬'
  if (type === 'audio') return '🎵'
  return FILE_ICONS.default
}

function formatSize(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function Files() {
  const { files, subjects, loading, refresh, unlockAchievement } = useApp()
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [subjectSelects, setSubjectSelects] = useState({})

  const uploadFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const path = `${user.id}/${Date.now()}-${file.name}`
      const { error: uploadErr } = await supabase.storage.from('user_files').upload(path, file)
      if (uploadErr) throw uploadErr
      await supabase.from('user_files').insert({ file_name: file.name, file_path: path, file_size: file.size, file_type: file.type })
      await unlockAchievement('files_1')
      refresh()
    } catch (err) {
      console.error('Upload error:', err)
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const downloadFile = async (file) => {
    const { data } = supabase.storage.from('user_files').getPublicUrl(file.file_path)
    if (data?.publicUrl) window.open(data.publicUrl, '_blank')
  }

  const deleteFile = async (file) => {
    try {
      await supabase.storage.from('user_files').remove([file.file_path])
    } catch (e) { /* may already be gone */ }
    await supabase.from('user_files').delete().eq('id', file.id)
    refresh()
  }

  const updateFileSubject = async (fileId, subjId) => {
    setSubjectSelects(prev => ({ ...prev, [fileId]: subjId }))
    await supabase.from('user_files').update({ subject_id: subjId || null }).eq('id', fileId)
    refresh()
  }

  if (loading) return <div className="dash-loading"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }} /></div>

  return (
    <div className="stub-page files-page">
      <div className="page-toolbar">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Files</h2>
          <p className="page-desc">Upload and organize your study materials.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={uploadFile} />
          <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? <><span className="spinner" /> Uploading...</> : '⬆ Upload File'}
          </button>
        </div>
      </div>

      {files.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" style={{ background: 'var(--primary-l)', color: 'var(--primary)' }}>📁</div>
          <h3>No files uploaded</h3>
          <p>Upload your study materials to keep them organized and accessible.</p>
        </div>
      ) : (
        <div className="files-list">
          {files.map(f => (
            <div key={f.id} className="card file-row">
              <span className="file-icon">{getFileIcon(f)}</span>
              <div className="file-info">
                <span className="file-name">{f.file_name}</span>
                <span className="file-meta">{formatSize(f.file_size)}{f.file_type ? ` · ${f.file_type}` : ''}</span>
              </div>
              <select className="file-subject-select" value={subjectSelects[f.id] ?? f.subject_id ?? ''} onChange={e => updateFileSubject(f.id, e.target.value)}>
                <option value="">No subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <div className="file-actions">
                <button className="btn btn-outline btn-sm" onClick={() => downloadFile(f)}>⬇ Download</button>
                <button className="btn btn-ghost btn-sm" onClick={() => deleteFile(f)}>🗑️ Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
