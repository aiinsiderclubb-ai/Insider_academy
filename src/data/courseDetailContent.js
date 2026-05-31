/** Контент для страниц курсов — сертификат и тексты секций */

export const CERTIFICATE_INFO = {
  ru: {
    title: 'Сертификат',
    text: 'После прохождения всех уроков и проверки финального проекта вы получите именной сертификат AI Insider Academy. Его можно добавить в LinkedIn, резюме и портфолио — подтверждение практических навыков, а не просто просмотра видео.',
    bullets: [
      'Выдаётся после завершения программы и финального проекта',
      'Проверка домашних заданий по стандартам Academy',
      'PDF + запись в личном кабинете',
      'Подходит для LinkedIn и резюме',
    ],
  },
  en: {
    title: 'Certificate',
    text: 'After completing all lessons and passing the final project review, you receive a personalized AI Insider Academy certificate — proof of practical skills, not just video views.',
    bullets: [
      'Issued after completing the program and final project',
      'Homework reviewed under Academy standards',
      'PDF + record in your account',
      'Ready for LinkedIn and your CV',
    ],
  },
}

export const TOOLS_BY_COURSE = {
  'ai-user-pro': ['ChatGPT', 'Claude', 'Gemini', 'Perplexity', 'Notion AI'],
  'ai-content-creator': ['ChatGPT', 'Claude', 'Canva', 'Midjourney', 'Runway', 'Kling'],
  'no-code-automation': ['n8n', 'ChatGPT API', 'Google Sheets', 'Telegram', 'HTTP Request'],
  'ai-chatbot-developer': ['n8n', 'OpenAI', 'Telegram', 'CRM', 'Google Docs'],
  'ai-voice-developer': ['Vapi.ai', 'ElevenLabs', 'n8n', 'Telephony', 'CRM'],
  'ai-agent-architect': ['OpenAI', 'Claude', 'Pinecone', 'CrewAI', 'LangGraph', 'n8n'],
  'ai-agency-builder': ['n8n', 'CRM', 'Notion', 'Loom', 'ChatGPT'],
  'ai-saas-builder': ['Lovable', 'Bolt.new', 'Replit', 'Supabase', 'Stripe', 'OpenAI'],
  'ai-insider-accelerator': ['ChatGPT', 'Claude', 'n8n', 'Telegram', 'Vapi', 'ElevenLabs'],
}

export const COURSE_DETAIL_SECTIONS = {
  description: { ru: 'Описание', en: 'Description' },
  audience: { ru: 'Для кого этот курс', en: 'Who is this course for' },
  skills: { ru: 'Навыки, которые вы освоите', en: 'Skills you will learn' },
  tools: { ru: 'Инструменты в курсе', en: 'Tools included' },
  certificate: { ru: 'Сертификат', en: 'Certificate information' },
  finalProject: { ru: 'Финальный проект', en: 'Final project' },
  curriculum: { ru: 'Программа курса', en: 'Course curriculum' },
  faq: { ru: 'FAQ', en: 'FAQ' },
  enroll: { ru: 'Записаться на курс', en: 'Enroll now' },
  enrollFree: { ru: 'Начать бесплатно', en: 'Start for free' },
  continue: { ru: 'Продолжить обучение', en: 'Continue learning' },
}
