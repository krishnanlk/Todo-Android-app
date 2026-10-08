/**
 * LineUp - Application Configuration
 * Easily rename the product or adjust global branding from this single source.
 */

export const APP_CONFIG = {
  name: 'LineUp',
  tagline: 'Personal Productivity Companion',
  shortName: 'LineUp',
  version: '1.0.0',
  description: 'An intelligent personal productivity companion that understands your routines, tracks missions, and converses naturally about your progress.',
  
  // Theme settings
  theme: {
    defaultMode: 'dark' as 'light' | 'dark' | 'system',
    accentColor: '#0A84FF', // iOS Electric Blue
    flowAccent: '#5E5CE6',  // iOS Indigo
    successColor: '#30D158', // iOS Green
    warningColor: '#FF9F0A', // iOS Amber
    dangerColor: '#FF453A',  // iOS Coral Red
  },

  // Routine categories
  categories: [
    { id: 'routine', name: 'Life Routine', color: '#5E5CE6', icon: 'Sun' },
    { id: 'development', name: 'Development', color: '#0A84FF', icon: 'Code' },
    { id: 'study', name: 'Study & Academic', color: '#BF5AF2', icon: 'BookOpen' },
    { id: 'work', name: 'Work & Tasks', color: '#FF9F0A', icon: 'Briefcase' },
    { id: 'health', name: 'Health & Fitness', color: '#30D158', icon: 'Activity' },
    { id: 'personal', name: 'Personal', color: '#64D2FF', icon: 'User' },
  ],

  // Default Life Flow Routines for new users
  defaultRoutines: [
    {
      id: 'routine-wakeup',
      title: 'Wake Up & Morning Flow',
      icon: '🌅',
      time: '07:00',
      durationMinutes: 45,
      daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
      category: 'routine',
      consistencyScore: 92,
    },
    {
      id: 'routine-college',
      title: 'College / Academic Sessions',
      icon: '🎓',
      time: '08:30',
      durationMinutes: 240,
      daysOfWeek: [1, 2, 3, 4, 5],
      category: 'study',
      consistencyScore: 95,
    },
    {
      id: 'routine-lunch',
      title: 'Lunch & Recharge',
      icon: '🍱',
      time: '13:00',
      durationMinutes: 45,
      daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
      category: 'routine',
      consistencyScore: 98,
    },
    {
      id: 'routine-study',
      title: 'Deep Study & DBMS Lab',
      icon: '📚',
      time: '16:30',
      durationMinutes: 90,
      daysOfWeek: [1, 2, 3, 4, 5],
      category: 'study',
      consistencyScore: 84,
    },
    {
      id: 'routine-project',
      title: 'AI Project Development',
      icon: '💻',
      time: '18:30',
      durationMinutes: 90,
      daysOfWeek: [1, 2, 3, 4, 5, 6],
      category: 'development',
      consistencyScore: 88,
    },
    {
      id: 'routine-exercise',
      title: 'Workout & Fitness',
      icon: '🏃',
      time: '20:00',
      durationMinutes: 45,
      daysOfWeek: [1, 2, 3, 4, 5, 6],
      category: 'health',
      consistencyScore: 61,
    },
    {
      id: 'routine-review',
      title: 'Daily Productivity Review',
      icon: '📖',
      time: '22:00',
      durationMinutes: 20,
      daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
      category: 'routine',
      consistencyScore: 90,
    },
    {
      id: 'routine-sleep',
      title: 'Wind Down & Sleep',
      icon: '🌙',
      time: '23:00',
      durationMinutes: 480,
      daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
      category: 'routine',
      consistencyScore: 94,
    },
  ],
};
