/**
 * Структура продуктов AI Insider Academy (2026)
 * Источник правды для ID курсов, пакетов и доступа Club/Pro
 */

export const PAID_COURSE_IDS = [
  'ai-productivity-master',
  'ai-content-creator',
  'ai-automation-engineer',
  'ai-agent-engineer',
  'ai-business-builder',
]

export const FREE_COURSE_IDS = [
  'ai-start',
  'ai-for-productivity',
  'first-automation-n8n',
]

/** Не показывать в каталоге (доступ по старым покупкам через aliases) */
export const LEGACY_CATALOG_HIDDEN_IDS = [
  'ai-user-pro',
  'no-code-automation',
  'ai-conversational-systems',
  'ai-saas-builder',
  'ai-agent-architect',
  'ai-agency-builder',
]

/** Club: Productivity + Content + бесплатные; без Automation, Agent, Business */
export const CLUB_INCLUDED_PAID_IDS = [
  'ai-productivity-master',
  'ai-content-creator',
]

/** Только Pro, отдельная покупка или Business Pack */
export const PRO_ONLY_COURSE_IDS = [
  'ai-automation-engineer',
  'ai-agent-engineer',
  'ai-business-builder',
]

export const PRODUCTIVITY_MASTER_LESSONS = [
  'Введение в AI Productivity',
  'ChatGPT для ежедневной работы',
  'Claude для глубокого анализа',
  'Gemini и экосистема Google',
  'Perplexity и поиск информации',
  'Deep Research',
  'Создание эффективных промптов',
  'AI для написания писем',
  'AI для документов',
  'AI для таблиц и данных',
  'AI для встреч и саммари',
  'AI для планирования',
  'AI для продаж',
  'Персональный AI стек',
  'Финальный проект',
]

export const CONTENT_CREATOR_LESSONS = [
  'Современный AI контент',
  'ChatGPT для контента',
  'Контент-план через AI',
  'Canva AI',
  'Midjourney',
  'Flux',
  'Runway',
  'Kling',
  'Veo',
  'Shorts и Reels',
  'Автоматизация контента',
  'Финальный контент-конвейер',
]

export const AUTOMATION_ENGINEER_LESSONS = [
  'Введение в автоматизацию',
  'Установка n8n',
  'Интерфейс n8n',
  'Workflow логика',
  'Webhooks',
  'API основы',
  'Google Sheets',
  'Telegram Bot',
  'Telegram AI Bot',
  'WhatsApp Automation',
  'Email Automation',
  'CRM Integration',
  'Lead Qualification',
  'AI Support Agent',
  'Voice Agent основы',
  'ElevenLabs',
  'Vapi',
  'Retell AI',
  'Multi-Step Workflows',
  'Production Workflows',
  'Работа с клиентами',
  'Финальный проект',
]

export const AGENT_ENGINEER_LESSONS = [
  'Введение в AI Agents',
  'Архитектура агентов',
  'Tool Calling',
  'Function Calling',
  'MCP основы',
  'RAG основы',
  'Embeddings',
  'Vector Databases',
  'Pinecone',
  'Supabase Vector',
  'Knowledge Bases',
  'LangChain',
  'CrewAI',
  'LangGraph',
  'Multi-Agent Systems',
  'Memory Systems',
  'Agent Planning',
  'Production Deployment',
  'Monitoring',
  'Финальный агент',
]

export const BUSINESS_BUILDER_LESSONS = [
  'Выбор ниши',
  'AI рынок 2026',
  'Создание оффера',
  'Упаковка агентства',
  'Лендинг',
  'Кейсы',
  'Холодный аутрич',
  'LinkedIn Outreach',
  'Email Outreach',
  'Discovery Calls',
  'Продажи',
  'Закрытие клиентов',
  'Delivery',
  'Создание MVP',
  'Lovable',
  'Bolt',
  'Replit',
  'Stripe',
  'Масштабирование',
  'Финальный запуск',
]

export const FREE_PRODUCTIVITY_LESSONS = [
  'AI как личный помощник',
  'AI для работы и бизнеса',
  'AI для обучения',
  'Экономия времени с AI',
  'Личная AI-система продуктивности',
]
