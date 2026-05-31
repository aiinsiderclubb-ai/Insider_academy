/** Домашние задания, критерии проверки и итоговые проекты Pro-курсов */

function hw(tasks, tasksEn, deliverables, deliverablesEn, criteria, criteriaEn, extra = {}) {
  return { tasks, tasksEn, deliverables, deliverablesEn, criteria, criteriaEn, ...extra }
}

export const ACADEMY_GRADING_STANDARD = {
  ru: {
    title: 'Стандарт проверки AI Insider Academy',
    levels: [
      { name: 'Выполнено', desc: 'Задание сдано, структура есть, результат можно открыть и проверить.' },
      { name: 'Хорошо', desc: 'Задание выполнено полностью, результат логичный, есть практическое применение, студент понимает, что сделал.' },
      { name: 'Отлично', desc: 'Результат можно показать клиенту или использовать в проекте; аккуратная структура, самостоятельные улучшения, понятна бизнес-ценность.' },
    ],
  },
  en: {
    title: 'AI Insider Academy grading standard',
    levels: [
      { name: 'Complete', desc: 'Assignment submitted, structure present, result can be opened and reviewed.' },
      { name: 'Good', desc: 'Fully completed, logical result, practical application, student understands what they built.' },
      { name: 'Excellent', desc: 'Result is client-ready or project-ready; clean structure, own improvements, clear business value.' },
    ],
  },
}

export const HOMEWORK_BY_COURSE = {
  'ai-user-pro': {
    1: hw(
      ['Протестировать минимум 5 AI-инструментов', 'Описать, для каких задач подходит каждый', 'Выбрать 3 инструмента для постоянного использования', 'Создать личную таблицу AI Toolkit'],
      ['Test at least 5 AI tools', 'Describe what each tool is best for', 'Pick 3 tools for regular use', 'Create a personal AI Toolkit table'],
      ['Таблица с инструментами', 'Категории: текст, поиск, визуал, документы, продуктивность', 'Краткое описание каждого инструмента', 'Личный вывод: какие инструменты оставляете'],
      ['Tool table', 'Categories: text, search, visual, docs, productivity', 'Short description per tool', 'Personal takeaway: tools you keep'],
      ['Минимум 5 инструментов', 'Каждый привязан к конкретной задаче', 'Понятно, зачем нужен каждый сервис', 'Нет хаотичного списка без структуры'],
      ['At least 5 tools', 'Each tied to a specific task', 'Clear why each service is needed', 'Structured, not a random list']
    ),
    2: hw(
      ['Создать библиотеку из минимум 15 промптов: 3 для текста, 3 для анализа, 3 для планирования, 3 для идей, 3 для работы/учёбы'],
      ['Build a library of at least 15 prompts: 3 text, 3 analysis, 3 planning, 3 ideas, 3 work/study'],
      ['База в Notion, Google Docs или Sheets', 'У каждого промпта: название, задача, промпт, пример результата'],
      ['Database in Notion, Google Docs or Sheets', 'Each prompt: name, task, prompt text, sample output'],
      ['Промпты не слишком короткие', 'Есть роль, контекст, задача и формат', 'Протестировано минимум 5 промптов', 'Улучшенная версия минимум 3 промптов'],
      ['Prompts are not too short', 'Role, context, task, and format included', 'At least 5 prompts tested', 'Improved version of at least 3 prompts']
    ),
    3: hw(
      ['Создать 5 AI-шаблонов: план дня, план недели, разбор большой задачи, подготовка к встрече, анализ недели'],
      ['Create 5 AI templates: daily plan, weekly plan, big task breakdown, meeting prep, weekly review'],
      ['Готовые шаблоны', 'Инструкция, когда использовать', 'Пример использования каждого'],
      ['Ready templates', 'When-to-use instructions', 'Example use for each'],
      ['Шаблоны можно использовать повторно', 'Реально помогают организовать задачи', 'Протестировано минимум 2 шаблона на реальных задачах'],
      ['Templates are reusable', 'They actually organize tasks', 'At least 2 tested on real tasks']
    ),
    4: hw(
      ['Сделать мини-исследование на выбранную тему'],
      ['Complete a mini-research project on a chosen topic'],
      ['Тема и цель', 'Основные вопросы', 'Найденная информация', 'Сравнение вариантов', 'Выводы и рекомендации'],
      ['Topic and goal', 'Key questions', 'Findings', 'Option comparison', 'Conclusions and recommendations'],
      ['Понятная структура', 'Выводы не случайные', 'Сравнение минимум 2–3 вариантов', 'Факты отделены от предположений'],
      ['Clear structure', 'Conclusions are reasoned', 'Compare at least 2–3 options', 'Facts separated from assumptions']
    ),
    5: hw(
      ['Создать текстовый пакет: деловое письмо, пост, описание услуги, сообщение клиенту, инструкция/чек-лист'],
      ['Create a text pack: business email, post, service description, client message, guide/checklist'],
      ['5 готовых текстов в одном документе или папке'],
      ['5 finished texts in one doc or folder'],
      ['Единый понятный стиль', 'Нет «роботного» AI-языка', 'Тексты можно реально использовать', 'Финальная ручная редактура'],
      ['Consistent clear style', 'No robotic AI tone', 'Texts are usable as-is', 'Final manual edit done']
    ),
    6: hw(
      ['Создать визуальный пакет: 3 AI-изображения, 1 обложка, 1 баннер, мини-презентация 5–7 слайдов'],
      ['Create visual pack: 3 AI images, 1 cover, 1 banner, 5–7 slide mini-deck'],
      ['Изображения и обложка', 'Баннер', 'Презентация со структурой слайдов'],
      ['Images and cover', 'Banner', 'Presentation with slide outline'],
      ['Визуалы связаны одной темой', 'Понятный стиль', 'Изображения не случайные', 'Презентация не перегружена текстом'],
      ['Visuals share one theme', 'Clear style', 'Images feel intentional', 'Deck is not text-heavy']
    ),
    7: hw(
      ['Создать карту AI-внедрения для работы или бизнеса'],
      ['Create an AI adoption map for work or business'],
      ['Список процессов', 'Проблема каждого', 'AI-решение и инструменты', 'Ожидаемый результат', 'Экономия времени'],
      ['Process list', 'Problem per process', 'AI solution and tools', 'Expected outcome', 'Time saved'],
      ['Минимум 5 процессов', 'AI решает задачу, а не «ради AI»', 'Понятная польза', 'Можно объяснить, зачем внедрять'],
      ['At least 5 processes', 'AI solves a real problem', 'Clear benefit', 'Can explain why to adopt']
    ),
    8: hw(
      [],
      [],
      ['AI Toolkit', 'Библиотека промптов', 'Шаблоны продуктивности', 'Шаблоны текстов', 'Процесс исследования', 'Визуальный пакет', 'Карта AI-внедрения'],
      ['AI Toolkit', 'Prompt library', 'Productivity templates', 'Text templates', 'Research workflow', 'Visual pack', 'AI adoption map'],
      ['Система собрана и структурирована', 'Все блоки связаны', 'Можно показать на защите'],
      ['System is assembled and structured', 'All blocks connected', 'Ready to present'],
      { capstone: true, title: 'Personal AI Operating System', titleEn: 'Personal AI Operating System',
        defense: ['Как использует систему', 'Какие задачи ускоряет', 'Какие инструменты выбрал', 'Какие шаблоны создал', 'Какой результат получил'],
        defenseEn: ['How you use the system', 'Tasks it speeds up', 'Tools chosen', 'Templates created', 'Results achieved'] }
    ),
  },
  'ai-content-creator': {
    1: hw(
      ['Создать основу контент-проекта: ниша, аудитория, позиционирование, tone of voice, 5–7 рубрик, 30 тем'],
      ['Build content foundation: niche, audience, positioning, tone of voice, 5–7 rubrics, 30 topics'],
      ['Документ с фундаментом проекта'],
      ['Project foundation document'],
      ['Ниша понятна', 'Аудитория описана конкретно', 'Рубрики не дублируют друг друга', 'Темы можно превратить в публикации'],
      ['Niche is clear', 'Audience is specific', 'Rubrics don’t overlap', 'Topics are publishable']
    ),
    2: hw(
      ['Создать 10 хуков, 5 постов, 5 сценариев коротких видео, контент-план на 30 дней'],
      ['Create 10 hooks, 5 posts, 5 short video scripts, 30-day content plan'],
      ['Файл с хуками, постами, сценариями', 'Контент-календарь на месяц'],
      ['Hooks, posts, scripts file', 'Monthly content calendar'],
      ['Хуки цепляют внимание', 'Посты не одинаковые', 'Сценарии подходят для коротких видео', 'План сбалансирован по рубрикам'],
      ['Hooks grab attention', 'Posts vary in format', 'Scripts fit short video', 'Plan balanced across rubrics']
    ),
    3: hw(
      ['Создать визуальный стиль: moodboard, палитра, 3 обложки, 5 визуалов, 3 шаблона Canva'],
      ['Create visual style: moodboard, palette, 3 covers, 5 visuals, 3 Canva templates'],
      ['Moodboard и палитра', 'Обложки и визуалы', 'Canva-шаблоны'],
      ['Moodboard and palette', 'Covers and visuals', 'Canva templates'],
      ['Визуалы как один бренд', 'Нет визуального хаоса', 'Шаблоны переиспользуемы', 'Стиль подходит теме'],
      ['Visuals feel like one brand', 'No visual chaos', 'Templates reusable', 'Style fits the topic']
    ),
    4: hw(
      ['Создать 3 коротких видео: образовательное, экспертное, продающее/прогревающее'],
      ['Create 3 short videos: educational, expert, sales/warm-up'],
      ['3 готовых или почти готовых ролика', 'Сценарии к каждому'],
      ['3 finished or near-finished clips', 'Script for each'],
      ['У каждого видео есть хук', 'Ролик не затянут', 'Понятная мысль', 'Готово к публикации'],
      ['Each video has a hook', 'Not too long', 'Clear message', 'Publication-ready']
    ),
    5: hw(
      ['Создать серию из 7 коротких видео'],
      ['Create a series of 7 short videos'],
      ['7 тем, 7 сценариев, 7 хуков', 'Визуальный стиль', 'План публикации'],
      ['7 topics, 7 scripts, 7 hooks', 'Visual style', 'Publishing plan'],
      ['Серия связана одной идеей', 'Ролики не повторяют друг друга', 'Логика публикации понятна', 'Каждый ролик можно снять/сгенерировать'],
      ['Series shares one idea', 'Videos don’t repeat', 'Clear publishing logic', 'Each clip is producible']
    ),
    6: hw(
      ['Создать AI Content Machine'],
      ['Build an AI Content Machine'],
      ['База идей', 'Статусы контента', 'Шаблоны промптов', 'Контент-календарь', 'Процесс от идеи до публикации'],
      ['Idea bank', 'Content statuses', 'Prompt templates', 'Content calendar', 'Idea-to-publish workflow'],
      ['Система понятна', 'Можно добавлять идеи', 'Виден этап каждого материала', 'Процесс повторяется еженедельно'],
      ['System is clear', 'New ideas can be added', 'Stage of each piece is visible', 'Process repeats weekly']
    ),
    7: hw(
      ['Создать контент-воронку'],
      ['Build a content funnel'],
      ['Лид-магнит', '5 прогревающих постов', '3 продающих поста', 'CTA', 'Путь подписчика до заявки'],
      ['Lead magnet', '5 warm-up posts', '3 sales posts', 'CTA', 'Subscriber path to application'],
      ['Оффер понятен', 'Контент не агрессивно продаёт', 'Есть логика прогрева', 'Понятно, что делает подписчик'],
      ['Offer is clear', 'Content isn’t overly pushy', 'Warm-up logic exists', 'Clear subscriber action']
    ),
    8: hw([], [],
      ['Позиционирование', 'Аудитория', 'Рубрики', 'Контент-план', 'Визуальный стиль', '10 постов', '7 видео', 'Воронка', 'Система производства'],
      ['Positioning', 'Audience', 'Rubrics', 'Content plan', 'Visual style', '10 posts', '7 videos', 'Funnel', 'Production system'],
      ['Бренд собран целиком', 'Готов к регулярным публикациям'],
      ['Brand fully assembled', 'Ready for regular publishing'],
      { capstone: true, title: 'AI Content Brand', titleEn: 'AI Content Brand',
        defense: ['Какой бренд создан', 'Кому он нужен', 'Какой контент публикует', 'Как создаёт материалы регулярно', 'Как контент ведёт к заявкам/продажам'],
        defenseEn: ['Brand created', 'Who it serves', 'Content to publish', 'Regular production process', 'Path to leads/sales'] }
    ),
  },
  'no-code-automation': {
    1: hw(
      ['Выбрать один реальный процесс и описать его'],
      ['Pick one real process and document it'],
      ['Название', 'Входные данные', 'Действия', 'Участники', 'Инструменты', 'Ручные шаги', 'Точки автоматизации'],
      ['Name', 'Inputs', 'Actions', 'Stakeholders', 'Tools', 'Manual steps', 'Automation points'],
      ['Процесс понятен', 'Шаги последовательны', 'Видно, где теряется время', 'Минимум 3 точки автоматизации'],
      ['Process is clear', 'Steps are sequential', 'Time waste is visible', 'At least 3 automation points']
    ),
    2: hw(
      ['Создать workflow: форма → Google Sheets → Telegram-уведомление'],
      ['Build workflow: form → Google Sheets → Telegram notification'],
      ['Скриншот или экспорт n8n workflow', 'Тестовая строка в таблице'],
      ['n8n workflow screenshot or export', 'Test row in spreadsheet'],
      ['Данные из формы попадают в таблицу', 'Telegram получает уведомление', 'Поля передаются корректно', 'Workflow можно повторно запустить'],
      ['Form data lands in sheet', 'Telegram gets notification', 'Fields mapped correctly', 'Workflow rerunnable']
    ),
    3: hw(
      ['Добавить условия в workflow (IF-логика, минимум 2 ветки)'],
      ['Add conditions to workflow (IF logic, at least 2 branches)'],
      ['Обновлённый workflow с ветвлением', 'Примеры тестов для каждой ветки'],
      ['Updated workflow with branching', 'Test examples per branch'],
      ['Есть IF-логика', 'Минимум 2 ветки', 'Данные фильтруются корректно', 'Ошибки не ломают процесс'],
      ['IF logic present', 'At least 2 branches', 'Data filtered correctly', 'Errors don’t break the flow']
    ),
    4: hw(
      ['Подключить внешний сервис через API (HTTP Request)'],
      ['Connect an external service via API (HTTP Request)'],
      ['GET или POST', 'Endpoint, headers, body', 'Ответ используется в workflow', 'Тестовый пример'],
      ['GET or POST', 'Endpoint, headers, body', 'Response used downstream', 'Test example'],
      ['API-запрос работает', 'Понимание endpoint/headers/body', 'Ответ используется дальше', 'Есть тест'],
      ['API call works', 'Understands endpoint/headers/body', 'Response used downstream', 'Test included']
    ),
    5: hw(
      ['Создать AI-обработку заявки: категория, приоритет, summary, запись, уведомление'],
      ['Build AI lead processing: category, priority, summary, save, notify'],
      ['Workflow с AI-блоком', 'Пример структурированного ответа AI'],
      ['Workflow with AI block', 'Sample structured AI output'],
      ['AI возвращает структурированный результат', 'Категории понятны', 'Результат в таблице', 'Уведомление с summary'],
      ['AI returns structured output', 'Categories are clear', 'Result saved to sheet', 'Notification includes summary']
    ),
    6: hw(
      ['Создать автоматизацию для одного отдела (продажи, маркетинг, поддержка, HR, контент)'],
      ['Build automation for one department (sales, marketing, support, HR, content)'],
      ['Workflow минимум 5 шагов', 'Интеграция с таблицей/CRM', 'Уведомление', 'AI или условия'],
      ['Workflow with 5+ steps', 'Sheet/CRM integration', 'Notification', 'AI or conditions'],
      ['Решает реальную задачу', 'Минимум 5 шагов', 'Есть интеграция', 'Есть уведомление и логика'],
      ['Solves a real problem', 'At least 5 steps', 'Integration present', 'Notification and logic included']
    ),
    7: hw(
      ['Улучшить workflow: ошибки, логирование, fallback, именование nodes, документация'],
      ['Improve workflow: errors, logging, fallback, node naming, documentation'],
      ['Обновлённый workflow', 'Таблица логов', 'Документ «как работает»'],
      ['Updated workflow', 'Log table', 'How-it-works doc'],
      ['Ошибки не ломают процесс', 'Есть логи', 'Понятно, что делает каждый node', 'Другой человек разберётся'],
      ['Errors don’t break flow', 'Logs exist', 'Each node is clear', 'Another person can understand it']
    ),
    8: hw([], [],
      ['Схема процесса', 'n8n workflow', 'AI-блок', 'Sheets/CRM', 'Telegram/email', 'Обработка ошибок', 'Логирование', 'Документация', 'Demo'],
      ['Process diagram', 'n8n workflow', 'AI block', 'Sheets/CRM', 'Telegram/email', 'Error handling', 'Logging', 'Documentation', 'Demo'],
      ['Система рабочая и задокументирована'],
      ['System works and is documented'],
      { capstone: true, title: 'Business Automation System', titleEn: 'Business Automation System',
        defense: ['Какую проблему решает', 'Как работало вручную', 'Как работает сейчас', 'Какие инструменты', 'Что при ошибке', 'Бизнес-результат'],
        defenseEn: ['Problem solved', 'Manual process before', 'How it works now', 'Tools used', 'Error behavior', 'Business outcome'] }
    ),
  },
  'ai-chatbot-developer': {
    1: hw(
      ['Создать концепцию чатбота: ниша, цель, аудитория, сценарии, карта диалога, данные, бизнес-результат'],
      ['Create chatbot concept: niche, goal, audience, scenarios, dialog map, data, business outcome'],
      ['Документ концепции', 'Карта диалогов'],
      ['Concept doc', 'Dialog map'],
      ['Бот решает конкретную задачу', 'Сценарии понятны', 'Есть fallback', 'Есть передача менеджеру'],
      ['Bot solves a specific task', 'Scenarios are clear', 'Fallback exists', 'Manager handoff planned']
    ),
    2: hw(
      ['Создать Telegram-бота: приветствие, меню, сбор имени и контакта, сохранение, уведомление админу'],
      ['Build Telegram bot: greeting, menu, name/contact capture, save, admin notification'],
      ['Рабочий бот', 'Скриншоты диалога', 'Пример сохранённых данных'],
      ['Working bot', 'Dialog screenshots', 'Sample saved data'],
      ['Бот работает в Telegram', 'Данные сохраняются', 'Админ получает уведомление', 'Пользователь понимает следующий шаг'],
      ['Bot works in Telegram', 'Data is saved', 'Admin gets notification', 'User knows next step']
    ),
    3: hw(
      ['Подключить AI: системный промпт, роль, ограничения, fallback'],
      ['Connect AI: system prompt, role, constraints, fallback'],
      ['Системный промпт', 'Примеры 5–10 диалогов'],
      ['System prompt', '5–10 sample dialogs'],
      ['Есть системный промпт', 'Ответы в нужном стиле', 'Не слишком длинные', 'Fallback для непонятных вопросов'],
      ['System prompt exists', 'Replies match style', 'Not too long', 'Fallback for unclear questions']
    ),
    4: hw(
      ['Добавить память: user ID, имя, история, статус, персональный ответ'],
      ['Add memory: user ID, name, history, status, personalized replies'],
      ['Таблица/БД профилей', 'Пример повторного диалога'],
      ['Profile table/DB', 'Repeat user dialog example'],
      ['Узнаёт повторного пользователя', 'Использует сохранённые данные', 'Обновляет профиль', 'Не путает пользователей'],
      ['Recognizes returning user', 'Uses saved data', 'Updates profile', 'Doesn’t mix users']
    ),
    5: hw(
      ['Создать бота по FAQ или документу'],
      ['Build bot from FAQ or document'],
      ['Подготовленная база знаний', 'Примеры ответов по материалам'],
      ['Prepared knowledge base', 'Sample answers from materials'],
      ['База подготовлена', 'Ответы по материалам', 'Fallback если ответа нет', 'Ответы пригодны для клиентов'],
      ['KB prepared', 'Answers from materials', 'Fallback when no answer', 'Client-ready replies']
    ),
    6: hw(
      ['Подключить бота к таблице/CRM: заявка, статус, уведомление, summary, follow-up'],
      ['Connect bot to sheet/CRM: lead, status, notification, summary, follow-up'],
      ['Workflow интеграции', 'Пример заявки в таблице'],
      ['Integration workflow', 'Sample lead in sheet'],
      ['Заявка не теряется', 'Менеджер получает понятное уведомление', 'Данные структурированы', 'Клиент получает подтверждение'],
      ['Lead not lost', 'Manager gets clear alert', 'Structured data', 'Client gets confirmation']
    ),
    7: hw(
      ['Создать коммерческий сценарий: продажи, поддержка, запись, консультант или FAQ'],
      ['Build commercial scenario: sales, support, booking, consultant, or FAQ'],
      ['Полный сценарий с ветками', 'Обработка возражений/сложных вопросов'],
      ['Full scenario with branches', 'Objection/complex question handling'],
      ['Сценарий ведёт к результату', 'Есть передача человеку', 'Измеримый бизнес-результат'],
      ['Scenario drives to outcome', 'Human handoff exists', 'Measurable business result']
    ),
    8: hw([], [],
      ['Telegram/web-бот', 'AI-ответы', 'Промпт', 'Память', 'База знаний', 'Заявки', 'CRM/таблица', 'Уведомления', 'Follow-up', 'Документация'],
      ['Telegram/web bot', 'AI replies', 'Prompt', 'Memory', 'Knowledge base', 'Leads', 'CRM/sheet', 'Notifications', 'Follow-up', 'Documentation'],
      ['Коммерческий бот готов к демо'],
      ['Commercial bot ready to demo'],
      { capstone: true, title: 'Commercial AI Chatbot', titleEn: 'Commercial AI Chatbot',
        defense: ['Кому нужен бот', 'Какую задачу решает', 'Путь пользователя', 'Где сохраняются данные', 'Как использует AI', 'Как бизнес получает результат'],
        defenseEn: ['Who needs the bot', 'Problem solved', 'User journey', 'Where data is stored', 'How AI is used', 'Business outcome'] }
    ),
  },
  'ai-voice-developer': {
    1: hw(
      ['Выбрать нишу и описать голосового агента'],
      ['Pick a niche and describe the voice agent'],
      ['Ниша', 'Проблема бизнеса', 'Тип звонка', 'Задача агента', 'Данные', 'Результат после звонка'],
      ['Niche', 'Business problem', 'Call type', 'Agent task', 'Data collected', 'Post-call outcome'],
      ['Реальный бизнес-кейс', 'Конкретная задача', 'Понятная цель звонка', 'Результат можно передать в систему'],
      ['Real business case', 'Specific task', 'Clear call goal', 'Outcome can feed a system']
    ),
    2: hw(
      ['Создать voice personality: имя, стиль, тон, правила, приветствие, запрещённые и fallback-фразы'],
      ['Create voice personality: name, style, tone, rules, greeting, banned and fallback phrases'],
      ['Документ voice personality'],
      ['Voice personality document'],
      ['Звучит естественно', 'Ответы короткие', 'Стиль подходит бизнесу', 'Правила для сложных ситуаций'],
      ['Sounds natural', 'Short replies', 'Style fits business', 'Rules for hard situations']
    ),
    3: hw(
      ['Создать полный сценарий звонка с fallback и передачей человеку'],
      ['Create full call script with fallback and human handoff'],
      ['Сценарий с ветками', 'Обработка отказов'],
      ['Script with branches', 'Objection handling'],
      ['Логичный сценарий', 'Вопросы не перегружают', 'Есть обработка отказов', 'Корректное завершение'],
      ['Logical script', 'Questions not overwhelming', 'Objections handled', 'Clean call closing']
    ),
    4: hw(
      ['Собрать первого голосового агента с базовым сценарием и summary'],
      ['Build first voice agent with basic scenario and summary'],
      ['Рабочий агент', 'Запись или transcript тестового разговора'],
      ['Working agent', 'Recording or test transcript'],
      ['Проходит базовый сценарий', 'Не отвечает слишком длинно', 'Собирает данные', 'Summary соответствует разговору'],
      ['Passes basic scenario', 'Not too verbose', 'Collects data', 'Summary matches conversation']
    ),
    5: hw(
      ['Подключить номер или тестовый звонок'],
      ['Connect phone number or test call environment'],
      ['Тестовый звонок', 'Transcript или summary', 'Сохранённый результат'],
      ['Test call', 'Transcript or summary', 'Saved outcome'],
      ['Звонок проходит успешно', 'Агент отвечает', 'Данные доступны после звонка', 'Transcript/summary сохраняется'],
      ['Call succeeds', 'Agent responds', 'Post-call data available', 'Transcript/summary saved']
    ),
    6: hw(
      ['Связать voice agent с n8n: webhook, summary, таблица, уведомление, follow-up'],
      ['Connect voice agent to n8n: webhook, summary, sheet, notification, follow-up'],
      ['n8n workflow', 'Пример данных после звонка'],
      ['n8n workflow', 'Sample post-call data'],
      ['Данные не теряются', 'n8n получает webhook', 'Результат сохраняется', 'Уведомления работают'],
      ['Data not lost', 'n8n receives webhook', 'Result saved', 'Notifications work']
    ),
    7: hw(
      ['Упаковать voice agent как услугу: ниша, проблема, решение, цена, demo'],
      ['Package voice agent as a service: niche, problem, solution, price, demo'],
      ['One-page offer', 'Demo-сценарий'],
      ['One-page offer', 'Demo scenario'],
      ['Услуга понятна бизнесу', 'Описана польза', 'Есть цена и demo', 'Можно отправить клиенту'],
      ['Service clear to business', 'Benefit described', 'Price and demo included', 'Sendable to client']
    ),
    8: hw([], [],
      ['Voice personality', 'Сценарий', 'Рабочий agent', 'Телефония/тест', 'Summary', 'CRM/таблица', 'Уведомления', 'Follow-up', 'Коммерческое описание'],
      ['Voice personality', 'Script', 'Working agent', 'Telephony/test', 'Summary', 'CRM/sheet', 'Notifications', 'Follow-up', 'Commercial description'],
      ['Voice employee готов к демо и продаже'],
      ['Voice employee ready to demo and sell'],
      { capstone: true, title: 'AI Voice Employee', titleEn: 'AI Voice Employee',
        defense: ['Как проходит звонок', 'Какие данные собирает', 'Куда передаются', 'Какую задачу решает', 'Как продавать клиенту'],
        defenseEn: ['How the call flows', 'Data collected', 'Where it goes', 'Business task solved', 'How to sell to clients'] }
    ),
  },
  'ai-agent-architect': {
    1: hw(
      ['Создать концепцию AI-агента: роль, цель, задачи, вход/выход, автономность, ограничения, риски'],
      ['Create AI agent concept: role, goal, tasks, I/O, autonomy, constraints, risks'],
      ['Документ концепции агента'],
      ['Agent concept document'],
      ['Агент выполняет задачу, а не просто отвечает', 'Понятная цель', 'Есть ограничения', 'Понятно, где полезен'],
      ['Agent executes tasks, not just replies', 'Clear goal', 'Constraints defined', 'Use case is clear']
    ),
    2: hw(
      ['Создать агента с одним внешним действием (таблица, Telegram, email, API, статус заявки)'],
      ['Build agent with one external action (sheet, Telegram, email, API, lead status)'],
      ['Агент с tool/action', 'Лог результата действия'],
      ['Agent with tool/action', 'Action result log'],
      ['Выполняет реальное действие', 'Действие ограничено', 'Есть лог', 'Понимание human approval'],
      ['Performs real action', 'Action is bounded', 'Log exists', 'Understands human approval']
    ),
    3: hw(
      ['Добавить память: профиль, история задач, сохранение результата, прошлый контекст'],
      ['Add memory: profile, task history, saved results, past context'],
      ['Хранилище памяти', 'Пример персонализированного ответа'],
      ['Memory storage', 'Personalized reply example'],
      ['Помнит важные данные', 'Не путает пользователей', 'Использует память в действиях', 'Память не перегружена'],
      ['Remembers key data', 'Doesn’t mix users', 'Uses memory in actions', 'Memory not cluttered']
    ),
    4: hw(
      ['Создать агента с базой знаний и ограничением «не выдумывать»'],
      ['Build agent with knowledge base and “don’t hallucinate” grounding'],
      ['Документы/FAQ', 'Примеры ответов по источникам', 'Fallback сценарий'],
      ['Docs/FAQ', 'Source-grounded answer samples', 'Fallback scenario'],
      ['Ответы по материалам', 'KB структурирована', 'Точные ответы', 'Сценарий для неизвестных вопросов'],
      ['Answers from materials', 'Structured KB', 'Accurate answers', 'Unknown-question scenario']
    ),
    5: hw(
      ['Спроектировать multi-agent систему: orchestrator + 2–4 агента'],
      ['Design multi-agent system: orchestrator + 2–4 agents'],
      ['Схема ролей', 'Схема передачи задач', 'Финальный output'],
      ['Role diagram', 'Task handoff diagram', 'Final output'],
      ['Роли не дублируются', 'Есть главный агент', 'Понятны зоны ответственности', 'Один итоговый output'],
      ['Roles don’t overlap', 'Main agent exists', 'Responsibilities clear', 'Single final output']
    ),
    6: hw(
      ['Агент выполняет задачу по шагам с planning prompt и human approval'],
      ['Agent executes task step-by-step with planning prompt and human approval'],
      ['Planning prompt', 'Список шагов', 'Пример выполнения', 'Точки approval'],
      ['Planning prompt', 'Step list', 'Execution example', 'Approval checkpoints'],
      ['Не действует хаотично', 'Понятный план', 'Есть контроль', 'Важные действия с подтверждением'],
      ['Not chaotic', 'Clear plan', 'Control exists', 'Critical actions need approval']
    ),
    7: hw(
      ['Описать архитектуру агентной системы для бизнеса'],
      ['Document agent system architecture for business'],
      ['Проблема', 'Роли агентов', 'Tools, память, KB', 'Интеграции', 'Риски', 'Схема', 'Ожидаемый результат'],
      ['Problem', 'Agent roles', 'Tools, memory, KB', 'Integrations', 'Risks', 'Diagram', 'Expected outcome'],
      ['Решает реальную задачу', 'Архитектура понятна', 'Есть ограничения безопасности', 'Польза объяснима бизнесу'],
      ['Solves real problem', 'Architecture is clear', 'Security constraints', 'Business value explainable']
    ),
    8: hw([], [],
      ['Orchestrator', '2–4 агента', 'Tools/actions', 'Память', 'KB', 'Workflow', 'Human approval', 'Логи', 'Документация', 'Demo'],
      ['Orchestrator', '2–4 agents', 'Tools/actions', 'Memory', 'KB', 'Workflow', 'Human approval', 'Logs', 'Documentation', 'Demo'],
      ['Агентный отдел работает и задокументирован'],
      ['Agent department works and is documented'],
      { capstone: true, title: 'AI Agent Department', titleEn: 'AI Agent Department',
        defense: ['Как агенты взаимодействуют', 'Какую задачу выполняет система', 'Какие tools', 'Где память', 'Как контролируются действия', 'Бизнес-результат'],
        defenseEn: ['How agents interact', 'System task', 'Tools used', 'Where memory lives', 'Action control', 'Business outcome'] }
    ),
  },
  'ai-agency-builder': {
    1: hw(
      ['Выбрать нишу: 10 болей клиентов, 5 AI-решений, 20 потенциальных клиентов, обоснование выбора'],
      ['Pick niche: 10 client pains, 5 AI solutions, 20 prospects, rationale'],
      ['Документ выбора ниши', 'Список 20 клиентов'],
      ['Niche selection doc', 'List of 20 prospects'],
      ['Ниша не слишком широкая', 'Боли реальные', 'AI-решения связаны с болью', 'Есть первые клиенты'],
      ['Niche not too broad', 'Pains are real', 'AI solutions match pains', 'Prospects listed']
    ),
    2: hw(
      ['Создать продуктовую линейку: entry, core, premium, monthly support'],
      ['Create product line: entry, core, premium, monthly support'],
      ['3 уровня услуг', 'Цены и сроки', 'Описание результата'],
      ['3 service tiers', 'Prices and timelines', 'Outcome descriptions'],
      ['Услуги понятны бизнесу', 'Понятно, за что платят', 'Минимум 3 уровня', 'Есть поддержка/подписка'],
      ['Services clear to business', 'Payment value clear', 'At least 3 tiers', 'Support/subscription included']
    ),
    3: hw(
      ['Создать коммерческое предложение и краткую презентацию'],
      ['Create commercial proposal and short service deck'],
      ['КП: заголовок, боль, решение, состав, сроки, цена, следующий шаг', 'Презентация услуги'],
      ['Proposal: headline, pain, solution, scope, timeline, price, next step', 'Service deck'],
      ['КП не перегружено', 'Польза без жаргона', 'Конкретный следующий шаг', 'Можно отправить клиенту'],
      ['Proposal not overloaded', 'Value without jargon', 'Clear next step', 'Sendable to client']
    ),
    4: hw(
      ['Создать систему поиска клиентов: 50 лидов с персонализацией и follow-up'],
      ['Build client acquisition system: 50 leads with personalization and follow-up'],
      ['Таблица 50 лидов', '3 шаблона сообщений', '2 follow-up', 'План daily outreach'],
      ['50-lead sheet', '3 message templates', '2 follow-ups', 'Daily outreach plan'],
      ['Лиды реальные', 'Сообщения персонализированы', 'Есть статусы', 'Есть план outreach'],
      ['Leads are real', 'Messages personalized', 'Statuses tracked', 'Outreach plan exists']
    ),
    5: hw(
      ['Создать sales kit: скрипт звонка, 10 вопросов, 10 возражений, follow-up, презентация'],
      ['Build sales kit: call script, 10 questions, 10 objections, follow-up, deck'],
      ['Sales kit документ'],
      ['Sales kit document'],
      ['Вопросы выявляют боль', 'Ответы на возражения уверенные', 'Follow-up не давит', 'Может объяснить цену'],
      ['Questions surface pain', 'Objection replies confident', 'Follow-up not pushy', 'Can explain price']
    ),
    6: hw(
      ['Создать delivery system: onboarding, ТЗ, этапы, QA, передача проекта'],
      ['Build delivery system: onboarding, brief, phases, QA, handoff'],
      ['Onboarding-анкета', 'Checklist доступов', 'Шаблон ТЗ', 'Этапы', 'QA checklist', 'Handoff template'],
      ['Onboarding form', 'Access checklist', 'Brief template', 'Phases', 'QA checklist', 'Handoff template'],
      ['Процесс понятен клиенту', 'Контроль ожиданий', 'Критерии готовности', 'Передача без хаоса'],
      ['Process clear to client', 'Expectations managed', 'Done criteria', 'Handoff without chaos']
    ),
    7: hw(
      ['Создать операционную систему: процессы, шаблоны, retainer, кейсы, отзывы, портфолио'],
      ['Build operations: processes, templates, retainer, cases, reviews, portfolio'],
      ['Список процессов', 'Retainer-предложение', 'Шаблон кейса и отзыва', 'Структура портфолио'],
      ['Process list', 'Retainer offer', 'Case and review templates', 'Portfolio structure'],
      ['Повторяемые процессы', 'Поддержка как услуга', 'Кейсы после проектов', 'Не зависит от хаоса'],
      ['Repeatable processes', 'Support as a service', 'Cases after projects', 'Not dependent on chaos']
    ),
    8: hw([], [],
      ['Ниша', 'Позиционирование', 'Линейка', 'Оффер', 'КП', 'Презентация', '50 лидов', 'Outreach', 'Sales kit', 'Delivery', 'Retainer', 'План 30 дней'],
      ['Niche', 'Positioning', 'Product line', 'Offer', 'Proposal', 'Deck', '50 leads', 'Outreach', 'Sales kit', 'Delivery', 'Retainer', '30-day plan'],
      ['Агентство готово к запуску'],
      ['Agency ready to launch'],
      { capstone: true, title: 'AI Agency Launch Kit', titleEn: 'AI Agency Launch Kit',
        defense: ['Ниша', 'Услуги', 'Кому продаёт', 'Как ищет клиентов', 'Как продаёт', 'Как выполняет', 'Повторная выручка'],
        defenseEn: ['Niche', 'Services', 'Target clients', 'Acquisition', 'Sales process', 'Delivery', 'Recurring revenue'] }
    ),
  },
}

export function getHomework(courseId, weekNumber) {
  return HOMEWORK_BY_COURSE[courseId]?.[weekNumber] || null
}

export const DEFAULT_LESSON_HOMEWORK = {
  tasks: ['Повторите практическую демонстрацию из видео на своей теме/нише'],
  tasksEn: ['Repeat the practical demo from the video in your own niche/topic'],
  deliverables: ['Сохраните результат и добавьте в папку итогового проекта курса'],
  deliverablesEn: ['Save the result and add it to your course capstone folder'],
  criteria: ['Результат открыт, понятен и применим на практике; можно объяснить связь с финальным проектом'],
  criteriaEn: ['Result is clear, practical, and linked to the capstone project'],
}

function homeworkHasContent(hw) {
  if (!hw) return false
  return Boolean(
    hw.capstone
    || hw.tasks?.length
    || hw.deliverables?.length
    || hw.criteria?.length
    || hw.defense?.length
  )
}

function packHomeworkFromLesson(lesson) {
  return {
    tasks: lesson.hwTasks,
    tasksEn: lesson.hwTasksEn,
    deliverables: lesson.hwDeliverables,
    deliverablesEn: lesson.hwDeliverablesEn,
    criteria: lesson.hwCriteria,
    criteriaEn: lesson.hwCriteriaEn,
    capstone: lesson.hwCapstone,
    title: lesson.hwCapstoneTitle,
    titleEn: lesson.hwCapstoneTitleEn,
    defense: lesson.hwDefense,
    defenseEn: lesson.hwDefenseEn,
  }
}

export function getHomeworkForLesson(lesson, course = null) {
  if (!lesson) return null

  const fromLesson = packHomeworkFromLesson(lesson)
  if (homeworkHasContent(fromLesson)) return fromLesson

  if (lesson.week && course?.id) {
    const weekHw = getHomework(course.id, lesson.week)
    if (homeworkHasContent(weekHw)) return weekHw
  }

  const paidOrHw =
    course?.hasHomework
    || (course?.priceEur ?? 0) > 0
    || (course?.price ?? 0) > 0

  if (paidOrHw) return { ...DEFAULT_LESSON_HOMEWORK }

  return null
}

export function mergeHomeworkIntoWeeks(courseId, weeks) {
  return weeks.map((w) => {
    const homework = getHomework(courseId, w.number)
    return homework ? { ...w, homework } : w
  })
}
