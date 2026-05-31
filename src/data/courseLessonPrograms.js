/** Структурированные программы уроков — синхрон с витриной insiderai.it.com */

const SHORT = { ru: '10–20 мин', en: '10–20 min' }
const PRO = { ru: '30–45 мин', en: '30–45 min' }

function lesson(num, titleRu, titleEn, descRu, descEn) {
  return { num, titleRu, titleEn, descRu, descEn }
}

export const LESSON_PROGRAMS = {
  'ai-start': {
    duration: SHORT,
    countLabel: { ru: '7 уроков (10–20 минут)', en: '7 lessons (10–20 min)' },
    lessons: [
      lesson(1, 'Что такое AI и почему он меняет мир', 'What AI is and why it changes the world', 'Изучаем основы искусственного интеллекта, возможности и реальные кейсы.', 'AI fundamentals, capabilities and real-world use cases.'),
      lesson(2, 'Знакомство с ChatGPT', 'Getting started with ChatGPT', 'Создание первых запросов и работа с AI.', 'Writing your first prompts and working with AI.'),
      lesson(3, 'Claude, Gemini и Perplexity', 'Claude, Gemini and Perplexity', 'Обзор лучших AI-инструментов 2026 года.', 'Overview of the best AI tools in 2026.'),
      lesson(4, 'Как правильно общаться с AI', 'How to communicate with AI effectively', 'Основы Prompt Engineering.', 'Prompt Engineering fundamentals.'),
      lesson(5, 'AI для работы и учебы', 'AI for work and study', 'Практические сценарии использования.', 'Practical use cases.'),
      lesson(6, 'Как заработать на AI', 'How to earn with AI', 'Популярные способы монетизации навыков.', 'Popular ways to monetize AI skills.'),
      lesson(7, 'План развития AI-специалиста', 'AI specialist development plan', 'Построение личной дорожной карты обучения.', 'Building your personal learning roadmap.'),
    ],
  },
  'ai-for-productivity': {
    duration: SHORT,
    countLabel: { ru: '4 урока (10–20 минут)', en: '4 lessons (10–20 min)' },
    lessons: [
      lesson(1, 'AI как личный помощник', 'AI as a personal assistant', 'Автоматизация ежедневных задач.', 'Automating daily tasks.'),
      lesson(2, 'AI для работы и бизнеса', 'AI for work and business', 'Создание документов, писем и отчетов.', 'Creating documents, emails and reports.'),
      lesson(3, 'AI для обучения', 'AI for learning', 'Быстрое изучение новых навыков.', 'Learning new skills faster.'),
      lesson(4, 'Личная AI-система продуктивности', 'Personal AI productivity system', 'Собираем собственный стек инструментов.', 'Building your own tool stack.'),
    ],
  },
  'first-automation-n8n': {
    duration: SHORT,
    countLabel: { ru: '5 уроков (10–20 минут)', en: '5 lessons (10–20 min)' },
    lessons: [
      lesson(1, 'Что такое автоматизация', 'What automation is', 'Логика работы автоматизаций.', 'How automations work.'),
      lesson(2, 'Интерфейс n8n', 'n8n interface', 'Создание первого workflow.', 'Building your first workflow.'),
      lesson(3, 'Telegram + AI', 'Telegram + AI', 'Создаем первого Telegram-бота.', 'Building your first Telegram bot.'),
      lesson(4, 'AI Agent в n8n', 'AI Agent in n8n', 'Подключаем ChatGPT к автоматизации.', 'Connecting ChatGPT to your automation.'),
      lesson(5, 'Финальный проект', 'Capstone project', 'Создаем полноценную автоматизацию.', 'Building a complete automation.'),
    ],
  },
  'ai-user-pro': {
    duration: PRO,
    countLabel: { ru: '10 уроков (30–45 минут)', en: '10 lessons (30–45 min)' },
    meta: {
      price: '19€',
      finalResult: 'Собственная AI-система: инструменты, промпты, шаблоны и рабочие процессы.',
    },
    lessons: [
      lesson(1, 'Современная AI-экосистема', 'Modern AI ecosystem', 'Полный обзор рынка AI.', 'Full overview of the AI market.'),
      lesson(2, 'ChatGPT Mastery', 'ChatGPT Mastery', 'Продвинутые техники работы.', 'Advanced techniques.'),
      lesson(3, 'Claude Mastery', 'Claude Mastery', 'Работа с большими проектами.', 'Working on large projects.'),
      lesson(4, 'Gemini и Google AI', 'Gemini and Google AI', 'Интеграция с экосистемой Google.', 'Integration with the Google ecosystem.'),
      lesson(5, 'Perplexity и AI Research', 'Perplexity and AI Research', 'Поиск и анализ информации.', 'Search and information analysis.'),
      lesson(6, 'Prompt Engineering', 'Prompt Engineering', 'Создание профессиональных промптов.', 'Creating professional prompts.'),
      lesson(7, 'AI для бизнеса', 'AI for business', 'Практическое применение.', 'Practical business applications.'),
      lesson(8, 'AI для продаж', 'AI for sales', 'Автоматизация коммуникаций.', 'Automating communications.'),
      lesson(9, 'Личный AI стек', 'Personal AI stack', 'Настройка рабочего пространства.', 'Setting up your workspace.'),
      lesson(10, 'Финальный проект', 'Capstone project', 'Создание собственной AI-системы.', 'Building your own AI system.'),
    ],
  },
  'ai-content-creator': {
    duration: PRO,
    countLabel: { ru: '8 уроков (30–45 минут)', en: '8 lessons (30–45 min)' },
    meta: {
      price: '25€',
      finalResult: 'Полноценная контент-система: тексты, визуал, видео и план публикаций.',
    },
    lessons: [
      lesson(1, 'AI-контент в 2026 году', 'AI content in 2026', 'Современные возможности.', 'Modern capabilities.'),
      lesson(2, 'Создание текстов', 'Creating copy', 'ChatGPT и Claude для контента.', 'ChatGPT and Claude for content.'),
      lesson(3, 'AI-дизайн', 'AI design', 'Canva, Midjourney, Flux.', 'Canva, Midjourney, Flux.'),
      lesson(4, 'Генерация видео', 'Video generation', 'Runway, Kling, Veo.', 'Runway, Kling, Veo.'),
      lesson(5, 'Shorts и Reels', 'Shorts and Reels', 'Создание вирусных видео.', 'Creating viral short-form video.'),
      lesson(6, 'Контент-планирование', 'Content planning', 'Автоматизация публикаций.', 'Automating publishing.'),
      lesson(7, 'Личный бренд', 'Personal brand', 'Создание экспертного образа.', 'Building an expert brand.'),
      lesson(8, 'Финальный проект', 'Capstone project', 'Полноценная контент-система.', 'Full content system.'),
    ],
  },
}

const LESSON_PREFIX = {
  'ai-start': 'as',
  'ai-for-productivity': 'ap',
  'first-automation-n8n': 'fn',
  'ai-user-pro': 'up',
  'ai-content-creator': 'cc',
}

function toVideoLesson(entry, courseLabel, duration) {
  const isCapstone = /финальный проект|capstone/i.test(entry.titleRu)
  return {
    number: entry.num,
    week: Math.min(Math.ceil(entry.num / 2), 5),
    title: `Урок ${entry.num}. ${entry.titleRu}`,
    titleEn: `Lesson ${entry.num}. ${entry.titleEn}`,
    duration: duration.ru.replace('–', '-').replace('мин', 'минут'),
    goal: entry.descRu,
    goalEn: entry.descEn,
    topics: entry.descRu,
    topicsEn: entry.descEn,
    demo: `Практическая демонстрация темы «${entry.titleRu}» в рамках курса ${courseLabel}.`,
    tools: 'ChatGPT, Claude, профильные инструменты урока.',
    result: isCapstone ? entry.descRu : 'Практический результат для итогового проекта курса.',
    homework: 'Повторить практику на своей теме и сохранить результат.',
    criteria: 'Результат понятен, применим на практике и связан с финальным проектом.',
  }
}

export function buildCatalogLessons(courseId) {
  const program = LESSON_PROGRAMS[courseId]
  const prefix = LESSON_PREFIX[courseId] || courseId.slice(0, 2)
  if (!program) return null
  return program.lessons.map((entry) => ({
    id: `${prefix}${entry.num}`,
    title: `Урок ${entry.num}. ${entry.titleRu}`,
    titleEn: `Lesson ${entry.num}. ${entry.titleEn}`,
    description: entry.descRu,
    descriptionEn: entry.descEn,
    duration: program.duration.ru,
    durationEn: program.duration.en,
    videoUrl: '',
  }))
}

export function buildVideoLessonBlock(courseId, courseLabel) {
  const program = LESSON_PROGRAMS[courseId]
  if (!program?.meta) return null
  const count = program.lessons.length
  return {
    meta: {
      price: program.meta.price,
      videoCount: count,
      videoDuration: `${program.duration.ru}, рандомно внутри диапазона.`,
      finalResult: program.meta.finalResult,
    },
    lessons: program.lessons.map((entry) => toVideoLesson(entry, courseLabel, program.duration)),
  }
}

export function getLessonCountLabel(courseId, lang = 'ru') {
  const program = LESSON_PROGRAMS[courseId]
  if (!program) return null
  return lang === 'en' ? program.countLabel.en : program.countLabel.ru
}
