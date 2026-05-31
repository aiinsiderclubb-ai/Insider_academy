/** Структурированные программы уроков — Academy LMS */

import { getVideoLessons } from './videoLessons.js'

const SHORT = { ru: '10–20 мин', en: '10–20 min' }
const PRO = { ru: '30–45 мин', en: '30–45 min' }
const LONG = { ru: '40–50 мин', en: '40–50 min' }

function lesson(num, titleRu, titleEn, descRu, descEn) {
  return { num, titleRu, titleEn, descRu, descEn }
}

function shortDescFromVideo(v) {
  if (v.topics) {
    const first = v.topics.split(';').map((s) => s.trim()).filter(Boolean)[0]
    if (first && first.length <= 120) return first
  }
  if (v.goal && v.goal.length <= 100) return v.goal
  return `Практический урок: ${v.title}.`
}

function buildProgramFromVideos(courseId, duration = LONG) {
  const data = getVideoLessons(courseId)
  if (!data?.lessons?.length) return null
  const count = data.lessons.length
  return {
    duration,
    countLabel: {
      ru: `${count} видеоуроков`,
      en: `${count} video lessons`,
    },
    lessons: data.lessons.map((v) => {
      const titleRu = String(v.title || '').replace(/^(Урок|Video)\s+\d+\.\s*/i, '').trim() || v.title
      const titleEn = String(v.titleEn || v.title || titleRu)
        .replace(/^(Lesson|Video)\s+\d+\.\s*/i, '').trim() || titleRu
      const desc = shortDescFromVideo(v)
      return lesson(v.number, titleRu, titleEn, desc, desc)
    }),
  }
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

  'ai-insider-accelerator': {
    duration: PRO,
    countLabel: { ru: '12 уроков · intake', en: '12 lessons · intake' },
    lessons: [
      lesson(1, 'Карта AI-индустрии 2026', 'AI industry map 2026', 'Обзор рынка и ключевых направлений.', 'Market overview and key tracks.'),
      lesson(2, 'AI для контента и маркетинга', 'AI for content and marketing', 'Как AI меняет контент и продвижение.', 'How AI transforms content and marketing.'),
      lesson(3, 'Автоматизации и n8n', 'Automations and n8n', 'Логика workflow и первые сценарии.', 'Workflow logic and first scenarios.'),
      lesson(4, 'Чат-боты для бизнеса', 'Chatbots for business', 'Где боты приносят деньги.', 'Where bots drive revenue.'),
      lesson(5, 'Голосовые AI-агенты', 'Voice AI agents', 'Сценарии voice agents в продажах и поддержке.', 'Voice agent use cases in sales and support.'),
      lesson(6, 'AI-агенты и RAG', 'AI agents and RAG', 'От чатбота к автономному агенту.', 'From chatbot to autonomous agent.'),
      lesson(7, 'Prompt Engineering Pro', 'Prompt Engineering Pro', 'Профессиональные промпты под задачи.', 'Professional prompts for real tasks.'),
      lesson(8, 'AI для продаж и лидов', 'AI for sales and leads', 'Автоматизация коммуникаций и CRM.', 'Automating comms and CRM.'),
      lesson(9, 'Монетизация AI-навыков', 'Monetizing AI skills', 'Как зарабатывать на AI-услугах.', 'How to earn from AI services.'),
      lesson(10, 'Intake-тест и анкета', 'Intake test and application', 'Диагностика уровня и целей.', 'Level and goals assessment.'),
      lesson(11, 'Выбор специализации', 'Choosing your track', 'Подбор Pro-курса под вашу цель.', 'Matching a Pro track to your goal.'),
      lesson(12, 'Финальный проект', 'Capstone project', 'Персональная AI-система для работы или бизнеса.', 'Personal AI system for work or business.'),
    ],
  },

  'ai-saas-builder': {
    duration: PRO,
    countLabel: { ru: '12 уроков', en: '12 lessons' },
    lessons: [
      lesson(1, 'Поиск SaaS-идеи с AI', 'Finding a SaaS idea with AI', 'Генерация и первичная валидация идей.', 'Idea generation and initial validation.'),
      lesson(2, 'Анализ рынка и конкурентов', 'Market and competitor analysis', 'Оценка спроса и конкурентной среды.', 'Demand and competitive landscape.'),
      lesson(3, 'Проектирование MVP', 'MVP design', 'Scope, UX и ключевые функции продукта.', 'Scope, UX and core product features.'),
      lesson(4, 'Lovable и Bolt.new', 'Lovable and Bolt.new', 'Быстрый no-code прототип интерфейса.', 'Rapid no-code UI prototype.'),
      lesson(5, 'Replit для SaaS', 'Replit for SaaS', 'Сборка логики продукта без dev-команды.', 'Building product logic without a dev team.'),
      lesson(6, 'Supabase и база данных', 'Supabase and database', 'Схема данных и хранение контента.', 'Data schema and content storage.'),
      lesson(7, 'Регистрация и auth', 'Registration and auth', 'Пользователи, профили и доступ.', 'Users, profiles and access.'),
      lesson(8, 'Подключение AI API', 'Connecting AI API', 'AI-функция внутри продукта.', 'AI feature inside the product.'),
      lesson(9, 'Stripe и подписки', 'Stripe and subscriptions', 'Оплата, тарифы и webhooks.', 'Payments, plans and webhooks.'),
      lesson(10, 'UI/UX и onboarding', 'UI/UX and onboarding', 'Путь пользователя и активация.', 'User journey and activation.'),
      lesson(11, 'Деплой в production', 'Deploy to production', 'Публикация и мониторинг.', 'Publishing and monitoring.'),
      lesson(12, 'Финальный проект', 'Capstone project', 'Запущенный AI SaaS с auth, оплатой и первыми пользователями.', 'Launched AI SaaS with auth, billing and first users.'),
    ],
  },

  'no-code-automation': {
    duration: LONG,
    countLabel: { ru: '15 уроков', en: '15 lessons' },
    lessons: [
      lesson(1, 'Что такое автоматизация и зачем она бизнесу', 'What automation is and why businesses need it', 'Разбираем, какие процессы можно автоматизировать и где бизнес быстрее всего видит результат.', 'Learn which processes can be automated and where businesses see value fastest.'),
      lesson(2, 'Как разбирать бизнес-процесс на шаги', 'How to break a business process into steps', 'Учимся раскладывать хаос клиента на понятные действия, условия, данные и результат.', 'Turn a messy client process into clear actions, conditions, data and outcomes.'),
      lesson(3, 'Выбор первого процесса для автоматизации', 'Choosing the first process to automate', 'Определяем задачу с быстрым эффектом: без лишней сложности, но с реальной пользой.', 'Choose a high-impact first automation without unnecessary complexity.'),
      lesson(4, 'Интерфейс n8n и логика workflow', 'n8n interface and workflow logic', 'Знакомимся с узлами, связями, триггерами и тем, как в n8n строится сценарий.', 'Understand nodes, connections, triggers and how workflows are built in n8n.'),
      lesson(5, 'Первая автоматизация: форма - таблица - Telegram', 'First automation: form - sheet - Telegram', 'Собираем первый рабочий сценарий: заявка попадает в таблицу и приходит уведомление.', 'Build a working flow that saves a lead to a sheet and sends a notification.'),
      lesson(6, 'Данные, JSON и expressions в n8n', 'Data, JSON and expressions in n8n', 'Понимаем, как передаются данные между шагами и как подставлять нужные значения.', 'Learn how data moves between steps and how to insert dynamic values.'),
      lesson(7, 'IF, фильтры и ветвления', 'IF, filters and branching', 'Добавляем условия: разные действия для разных заявок, клиентов и ситуаций.', 'Add conditional logic for different leads, customers and scenarios.'),
      lesson(8, 'Очистка и форматирование данных', 'Cleaning and formatting data', 'Приводим имена, телефоны, даты и сообщения к удобному виду для CRM и менеджеров.', 'Clean names, phone numbers, dates and messages for CRM and team workflows.'),
      lesson(9, 'API простыми словами и HTTP Request', 'APIs and HTTP Request in simple terms', 'Разбираем, как сервисы общаются между собой и как подключать их через HTTP Request.', 'Understand how services communicate and how to connect them with HTTP Request.'),
      lesson(10, 'Интеграция внешнего сервиса через API', 'Integrating an external service via API', 'Подключаем сторонний инструмент и учимся читать документацию без страха.', 'Connect an external tool and learn how to read API docs confidently.'),
      lesson(11, 'AI внутри workflow: summary и классификация', 'AI inside a workflow: summaries and classification', 'Добавляем AI-узел, который суммирует заявки, определяет тип обращения и помогает команде.', 'Add AI that summarizes requests, classifies intent and supports the team.'),
      lesson(12, 'AI-квалификация заявок', 'AI lead qualification', 'Настраиваем оценку лидов: приоритет, потребность, бюджет и следующий шаг.', 'Set up lead scoring by priority, need, budget and recommended next step.'),
      lesson(13, 'Автоматизация продаж, маркетинга и поддержки', 'Automating sales, marketing and support', 'Собираем практические сценарии для обработки лидов, follow-up и клиентских запросов.', 'Build practical flows for lead handling, follow-up and customer requests.'),
      lesson(14, 'Надежность: ошибки, fallback и логи', 'Reliability: errors, fallback and logs', 'Делаем автоматизацию устойчивой: обработка ошибок, резервные сценарии и контроль логов.', 'Make automations reliable with error handling, fallback paths and log checks.'),
      lesson(15, 'Финальный проект: Business Automation System', 'Final project: Business Automation System', 'Собираем законченную систему автоматизации для реального бизнес-процесса.', 'Build a complete automation system for a real business process.'),
    ],
  },

  'ai-chatbot-developer': {
    duration: LONG,
    countLabel: { ru: '15 уроков', en: '15 lessons' },
    lessons: [
      lesson(1, 'Что такое AI-чатбот и где он нужен бизнесу', 'What an AI chatbot is and where business needs it', 'Разбираем роли чатботов в продажах, поддержке, обучении и обработке заявок.', 'Explore chatbot roles in sales, support, education and lead handling.'),
      lesson(2, 'Диалоговая логика и карта сценариев', 'Dialogue logic and scenario mapping', 'Проектируем путь пользователя: вопросы, ответы, развилки и целевое действие.', 'Design the user path: questions, answers, branches and target actions.'),
      lesson(3, 'Концепция коммерческого чатбота', 'Commercial chatbot concept', 'Формулируем задачу бота, аудиторию, ценность и результат для бизнеса.', 'Define the bot goal, audience, business value and expected result.'),
      lesson(4, 'Создание Telegram-бота через BotFather', 'Creating a Telegram bot with BotFather', 'Создаем бота, получаем токен и готовим основу для подключения к автоматизации.', 'Create the bot, get a token and prepare it for automation.'),
      lesson(5, 'Подключение Telegram к n8n', 'Connecting Telegram to n8n', 'Связываем Telegram с workflow и принимаем первые сообщения пользователей.', 'Connect Telegram to a workflow and receive the first user messages.'),
      lesson(6, 'Меню, кнопки и сбор данных', 'Menus, buttons and data collection', 'Добавляем кнопки, понятную навигацию и сбор контактов без лишних вопросов.', 'Add buttons, clear navigation and frictionless contact collection.'),
      lesson(7, 'Системный промпт для AI-бота', 'System prompt for an AI bot', 'Пишем правила поведения бота: роль, тон, ограничения и формат ответа.', 'Write bot behavior rules: role, tone, boundaries and response format.'),
      lesson(8, 'Подключение AI к Telegram-боту', 'Connecting AI to a Telegram bot', 'Встраиваем AI-модель в диалог, чтобы бот отвечал живо и по задаче.', 'Add an AI model so the bot responds naturally and on task.'),
      lesson(9, 'Контроль качества ответов AI-бота', 'AI bot response quality control', 'Настраиваем проверки, ограничения и защиту от неверных или слишком длинных ответов.', 'Set checks, limits and safeguards against wrong or overly long answers.'),
      lesson(10, 'Память, user profile и персонализация', 'Memory, user profile and personalization', 'Сохраняем данные пользователя и используем контекст для более точных ответов.', 'Store user data and use context for more relevant replies.'),
      lesson(11, 'База знаний: FAQ и документы', 'Knowledge base: FAQ and documents', 'Готовим материалы, по которым бот сможет отвечать без выдумывания фактов.', 'Prepare source materials so the bot answers without inventing facts.'),
      lesson(12, 'Бот-консультант по базе знаний', 'Knowledge-base consultant bot', 'Собираем бота, который отвечает по FAQ, документам и правилам компании.', 'Build a bot that answers from FAQ, documents and company rules.'),
      lesson(13, 'CRM, заявки, уведомления и follow-up', 'CRM, leads, notifications and follow-up', 'Передаем заявки в CRM, уведомляем команду и запускаем последующие касания.', 'Send leads to CRM, notify the team and trigger follow-up actions.'),
      lesson(14, 'Чатбот для продаж и поддержки', 'Chatbot for sales and support', 'Объединяем консультацию, квалификацию и передачу клиента менеджеру.', 'Combine consultation, qualification and handoff to a manager.'),
      lesson(15, 'Финальный проект: Commercial AI Chatbot', 'Final project: Commercial AI Chatbot', 'Собираем коммерческого AI-бота с логикой, AI, базой знаний и заявками.', 'Build a commercial AI bot with logic, AI, knowledge base and lead capture.'),
    ],
  },

  'ai-voice-developer': {
    duration: LONG,
    countLabel: { ru: '15 уроков', en: '15 lessons' },
    lessons: [
      lesson(1, 'Что такое голосовой AI-агент', 'What a voice AI agent is', 'Разбираем, как голосовой агент общается, понимает задачу и помогает бизнесу.', 'Learn how a voice agent talks, understands tasks and helps businesses.'),
      lesson(2, 'Ниши и задачи для voice agents', 'Niches and tasks for voice agents', 'Выбираем сценарии, где голосовой AI экономит время и приносит деньги.', 'Choose scenarios where voice AI saves time and creates business value.'),
      lesson(3, 'Концепция голосового агента', 'Voice agent concept', 'Определяем роль агента, цель звонка, аудиторию и критерии успешного диалога.', 'Define the agent role, call goal, audience and success criteria.'),
      lesson(4, 'Voice personality: стиль, тон и правила общения', 'Voice personality: style, tone and rules', 'Настраиваем характер агента: как он звучит, что говорит и где останавливается.', 'Shape how the agent sounds, what it says and where it stops.'),
      lesson(5, 'Промпт для голосового агента', 'Prompt for a voice agent', 'Пишем промпт, который удерживает сценарий, контекст и правильный стиль речи.', 'Write a prompt that keeps the scenario, context and speaking style on track.'),
      lesson(6, 'Выбор голоса и настройка звучания', 'Choosing a voice and tuning sound', 'Подбираем голос, скорость, паузы и интонацию под бренд и задачу.', 'Choose voice, speed, pauses and intonation for the brand and use case.'),
      lesson(7, 'Сценарий входящего звонка', 'Inbound call scenario', 'Проектируем агента для приема обращений, квалификации и передачи результата.', 'Design an agent for inbound requests, qualification and result handoff.'),
      lesson(8, 'Сценарий исходящего звонка', 'Outbound call scenario', 'Собираем структуру исходящего звонка: цель, вопросы, возражения и следующий шаг.', 'Build an outbound call structure with goal, questions, objections and next step.'),
      lesson(9, 'Fallback и сложные ситуации', 'Fallbacks and difficult situations', 'Учим агента корректно реагировать на непонимание, эмоции и нестандартные ответы.', 'Teach the agent to handle confusion, emotion and unexpected replies.'),
      lesson(10, 'Создание первого voice agent', 'Creating the first voice agent', 'Собираем рабочего голосового агента и запускаем первые тестовые диалоги.', 'Build a working voice agent and run the first test conversations.'),
      lesson(11, 'Тестирование диалога и улучшение промпта', 'Testing dialogue and improving the prompt', 'Анализируем звонки, находим слабые места и улучшаем сценарий агента.', 'Analyze calls, find weak spots and improve the agent scenario.'),
      lesson(12, 'Телефония и подключение номера', 'Telephony and phone number setup', 'Подключаем номер, проверяем входящие и исходящие звонки в реальной среде.', 'Connect a phone number and test inbound and outbound calls.'),
      lesson(13, 'Voice agent + n8n + CRM', 'Voice agent + n8n + CRM', 'Передаем итоги звонка в CRM, уведомления и последующие автоматизации.', 'Send call results to CRM, notifications and follow-up automations.'),
      lesson(14, 'Коммерческий кейс и упаковка услуги', 'Commercial case and service packaging', 'Упаковываем voice agent как понятную услугу с результатом, ценой и демо.', 'Package the voice agent as a clear service with outcome, pricing and demo.'),
      lesson(15, 'Финальный проект: AI Voice Employee', 'Final project: AI Voice Employee', 'Собираем голосового AI-сотрудника для продаж, записи или поддержки клиентов.', 'Build a voice AI employee for sales, booking or customer support.'),
    ],
  },

  'ai-agent-architect': {
    duration: LONG,
    countLabel: { ru: '21 урок', en: '21 lessons' },
    lessons: [
      lesson(1, 'Чем AI-агент отличается от чатбота', 'How an AI agent differs from a chatbot', 'Понимаем разницу между ответами, действиями, инструментами и автономностью.', 'Understand the difference between replies, actions, tools and autonomy.'),
      lesson(2, 'Цикл агента: goal - plan - action - result', 'Agent loop: goal - plan - action - result', 'Разбираем базовый цикл, по которому агент ставит цель, планирует и действует.', 'Explore the core loop where an agent sets a goal, plans and acts.'),
      lesson(3, 'Концепция первого AI-агента', 'First AI agent concept', 'Выбираем задачу, роль, границы и ожидаемый результат первого агента.', 'Choose the task, role, boundaries and expected result for the first agent.'),
      lesson(4, 'Tools и Actions: как агент начинает действовать', 'Tools and Actions: how an agent starts acting', 'Подключаем действия, чтобы агент не только отвечал, но и выполнял задачи.', 'Connect actions so the agent can do tasks, not just answer.'),
      lesson(5, 'Подключение внешних действий через n8n', 'Connecting external actions through n8n', 'Связываем агента с workflow, API и бизнес-сервисами через n8n.', 'Connect the agent with workflows, APIs and business services through n8n.'),
      lesson(6, 'Безопасность tools и human approval', 'Tool safety and human approval', 'Настраиваем ограничения, подтверждения и контроль действий перед выполнением.', 'Set limits, confirmations and control before actions are executed.'),
      lesson(7, 'Виды памяти AI-агента', 'Types of AI agent memory', 'Разбираем краткосрочную, долгосрочную и проектную память агента.', 'Learn short-term, long-term and project memory for agents.'),
      lesson(8, 'Создание user profile и task history', 'Creating user profile and task history', 'Сохраняем профиль пользователя и историю задач для персонального контекста.', 'Store user profile and task history for personal context.'),
      lesson(9, 'Контекст проекта и история действий', 'Project context and action history', 'Учимся давать агенту контекст проекта, решения и выполненные шаги.', 'Provide project context, decisions and completed steps to the agent.'),
      lesson(10, 'Knowledge Base для AI-агента', 'Knowledge Base for an AI agent', 'Готовим базу знаний, чтобы агент работал с фактами и внутренними документами.', 'Prepare a knowledge base so the agent works with facts and internal docs.'),
      lesson(11, 'Агент, который отвечает по базе знаний', 'Agent that answers from a knowledge base', 'Собираем агента-консультанта, который ищет ответ в документах и объясняет его.', 'Build a consultant agent that finds answers in documents and explains them.'),
      lesson(12, 'Корпоративный AI-ассистент', 'Corporate AI assistant', 'Проектируем ассистента для команды: задачи, документы, процессы и доступы.', 'Design a team assistant for tasks, documents, processes and access.'),
      lesson(13, 'Что такое multi-agent система', 'What a multi-agent system is', 'Понимаем, когда нужен не один агент, а команда агентов с разными ролями.', 'Understand when a team of agents with different roles is needed.'),
      lesson(14, 'Проектирование команды агентов', 'Designing an agent team', 'Распределяем роли: менеджер, аналитик, исполнитель, проверяющий и координатор.', 'Split roles between manager, analyst, executor, reviewer and coordinator.'),
      lesson(15, 'Сборка простой multi-agent системы', 'Building a simple multi-agent system', 'Создаем первую систему, где несколько агентов совместно решают одну задачу.', 'Build a first system where several agents solve one task together.'),
      lesson(16, 'Planning prompt и планирование задач', 'Planning prompt and task planning', 'Пишем промпт планировщика, который разбивает большую задачу на понятные шаги.', 'Write a planner prompt that breaks a large task into clear steps.'),
      lesson(17, 'Пошаговое выполнение задач агентом', 'Step-by-step task execution by an agent', 'Настраиваем выполнение плана: шаги, проверки, результаты и переходы.', 'Set up plan execution with steps, checks, outputs and transitions.'),
      lesson(18, 'Контроль автономности и approval flow', 'Autonomy control and approval flow', 'Определяем, что агент может делать сам, а где требуется подтверждение человека.', 'Define what the agent can do alone and where human approval is required.'),
      lesson(19, 'Agent System для бизнеса', 'Agent System for business', 'Упаковываем агентную систему под реальную бизнес-задачу и измеримый результат.', 'Package an agent system for a real business task and measurable outcome.'),
      lesson(20, 'Архитектура и документация agent system', 'Agent system architecture and documentation', 'Описываем схему, роли, данные, инструменты и правила поддержки системы.', 'Document the architecture, roles, data, tools and maintenance rules.'),
      lesson(21, 'Финальный проект: AI Agent Department', 'Final project: AI Agent Department', 'Собираем отдел AI-агентов, который принимает задачи и выполняет их по процессу.', 'Build an AI agent department that accepts tasks and executes them by process.'),
    ],
  },

  'ai-agency-builder': {
    duration: LONG,
    countLabel: { ru: '21 урок', en: '21 lessons' },
    lessons: [
      lesson(1, 'Какие AI-услуги можно продавать бизнесу', 'Which AI services businesses buy', 'Разбираем востребованные AI-услуги: автоматизации, боты, контент, агенты и консалтинг.', 'Explore in-demand AI services: automations, bots, content, agents and consulting.'),
      lesson(2, 'Выбор ниши для AI-агентства', 'Choosing a niche for an AI agency', 'Находим сегмент клиентов, где есть боль, бюджет и повторяемый спрос.', 'Find a customer segment with pain, budget and repeatable demand.'),
      lesson(3, 'Анализ боли клиента и AI-решения', 'Client pain analysis and AI solution', 'Учимся переводить проблему клиента в конкретное AI-решение с понятной выгодой.', 'Translate a client problem into a concrete AI solution with clear value.'),
      lesson(4, 'Превращение навыка в услугу', 'Turning a skill into a service', 'Упаковываем технический навык в результат, который клиент готов купить.', 'Package a technical skill into an outcome a client is ready to buy.'),
      lesson(5, 'Продуктовая линейка AI-агентства', 'AI agency service product line', 'Создаем набор услуг: быстрый старт, основной продукт и долгосрочное сопровождение.', 'Create service tiers: quick start, core product and long-term support.'),
      lesson(6, 'Ценообразование AI-услуг', 'Pricing AI services', 'Считаем цену через ценность, сложность, сроки и поддержку после запуска.', 'Price services through value, complexity, timeline and post-launch support.'),
      lesson(7, 'Сильный AI-оффер', 'Strong AI offer', 'Формулируем оффер, который ясно показывает результат, срок и выгоду для бизнеса.', 'Create an offer that clearly shows outcome, timeline and business value.'),
      lesson(8, 'One-page proposal', 'One-page proposal', 'Собираем короткое предложение для клиента: проблема, решение, этапы, цена и следующий шаг.', 'Build a concise proposal: problem, solution, stages, price and next step.'),
      lesson(9, 'Мини-презентация услуги', 'Mini service presentation', 'Готовим презентацию, которая объясняет услугу без перегруза и технического шума.', 'Prepare a presentation that explains the service without technical overload.'),
      lesson(10, 'Где искать первых клиентов', 'Where to find first clients', 'Выбираем каналы: личная сеть, LinkedIn, Telegram, локальный бизнес и партнерства.', 'Choose channels: network, LinkedIn, Telegram, local business and partnerships.'),
      lesson(11, 'Персонализированный outreach', 'Personalized outreach', 'Пишем сообщения, которые цепляют конкретной болью клиента и не выглядят спамом.', 'Write messages tied to a specific client pain, not generic spam.'),
      lesson(12, 'Система лидогенерации', 'Lead generation system', 'Строим регулярный процесс поиска, контакта, follow-up и учета лидов.', 'Build a repeatable process for search, contact, follow-up and lead tracking.'),
      lesson(13, 'Discovery call', 'Discovery call', 'Проводим диагностический звонок: вопросы, выявление боли, критерии успеха и бюджет.', 'Run a discovery call with questions, pain, success criteria and budget.'),
      lesson(14, 'Презентация решения клиенту', 'Presenting the solution to a client', 'Показываем решение через бизнес-результат, демо, этапы внедрения и риски.', 'Present through business outcome, demo, implementation stages and risks.'),
      lesson(15, 'Возражения и закрытие сделки', 'Objections and closing the deal', 'Отрабатываем сомнения клиента по цене, срокам, доверию и внедрению.', 'Handle objections around price, timeline, trust and implementation.'),
      lesson(16, 'Onboarding клиента', 'Client onboarding', 'Запускаем проект: доступы, вводная встреча, ожидания, сроки и коммуникация.', 'Start the project with access, kickoff, expectations, timeline and communication.'),
      lesson(17, 'Техническое задание и этапы проекта', 'Technical brief and project stages', 'Фиксируем требования, сценарии, интеграции и план работ без лишней бюрократии.', 'Define requirements, scenarios, integrations and work plan without bureaucracy.'),
      lesson(18, 'Передача проекта клиенту', 'Project handoff to the client', 'Передаем результат: инструкция, доступы, обучение команды и правила поддержки.', 'Hand off the result with instructions, access, team training and support rules.'),
      lesson(19, 'Процессы агентства и retainer', 'Agency processes and retainer', 'Настраиваем повторяемую работу, поддержку клиентов и ежемесячные пакеты сопровождения.', 'Set repeatable delivery, client support and monthly retainer packages.'),
      lesson(20, 'Кейсы, отзывы и портфолио', 'Cases, testimonials and portfolio', 'Оформляем результаты проектов так, чтобы они продавали следующие услуги.', 'Turn project results into assets that sell the next services.'),
      lesson(21, 'Финальный проект: AI Agency Launch Kit', 'Final project: AI Agency Launch Kit', 'Собираем полный пакет запуска агентства: ниша, оффер, презентация, outreach и процесс продаж.', 'Build a full agency launch kit: niche, offer, deck, outreach and sales process.'),
    ],
  },
}

const VIDEO_COURSE_DURATIONS = {
  'no-code-automation': LONG,
  'ai-chatbot-developer': LONG,
  'ai-voice-developer': LONG,
  'ai-agent-architect': LONG,
  'ai-agency-builder': LONG,
}

let videoProgramsLoaded = false

function ensureVideoPrograms() {
  if (videoProgramsLoaded) return
  videoProgramsLoaded = true
  Object.entries(VIDEO_COURSE_DURATIONS).forEach(([courseId, duration]) => {
    if (!LESSON_PROGRAMS[courseId]) {
      const block = buildProgramFromVideos(courseId, duration)
      if (block) LESSON_PROGRAMS[courseId] = block
    }
  })
}

const LESSON_PREFIX = {
  'ai-start': 'as',
  'ai-for-productivity': 'ap',
  'first-automation-n8n': 'fn',
  'ai-insider-accelerator': 'acc',
  'ai-user-pro': 'up',
  'ai-content-creator': 'cc',
  'no-code-automation': 'nc',
  'ai-chatbot-developer': 'cb',
  'ai-voice-developer': 'vd',
  'ai-saas-builder': 'sb',
  'ai-agent-architect': 'aa',
  'ai-agency-builder': 'agb',
}

export function getLessonProgram(courseId) {
  ensureVideoPrograms()
  return LESSON_PROGRAMS[courseId] || buildProgramFromVideos(courseId) || null
}

function isPlaceholderLessons(lessons) {
  return (lessons || []).some((l) =>
    /— день \d+|— day \d+|^Неделя \d+/i.test(l?.title || '')
  )
}

export function applyLessonProgramToCourse(course) {
  const program = getLessonProgram(course?.id)
  if (!program) return course

  const catalogLessons = buildCatalogLessons(course.id)
  if (!catalogLessons?.length) return course

  const existing = course.lessons || []
  const countLabelRu = getLessonCountLabel(course.id, 'ru')
  const countLabelEn = getLessonCountLabel(course.id, 'en')

  if (isPlaceholderLessons(existing) || !existing.length) {
    return {
      ...course,
      lessons: catalogLessons,
      ...(countLabelRu ? { duration: countLabelRu, durationEn: countLabelEn } : {}),
    }
  }

  if (existing.length === catalogLessons.length) {
    return {
      ...course,
      lessons: existing.map((lesson, i) => {
        const catalog = catalogLessons[i]
        return {
          ...lesson,
          title: catalog.title,
          titleEn: catalog.titleEn,
          description: catalog.description,
          descriptionEn: catalog.descriptionEn,
          weekGoal: catalog.description,
          weekGoalEn: catalog.descriptionEn,
        }
      }),
      ...(countLabelRu ? { duration: countLabelRu, durationEn: countLabelEn } : {}),
    }
  }

  return {
    ...course,
    lessons: catalogLessons.map((catalog, i) => ({
      ...(existing[i] || {}),
      ...catalog,
    })),
    ...(countLabelRu ? { duration: countLabelRu, durationEn: countLabelEn } : {}),
  }
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
  const program = getLessonProgram(courseId)
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
  const program = getLessonProgram(courseId)
  if (!program?.countLabel) return null
  return lang === 'en' ? program.countLabel.en : program.countLabel.ru
}
