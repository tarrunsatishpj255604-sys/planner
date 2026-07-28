import { useState, useRef } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import './StubPages.css'

function fileIcon(type) {
  if (type?.includes('pdf')) return '📄'
  if (type?.includes('image')) return '🖼️'
  if (type?.includes('word') || type?.includes('document')) return '📝'
  if (type?.includes('zip') || type?.includes('compressed')) return '🗜️'
  if (type?.includes('video')) return '🎬'
  if (type?.includes('audio')) return '🎵'
  if (type?.includes('spreadsheet')) return '📊'
  if (type?.includes('presentation')) return '📽️'
  return '📎'
}

function formatSize(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function Files() {
  const { files, subjects, loading, refresh, user, unlockAchievement } = useApp()
  const [uploading, setUploading] = useState(false)
  const [subjectSelects, setSubjectSelects] = useState({})
  const fileRef = useRef(null)

  const onPick = () => fileRef.current?.click()

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    const path = `${user.id}/${Date.now()}-${file.name}`
    const { error: upErr } = await supabase.storage.from('user_files').upload(path, file)
    if (!upErr) {
      await supabase.from('user_files').insert({ file_name: file.name, file_path: path, file_size: file.size, file_type: file.type, subject_id: subjectSelects[file.name] || null })
      await unlockAchievement('files_1')
      refresh()
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const updateFileSubject = async (id, sid) => {
    await supabase.from('user_files').update({ subject_id: sid || null }).eq('id', id)
    refresh()
  }

  const download = async (f) => {
    const { data } = supabase.storage.from('user_files').getPublicUrl(f.file_path)
    if (data?.publicUrl) window.open(data.publicUrl, '_blank')
  }

  const del = async (f) => {
    await supabase.storage.from('user_files').remove([f.file_path])
    await supabase.from('user_files').delete().eq('id', f.id)
    refresh()
  }

  if (loading) return <div className="stub-loading"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)', width: 28, height: 28 }} /></div>

  return (
    <div className="files-page">
      <div className="page-toolbar">
        <div><h2 className="page-title">Files</h2><p className="page-desc">Upload and organize your study materials.</p></div>
        <button className="btn btn-primary" onClick={onPick} disabled={uploading}>{uploading ? 'Uploading...' : '+ Upload File'}</button>
        <input type="file" ref={fileRef} style={{ display: 'none' }} onChange={onFile} />
      </div>

      {files.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" style={{ background: 'var(--primary-l)', color: 'var(--primary)' }}>📁</div>
          <h3>No files yet</h3><p>Upload your first file to get started.</p>
          <button className="btn btn-primary" onClick={onPick} disabled={uploading}>{uploading ? 'Uploading...' : '+ Upload File'}</button>
        </div>
      ) : (
        <div className="files-list">
          {files.map(f => (
            <div key={f.id} className="card file-row">
              <span className="file-icon">{fileIcon(f.file_type)}</span>
              <div className="file-info">
                <strong className="file-name">{f.file_name}</strong>
                <span className="file-size">{formatSize(f.file_size)}</span>
              </div>
              <select className="file-subject-select" value={f.subject_id || ''} onChange={e => updateFileSubject(f.id, e.target.value)}>
                <option value="">No subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <div className="file-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => download(f)}>⬇ Download</button>
                <button className="btn btn-ghost btn-sm file-del" onClick={() => del(f)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
