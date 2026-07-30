import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { supabase } from './supabaseClient.js'
import { levelFromXp } from './helpers.js'

const AppContext = createContext(null)
export function useApp() { const ctx = useContext(AppContext); if (!ctx) throw new Error('useApp must be used within AppProvider'); return ctx }

export function AppProvider({ session, children }) {
  const [profile, setProfile] = useState(null)
  const [subjects, setSubjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [notes, setNotes] = useState([])
  const [flashcards, setFlashcards] = useState([])
  const [sessions, setSessions] = useState([])
  const [exams, setExams] = useState([])
  const [achievements, setAchievements] = useState([])
  const [quickNotes, setQuickNotes] = useState([])
  const [settings, setSettings] = useState(null)
  const [files, setFiles] = useState([])
  const [friends, setFriends] = useState([])
  const [friendRequests, setFriendRequests] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const user = session?.user

  const ensureProfile = useCallback(async () => {
    if (!user) return
    const { data: existing } = await supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle()
    if (existing) { setProfile(existing); return existing }
    const username = user.email?.split('@')[0] || 'Student'
    const { data, error } = await supabase.from('profiles').insert({ user_id: user.id, username }).select().single()
    if (!error && data) { setProfile(data); return data }
  }, [user])

  const ensureSettings = useCallback(async () => {
    if (!user) return
    const { data: existing } = await supabase.from('user_settings').select('*').eq('user_id', user.id).maybeSingle()
    if (existing) { setSettings(existing); return existing }
    const { data, error } = await supabase.from('user_settings').insert({ user_id: user.id }).select().single()
    if (!error && data) { setSettings(data); return data }
  }, [user])

  const fetchAll = useCallback(async () => {
    if (!user) return
    await Promise.all([ensureProfile(), ensureSettings()])
    const [subRes, taskRes, noteRes, fcRes, sessRes, examRes, achRes, qnRes, fileRes, frRes, freqRes, notifRes] = await Promise.all([
      supabase.from('subjects').select('*').order('created_at', { ascending: true }),
      supabase.from('tasks').select('*, subject:subjects(*)').order('created_at', { ascending: false }),
      supabase.from('notes').select('*, subject:subjects(*)').order('updated_at', { ascending: false }),
      supabase.from('flashcards').select('*, subject:subjects(*)').order('created_at', { ascending: false }),
      supabase.from('study_sessions').select('*, subject:subjects(*)').order('session_date', { ascending: false }),
      supabase.from('exams').select('*, subject:subjects(*)').order('exam_date', { ascending: true }),
      supabase.from('achievements').select('*'),
      supabase.from('quick_notes').select('*').order('created_at', { ascending: false }),
      supabase.from('user_files').select('*, subject:subjects(*)').order('created_at', { ascending: false }),
      supabase.from('friends').select('*, friend:profiles!friends_friend_id_fkey(*)').order('created_at', { ascending: false }),
      supabase.from('friend_requests').select('*, sender:profiles!friend_requests_sender_id_fkey(*)').eq('receiver_id', user.id).eq('status', 'pending'),
      supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50),
    ])
    if (subRes.data) setSubjects(subRes.data)
    if (taskRes.data) setTasks(taskRes.data)
    if (noteRes.data) setNotes(noteRes.data)
    if (fcRes.data) setFlashcards(fcRes.data)
    if (sessRes.data) setSessions(sessRes.data)
    if (examRes.data) setExams(examRes.data)
    if (achRes.data) setAchievements(achRes.data)
    if (qnRes.data) setQuickNotes(qnRes.data)
    if (fileRes.data) setFiles(fileRes.data)
    if (frRes.data) setFriends(frRes.data)
    if (freqRes.data) setFriendRequests(freqRes.data)
    if (notifRes.data) setNotifications(notifRes.data)
    setLoading(false)
  }, [user, ensureProfile, ensureSettings])

  useEffect(() => { fetchAll() }, [fetchAll])
  const refresh = useCallback(() => { fetchAll() }, [fetchAll])

  const addXp = useCallback(async (amount) => {
    if (!profile) return
    const newXp = profile.xp + amount
    const { level } = levelFromXp(newXp)
    const updates = { xp: newXp }
    if (level > profile.level) updates.level = level
    setProfile(prev => prev ? { ...prev, ...updates } : prev)
    await supabase.from('profiles').update(updates).eq('user_id', user.id)
  }, [profile, user])

  const unlockAchievement = useCallback(async (key) => {
    if (achievements.some(a => a.key === key)) return
    const { data } = await supabase.from('achievements').insert({ user_id: user.id, key }).select().single()
    if (data) setAchievements(prev => [...prev, data])
  }, [achievements, user])

  const updateSettings = useCallback(async (updates) => {
    if (!settings) return
    setSettings({ ...settings, ...updates })
    await supabase.from('user_settings').update(updates).eq('user_id', user.id)
  }, [settings, user])

  const updateProfile = useCallback(async (updates) => {
    if (!profile) return
    setProfile({ ...profile, ...updates })
    await supabase.from('profiles').update(updates).eq('user_id', user.id)
  }, [profile, user])

  const pushNotification = useCallback(async (targetUserId, type, title, body, actorId, resourceId) => {
    await supabase.from('notifications').insert({ user_id: targetUserId, type, title, body, actor_id: actorId || user.id, resource_id: resourceId || null })
  }, [user])

  const markNotificationRead = useCallback(async (id) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }, [])

  const markAllNotificationsRead = useCallback(async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }, [user])

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <AppContext.Provider value={{
      user, profile, subjects, tasks, notes, flashcards, sessions, exams, achievements, quickNotes, files,
      friends, friendRequests, notifications, unreadCount, settings, loading,
      refresh, addXp, unlockAchievement, updateSettings, updateProfile,
      pushNotification, markNotificationRead, markAllNotificationsRead,
    }}>
      {children}
    </AppContext.Provider>
  )
}
