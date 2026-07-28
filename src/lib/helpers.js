export function xpForLevel(level) {
  return Math.floor(100 * Math.pow(level, 1.5))
}

export function levelFromXp(xp) {
  let level = 1
  let remaining = xp
  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level)
    level++
  }
  return { level, currentLevelXp: remaining, nextLevelXp: xpForLevel(level), progress: remaining / xpForLevel(level) }
}

export const XP_REWARDS = {
  task_complete: 20,
  task_hard: 35,
  pomodoro: 15,
  study_session: 10,
  daily_login: 5,
  flashcard_review: 5,
}

export const ACHIEVEMENT_DEFS = [
  { key: 'first_task', title: 'First Steps', desc: 'Complete your first task', icon: '🎯' },
  { key: 'first_session', title: 'Getting Started', desc: 'Complete a study session', icon: '📚' },
  { key: 'streak_3', title: 'On Fire', desc: '3-day study streak', icon: '🔥' },
  { key: 'streak_7', title: 'Week Warrior', desc: '7-day study streak', icon: '⚡' },
  { key: 'streak_30', title: 'Unstoppable', desc: '30-day study streak', icon: '🚀' },
  { key: 'tasks_10', title: 'Task Master', desc: 'Complete 10 tasks', icon: '✅' },
  { key: 'tasks_50', title: 'Productivity Beast', desc: 'Complete 50 tasks', icon: '💪' },
  { key: 'hours_10', title: 'Scholar', desc: 'Study 10 total hours', icon: '🎓' },
  { key: 'hours_50', title: 'Dedicated', desc: 'Study 50 total hours', icon: '📖' },
  { key: 'level_5', title: 'Rising Star', desc: 'Reach level 5', icon: '⭐' },
  { key: 'level_10', title: 'Legend', desc: 'Reach level 10', icon: '👑' },
  { key: 'pomodoro_10', title: 'Focus Master', desc: 'Complete 10 pomodoros', icon: '🍅' },
]

export function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((d - today) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  if (diff < 0) return `${Math.abs(diff)}d overdue`
  if (diff <= 7) return `In ${diff}d`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function todayStr() {
  return new Date().toISOString().split('T')[0]
}

export function getStreak(sessions) {
  if (!sessions || sessions.length === 0) return 0
  const dates = [...new Set(sessions.map(s => s.session_date))].sort().reverse()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let streak = 0
  let checkDate = new Date(today)
  for (const dateStr of dates) {
    const d = new Date(dateStr + 'T00:00:00')
    if (d.getTime() === checkDate.getTime()) {
      streak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else if (d < checkDate) {
      break
    }
  }
  return streak
}

export const PRIORITY_CONFIG = {
  high: { label: 'High', color: '#ef4444', bg: '#fee8e8' },
  medium: { label: 'Medium', color: '#f59e0b', bg: '#fef4e6' },
  low: { label: 'Low', color: '#22c55e', bg: '#e8f9ee' },
}

export const DIFFICULTY_CONFIG = {
  easy: { label: 'Easy', color: '#22c55e', bg: '#e8f9ee', xp: 15 },
  medium: { label: 'Medium', color: '#f59e0b', bg: '#fef4e6', xp: 25 },
  hard: { label: 'Hard', color: '#ef4444', bg: '#fee8e8', xp: 40 },
}

export const SUBJECT_ICONS = ['📘','🧮','⚗️','🧬','📖','🇮🇳','🇫🇷','💻','🌍','🎨','🎵','🏛️','📐','🔬','✏️','🧪']
export const SUBJECT_COLORS = ['#4f7cff','#22c55e','#f59e0b','#ec4899','#8b5cf6','#06b6d4','#ef4444','#14b8a6','#f97316','#6366f1']
export const AVATAR_OPTIONS = ['🦊','🐱','🐼','🦉','🦁','🐸','🐙','🦄','🐯','🐨','🐲','🤖','👻','🌟','🔥','🚀']

export const THEMES = {
  default: { name: 'Default', bg: '#f7f8fc', surface: '#ffffff', text: '#1a1f36', text2: '#5a6378', border: '#e2e6ef', sidebar: '#ffffff', dark: false },
  light: { name: 'Light', bg: '#f9fafb', surface: '#ffffff', text: '#111827', text2: '#6b7280', border: '#e5e7eb', sidebar: '#ffffff', dark: false },
  dark: { name: 'Dark', bg: '#0f1117', surface: '#1a1d28', text: '#e4e7ec', text2: '#8b919e', border: '#2a2e3c', sidebar: '#161822', dark: true },
  amoled: { name: 'AMOLED', bg: '#000000', surface: '#0a0a0a', text: '#e4e7ec', text2: '#8b919e', border: '#1a1a1a', sidebar: '#000000', dark: true },
  neon: { name: 'Neon', bg: '#0a0a1a', surface: '#12122a', text: '#00ff9f', text2: '#6666aa', border: '#2a2a4a', sidebar: '#0a0a1a', dark: true },
  cyberpunk: { name: 'Cyberpunk', bg: '#0d0221', surface: '#1a0b3d', text: '#ff006e', text2: '#9d4edd', border: '#3a0ca3', sidebar: '#0d0221', dark: true },
  ocean: { name: 'Ocean', bg: '#e6f0fa', surface: '#ffffff', text: '#0a3d62', text2: '#3c6382', border: '#b3d9f2', sidebar: '#d4e9f7', dark: false },
  matrix: { name: 'Matrix', bg: '#000800', surface: '#001a00', text: '#00ff00', text2: '#008800', border: '#003300', sidebar: '#000800', dark: true },
  glass: { name: 'Glass', bg: '#e8ecf4', surface: '#ffffff', text: '#1a1f36', text2: '#5a6378', border: '#d0d8e8', sidebar: '#ffffff', dark: false },
  minimal: { name: 'Minimal', bg: '#fafafa', surface: '#ffffff', text: '#1a1a1a', text2: '#999999', border: '#eaeaea', sidebar: '#ffffff', dark: false },
}
