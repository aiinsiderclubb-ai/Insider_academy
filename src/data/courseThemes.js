const defaultTheme = {
  accent: '#a855f7',
  accentSoft: 'rgba(168, 85, 247, 0.22)',
  gradient: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 45%, #f97316 100%)',
  heroOverlayDark: 'linear-gradient(135deg, rgba(7, 6, 15, 0.94) 0%, rgba(124, 58, 237, 0.35) 55%, rgba(249, 115, 22, 0.12) 100%)',
  heroOverlayLight: 'linear-gradient(135deg, rgba(246, 244, 255, 0.96) 0%, rgba(124, 58, 237, 0.14) 55%, rgba(249, 115, 22, 0.08) 100%)',
  icon: '🎓',
}

export const courseThemes = {
  'ai-start': { accent: '#f59e0b', accentSoft: 'rgba(245, 158, 11, 0.22)', gradient: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)', heroOverlayDark: 'linear-gradient(135deg, rgba(8,8,14,0.94) 0%, rgba(245,158,11,0.3) 100%)', heroOverlayLight: 'linear-gradient(135deg, rgba(255,251,235,0.97) 0%, rgba(245,158,11,0.15) 100%)', icon: '🚀' },
  'ai-content-machine': { accent: '#ec4899', accentSoft: 'rgba(236,72,153,0.22)', gradient: 'linear-gradient(135deg, #db2777 0%, #ec4899 100%)', heroOverlayDark: 'linear-gradient(135deg, rgba(8,8,14,0.94) 0%, rgba(236,72,153,0.35) 100%)', heroOverlayLight: 'linear-gradient(135deg, rgba(253,242,248,0.97) 0%, rgba(236,72,153,0.15) 100%)', icon: '🎬' },
  'ai-automation-business': { accent: '#22c55e', accentSoft: 'rgba(34,197,94,0.22)', gradient: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)', heroOverlayDark: 'linear-gradient(135deg, rgba(8,8,14,0.94) 0%, rgba(34,197,94,0.3) 100%)', heroOverlayLight: 'linear-gradient(135deg, rgba(240,253,244,0.97) 0%, rgba(34,197,94,0.15) 100%)', icon: '⚡' },
  'ai-insider-accelerator': { accent: '#a855f7', accentSoft: 'rgba(168,85,247,0.22)', gradient: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)', heroOverlayDark: 'linear-gradient(135deg, rgba(8,8,14,0.94) 0%, rgba(168,85,247,0.4) 100%)', heroOverlayLight: 'linear-gradient(135deg, rgba(245,243,255,0.97) 0%, rgba(168,85,247,0.18) 100%)', icon: '🏁' },
  'ai-user-pro': { accent: '#6366f1', accentSoft: 'rgba(99,102,241,0.22)', gradient: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)', heroOverlayDark: 'linear-gradient(135deg, rgba(8,8,14,0.94) 0%, rgba(99,102,241,0.35) 100%)', heroOverlayLight: 'linear-gradient(135deg, rgba(238,242,255,0.97) 0%, rgba(99,102,241,0.15) 100%)', icon: '⭐' },
  'ai-content-creator': { accent: '#ec4899', accentSoft: 'rgba(236,72,153,0.22)', gradient: 'linear-gradient(135deg, #db2777 0%, #f97316 100%)', heroOverlayDark: 'linear-gradient(135deg, rgba(8,8,14,0.94) 0%, rgba(236,72,153,0.35) 100%)', heroOverlayLight: 'linear-gradient(135deg, rgba(253,242,248,0.97) 0%, rgba(236,72,153,0.15) 100%)', icon: '✍️' },
  'no-code-automation': { accent: '#22c55e', accentSoft: 'rgba(34,197,94,0.22)', gradient: 'linear-gradient(135deg, #16a34a 0%, #06b6d4 100%)', heroOverlayDark: 'linear-gradient(135deg, rgba(8,8,14,0.94) 0%, rgba(34,197,94,0.3) 100%)', heroOverlayLight: 'linear-gradient(135deg, rgba(240,253,244,0.97) 0%, rgba(34,197,94,0.15) 100%)', icon: '🔧' },
  'ai-chatbot-developer': { accent: '#a855f7', accentSoft: 'rgba(168,85,247,0.22)', gradient: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 55%, #f97316 100%)', heroOverlayDark: 'linear-gradient(135deg, rgba(7,6,15,0.94) 0%, rgba(124,58,237,0.4) 100%)', heroOverlayLight: 'linear-gradient(135deg, rgba(246,244,255,0.97) 0%, rgba(168,85,247,0.18) 100%)', icon: '💬' },
  'ai-voice-developer': { accent: '#06b6d4', accentSoft: 'rgba(6,182,212,0.22)', gradient: 'linear-gradient(135deg, #06b6d4 0%, #7c3aed 50%, #a855f7 100%)', heroOverlayDark: 'linear-gradient(135deg, rgba(7,6,15,0.94) 0%, rgba(6,182,212,0.35) 100%)', heroOverlayLight: 'linear-gradient(135deg, rgba(236,254,255,0.97) 0%, rgba(6,182,212,0.18) 100%)', icon: '🎙️' },
  'ai-agent-architect': { accent: '#8b5cf6', accentSoft: 'rgba(139,92,246,0.22)', gradient: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 50%, #6366f1 100%)', heroOverlayDark: 'linear-gradient(135deg, rgba(8,8,14,0.94) 0%, rgba(139,92,246,0.4) 100%)', heroOverlayLight: 'linear-gradient(135deg, rgba(245,243,255,0.97) 0%, rgba(139,92,246,0.18) 100%)', icon: '🤖' },
  'ai-agency-builder': { accent: '#f43f5e', accentSoft: 'rgba(244,63,94,0.22)', gradient: 'linear-gradient(135deg, #e11d48 0%, #f43f5e 50%, #a855f7 100%)', heroOverlayDark: 'linear-gradient(135deg, rgba(8,8,14,0.94) 0%, rgba(244,63,94,0.35) 100%)', heroOverlayLight: 'linear-gradient(135deg, rgba(255,241,242,0.97) 0%, rgba(244,63,94,0.12) 100%)', icon: '🏢' },
  'ai-chatbot-engineer': {
    accent: '#6366f1',
    accentSoft: 'rgba(99, 102, 241, 0.22)',
    gradient: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 45%, #a855f7 100%)',
    heroOverlayDark: 'linear-gradient(135deg, rgba(8, 8, 14, 0.94) 0%, rgba(79, 70, 229, 0.4) 100%)',
    heroOverlayLight: 'linear-gradient(135deg, rgba(238, 242, 255, 0.97) 0%, rgba(99, 102, 241, 0.2) 100%)',
    icon: '💬',
  },
  'ai-voice-agent': {
    accent: '#06b6d4',
    accentSoft: 'rgba(6, 182, 212, 0.22)',
    gradient: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #6366f1 100%)',
    heroOverlayDark: 'linear-gradient(135deg, rgba(8, 8, 14, 0.94) 0%, rgba(6, 182, 212, 0.35) 100%)',
    heroOverlayLight: 'linear-gradient(135deg, rgba(236, 254, 255, 0.97) 0%, rgba(6, 182, 212, 0.18) 100%)',
    icon: '🎙️',
  },
  'ai-content-factory': {
    accent: '#ec4899',
    accentSoft: 'rgba(236, 72, 153, 0.22)',
    gradient: 'linear-gradient(135deg, #db2777 0%, #ec4899 50%, #f97316 100%)',
    heroOverlayDark: 'linear-gradient(135deg, rgba(8, 8, 14, 0.94) 0%, rgba(236, 72, 153, 0.35) 100%)',
    heroOverlayLight: 'linear-gradient(135deg, rgba(253, 242, 248, 0.97) 0%, rgba(236, 72, 153, 0.15) 100%)',
    icon: '🎬',
  },
  'ai-model-creator': {
    accent: '#f472b6',
    accentSoft: 'rgba(244, 114, 182, 0.22)',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #f472b6 50%, #a855f7 100%)',
    heroOverlayDark: 'linear-gradient(135deg, rgba(8, 8, 14, 0.94) 0%, rgba(244, 114, 182, 0.35) 100%)',
    heroOverlayLight: 'linear-gradient(135deg, rgba(253, 242, 248, 0.97) 0%, rgba(244, 114, 182, 0.15) 100%)',
    icon: '✨',
  },
  'ai-automation-builder': {
    accent: '#22c55e',
    accentSoft: 'rgba(34, 197, 94, 0.22)',
    gradient: 'linear-gradient(135deg, #16a34a 0%, #22c55e 50%, #06b6d4 100%)',
    heroOverlayDark: 'linear-gradient(135deg, rgba(8, 8, 14, 0.94) 0%, rgba(34, 197, 94, 0.3) 100%)',
    heroOverlayLight: 'linear-gradient(135deg, rgba(240, 253, 244, 0.97) 0%, rgba(34, 197, 94, 0.15) 100%)',
    icon: '⚡',
  },
  'ai-agent-builder': {
    accent: '#8b5cf6',
    accentSoft: 'rgba(139, 92, 246, 0.22)',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 50%, #6366f1 100%)',
    heroOverlayDark: 'linear-gradient(135deg, rgba(8, 8, 14, 0.94) 0%, rgba(139, 92, 246, 0.4) 100%)',
    heroOverlayLight: 'linear-gradient(135deg, rgba(245, 243, 255, 0.97) 0%, rgba(139, 92, 246, 0.18) 100%)',
    icon: '🤖',
  },
  'try-chatbot-basics': {
    accent: '#818cf8',
    accentSoft: 'rgba(129, 140, 248, 0.22)',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
    heroOverlayDark: 'linear-gradient(135deg, rgba(8, 8, 14, 0.94) 0%, rgba(129, 140, 248, 0.3) 100%)',
    heroOverlayLight: 'linear-gradient(135deg, rgba(238, 242, 255, 0.97) 0%, rgba(129, 140, 248, 0.15) 100%)',
    icon: '🆓',
  },
  'try-voice-basics': {
    accent: '#2dd4bf',
    accentSoft: 'rgba(45, 212, 191, 0.22)',
    gradient: 'linear-gradient(135deg, #14b8a6 0%, #2dd4bf 100%)',
    heroOverlayDark: 'linear-gradient(135deg, rgba(8, 8, 14, 0.94) 0%, rgba(45, 212, 191, 0.3) 100%)',
    heroOverlayLight: 'linear-gradient(135deg, rgba(240, 253, 250, 0.97) 0%, rgba(45, 212, 191, 0.15) 100%)',
    icon: '🆓',
  },
  'try-content-basics': {
    accent: '#fb7185',
    accentSoft: 'rgba(251, 113, 133, 0.22)',
    gradient: 'linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)',
    heroOverlayDark: 'linear-gradient(135deg, rgba(8, 8, 14, 0.94) 0%, rgba(251, 113, 133, 0.3) 100%)',
    heroOverlayLight: 'linear-gradient(135deg, rgba(255, 241, 242, 0.97) 0%, rgba(251, 113, 133, 0.15) 100%)',
    icon: '🆓',
  },
  'try-automation-basics': {
    accent: '#4ade80',
    accentSoft: 'rgba(74, 222, 128, 0.22)',
    gradient: 'linear-gradient(135deg, #22c55e 0%, #4ade80 100%)',
    heroOverlayDark: 'linear-gradient(135deg, rgba(8, 8, 14, 0.94) 0%, rgba(74, 222, 128, 0.3) 100%)',
    heroOverlayLight: 'linear-gradient(135deg, rgba(240, 253, 244, 0.97) 0%, rgba(74, 222, 128, 0.15) 100%)',
    icon: '🆓',
  },
}

export function getCourseTheme(courseId) {
  return courseThemes[courseId] || defaultTheme
}

export function getCourseThemeStyle(courseId, theme = 'dark') {
  const t = getCourseTheme(courseId)
  return {
    '--course-accent': t.accent,
    '--course-accent-soft': t.accentSoft,
    '--course-gradient': t.gradient,
    '--course-hero-overlay': theme === 'light' ? t.heroOverlayLight : t.heroOverlayDark,
  }
}
