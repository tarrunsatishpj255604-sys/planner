import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { supabase } from './supabaseClient.js'
import { levelFromXp, XP_REWARDS, ACHIEVEMENT_DEFS } from './helpers.js'

const AppContext = createContext(null)

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

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
  const [loading, setLoading] = useState(true)

  const user = session?.user

  const ensureProfile = useCallback(async () => {
    if (!user) return
    const { data: existing } = await supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle()
    if (existing) {
      setProfile(existing)
      return existing
    }
    const username = user.email?.split('@')[0] || 'Student'
    const { data, error } = await supabase.from('profiles').insert({ user_id: user.id, username }).select().single()
    if (!error && data) {
      setProfile(data)
      return data
    }
  }, [user])

  const ensureSettings = useCallback(async () => {
    if (!user) return
    const { data: existing } = await supabase.from('user_settings').select('*').eq('user_id', user.id).maybeSingle()
    if (existing) {
      setSettings(existing)
      return existing
    }
    const { data, error } = await supabase.from('user_settings').insert({ user_id: user.id }).select().single()
    if (!error && data) {
      setSettings(data)
      return data
    }
  }, [user])

  const fetchAll = useCallback(async () => {
    if (!user) return
    await Promise.all([ensureProfile(), ensureSettings()])
    const [subRes, taskRes, noteRes, fcRes, sessRes, examRes, achRes, qnRes] = await Promise.all([
      supabase.from('subjects').select('*').order('created_at', { ascending: true }),
      supabase.from('tasks').select('*, subject:subjects(*)').order('created_at', { ascending: false }),
      supabase.from('notes').select('*, subject:subjects(*)').order('updated_at', { ascending: false }),
      supabase.from('flashcards').select('*, subject:subjects(*)').order('created_at', { ascending: false }),
      supabase.from('study_sessions').select('*, subject:subjects(*)').order('session_date', { ascending: false }),
      supabase.from('exams').select('*, subject:subjects(*)').order('exam_date', { ascending: true }),
      supabase.from('achievements').select('*'),
      supabase.from('quick_notes').select('*').order('created_at', { ascending: false }),
    ])
    if (subRes.data) setSubjects(subRes.data)
    if (taskRes.data) setTasks(taskRes.data)
    if (noteRes.data) setNotes(noteRes.data)
    if (fcRes.data) setFlashcards(fcRes.data)
    if (sessRes.data) setSessions(sessRes.data)
    if (examRes.data) setExams(examRes.data)
    if (achRes.data) setAchievements(achRes.data)
    if (qnRes.data) setQuickNotes(qnRes.data)
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
    if (level >= 5) await unlockAchievement('level_5')
    if (level >= 10) await unlockAchievement('level_10')
  }, [profile, user])

  const unlockAchievement = useCallback(async (key) => {
    if (achievements.some(a => a.key === key)) return
    const { data } = await supabase.from('achievements').insert({ user_id: user.id, key }).select().single()
    if (data) setAchievements(prev => [...prev, data])
  }, [achievements, user])

  const updateSettings = useCallback(async (updates) => {
    if (!settings) return
    const merged = { ...settings, ...updates }
    setSettings(merged)
    await supabase.from('user_settings').update(updates).eq('user_id', user.id)
  }, [settings, user])

  const updateProfile = useCallback(async (updates) => {
    if (!profile) return
    const merged = { ...profile, ...updates }
    setProfile(merged)
    await supabase.from('profiles').update(updates).eq('user_id', user.id)
  }, [profile, user])

  return (
    <AppContext.Provider value={{
      user, profile, subjects, tasks, notes, flashcards, sessions, exams,
      achievements, quickNotes, settings, loading,
      refresh, addXp, unlockAchievement, updateSettings, updateProfile,
    }}>
      {children}
    </AppContext.Provider>
  )
}
