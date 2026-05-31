/**
 * Парсит AI_Insider_Academy_video_lessons_updated.docx → src/data/videoLessons.js
 * Usage: npm run parse:video-lessons [path-to-docx]
 */
const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const docxPath =
  process.argv[2] ||
  path.join(process.env.HOME, 'Desktop/AI_Insider_Academy_video_lessons_updated.docx')
const outPath = path.join(__dirname, '../src/data/videoLessons.js')

if (!fs.existsSync(docxPath)) {
  console.error('DOCX not found:', docxPath)
  process.exit(1)
}

const pyScript = path.join(__dirname, 'parse-video-lessons.py')
const json = execFileSync('python3', [pyScript, docxPath], { encoding: 'utf-8' })
const courses = JSON.parse(json)

const HELPERS = `
export function getVideoLessons(courseId) {
  return VIDEO_LESSONS_BY_COURSE[courseId] || null
}

const LESSON_PREFIX = {
  'ai-user-pro': 'up',
  'ai-content-creator': 'cc',
  'no-code-automation': 'nc',
  'ai-chatbot-developer': 'cb',
  'ai-voice-developer': 'vd',
  'ai-agent-architect': 'aa',
  'ai-agency-builder': 'agb',
}

export function buildLessonsFromVideos(courseId) {
  const data = VIDEO_LESSONS_BY_COURSE[courseId]
  if (!data?.lessons?.length) return null
  const prefix = LESSON_PREFIX[courseId] || courseId.slice(0, 2)
  return data.lessons.map((v) => {
    const isCapstone = v.number === data.lessons.length && /финальный проект/i.test(v.title)
    return {
      id: \`\${prefix}v\${v.number}\`,
      title: v.title,
      titleEn: v.title,
      duration: v.duration || '40–50 мин',
      durationEn: v.duration || '40–50 min',
      videoUrl: '',
      week: v.week,
      videoNumber: v.number,
      weekGoal: v.goal,
      weekGoalEn: v.goal,
      weekOutcome: v.result,
      weekOutcomeEn: v.result,
      weekSkills: v.topics ? v.topics.split(';').map((s) => s.trim()).filter(Boolean) : [],
      weekSkillsEn: v.topics ? v.topics.split(';').map((s) => s.trim()).filter(Boolean) : [],
      lessonTopics: v.topics,
      lessonTools: v.tools,
      lessonDemo: v.demo,
      hwTasks: v.homework ? [v.homework] : [],
      hwTasksEn: v.homework ? [v.homework] : [],
      hwDeliverables: v.result ? [v.result] : [],
      hwDeliverablesEn: v.result ? [v.result] : [],
      hwCriteria: v.criteria ? [v.criteria] : [],
      hwCriteriaEn: v.criteria ? [v.criteria] : [],
      hwCapstone: isCapstone,
      hwCapstoneTitle: isCapstone ? v.title : undefined,
      hwCapstoneTitleEn: isCapstone ? v.title : undefined,
    }
  })
}

export function buildWeeksFromVideos(courseId) {
  const data = VIDEO_LESSONS_BY_COURSE[courseId]
  if (!data?.weeks?.length) return null
  return data.weeks.map((w) => {
    const homework =
      w.number === 8 && data.lessons?.length
        ? {
            capstone: true,
            title: data.lessons[data.lessons.length - 1]?.title,
            tasks: [],
            deliverables: [data.meta?.finalResult].filter(Boolean),
            criteria: [data.lessons[data.lessons.length - 1]?.criteria].filter(Boolean),
          }
        : null
    const lastInWeek = data.lessons.filter((l) => l.week === w.number).pop()
    const hw =
      lastInWeek && (lastInWeek.homework || lastInWeek.criteria)
        ? {
            tasks: lastInWeek.homework ? [lastInWeek.homework] : [],
            tasksEn: lastInWeek.homework ? [lastInWeek.homework] : [],
            deliverables: lastInWeek.result ? [lastInWeek.result] : [],
            deliverablesEn: lastInWeek.result ? [lastInWeek.result] : [],
            criteria: lastInWeek.criteria ? [lastInWeek.criteria] : [],
            criteriaEn: lastInWeek.criteria ? [lastInWeek.criteria] : [],
          }
        : homework
    return { ...w, homework: hw }
  })
}
`

const content =
  '/** Video lessons from DOCX — videoUrl заполняется позже */\n' +
  `export const VIDEO_LESSONS_BY_COURSE = ${JSON.stringify(courses, null, 2)}\n` +
  HELPERS

fs.writeFileSync(outPath, content, 'utf-8')
console.log('Wrote', outPath, '— courses:', Object.keys(courses).length)
