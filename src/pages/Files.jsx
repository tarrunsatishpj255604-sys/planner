import { useState, useRef } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import './StubPages.css'

export default function Files() {
  const { files, subjects, user, refresh, unlockAchievement } = useApp()
  const fileRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [assignSubject, setAssignSubject] = useState({})

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = (type) => {
    if (type?.includes('pdf')) return '📄'
    if (type?.includes('image')) return '🖼️'
    if (type?.includes('word') || type?.includes('doc')) return '📝'
    if (type?.includes('zip') || type?.includes('rar')) return '🗜️'
    if (type?.includes('video')) return '🎬'
    if (type?.includes('audio')) return '🎵'
    if (type?.includes('text')) return '📃'
    if (type?.includes('spreadsheet') || type?.includes('excel')) return '📊'
    if (type?.includes('presentation') || type?.includes('powerpoint')) return '📽️'
    return '📎'
  }

  const handleUpload = async (e) => {
    const selectedFiles = Array.from(e.target.files)
    if (selectedFiles.length === 0) return
    setUploading(true)
    for (const file of selectedFiles) {
      const path = `${user.id}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage.from('user_files').upload(path, file)
      if (uploadError) continue
      await supabase.from('user_files').insert({ file_name: file.name, file_path: path, file_size: file.size, file_type: file.type, subject_id: null }).select().single()
      unlockAchievement('files_1')
    }
    setUploading(false); refresh()
    if (fileRef.current) fileRef.current.value = ''
  }

  const assignFile = async (fileId, subjectId) => {
    await supabase.from('user_files').update({ subject_id: subjectId || null }).eq('id', fileId); refresh()
  }

  const downloadFile = async (file) => {
    const { data } = supabase.storage.from('user_files').getPublicUrl(file.file_path)
    if (data?.publicUrl) window.open(data.publicUrl, '_blank')
  }

  const deleteFile = async (file) => {
    await supabase.storage.from('user_files').remove([file.file_path])
    await supabase.from('user_files').delete().eq('id', file.id); refresh()
  }

  return (
    <div className="files-page">
      <div className="page-toolbar">
        <div><h2>Files</h2><p className="page-desc">Upload and organize your study materials</p></div>
        <button className="btn btn-primary" onClick={() => fileRef.current?.click()} disabled={uploading}>{uploading ? 'Uploading...' : '+ Upload File'}</button>
        <input ref={fileRef} type="file" multiple onChange={handleUpload} style={{ display: 'none' }} />
      </div>

      {files.length === 0 ? (
        <div className="empty-state"><div className="empty-icon" style={{ background: 'var(--primary-l)', fontSize: 28 }}>📁</div><h3>No files yet</h3><p>Upload your study materials to get started.</p><button className="btn btn-primary" onClick={() => fileRef.current?.click()}>Upload File</button></div>
      ) : (
        <div className="files-list">
          {files.map(file => (
            <div key={file.id} className="file-item">
              <span className="file-icon">{getFileIcon(file.file_type)}</span>
              <div className="file-info">
                <span className="file-name">{file.file_name}</span>
                <span className="file-meta">{formatSize(file.file_size || 0)}</span>
              </div>
              <select className="file-subject-select" value={file.subject_id || ''} onChange={e => assignFile(file.id, e.target.value)}>
                <option value="">No subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <div className="file-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => downloadFile(file)}>Download</button>
                <button className="btn btn-ghost btn-sm" onClick={() => deleteFile(file)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
