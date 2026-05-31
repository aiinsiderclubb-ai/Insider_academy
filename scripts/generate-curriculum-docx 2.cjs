const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, LevelFormat, BorderStyle, WidthType,
  ShadingType, PageBreak, TabStopType, TabStopPosition
} = require('docx');
const fs = require('fs');
const path = require('path');

// Brand colors (AI Insider purple palette adapted for education)
const C = {
  purple: "6B21A8",
  violet: "7C3AED",
  lightPurple: "EDE9FE",
  medPurple: "DDD6FE",
  darkBg: "1E1B4B",
  accent: "F59E0B",
  green: "059669",
  blue: "2563EB",
  lightBlue: "DBEAFE",
  lightGreen: "D1FAE5",
  lightAmber: "FEF3C7",
  white: "FFFFFF",
  gray: "6B7280",
  lightGray: "F3F4F6",
  border: "C4B5FD",
  darkText: "1F2937",
};

const borders = (color = C.border) => ({
  top: { style: BorderStyle.SINGLE, size: 1, color },
  bottom: { style: BorderStyle.SINGLE, size: 1, color },
  left: { style: BorderStyle.SINGLE, size: 1, color },
  right: { style: BorderStyle.SINGLE, size: 1, color },
});

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    children: [new TextRun({ text, bold: true, size: 36, font: "Arial", color: C.darkBg })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
    children: [new TextRun({ text, bold: true, size: 28, font: "Arial", color: C.violet })],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, size: 24, font: "Arial", color: C.purple })],
  });
}

function h4(text) {
  return new Paragraph({
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, bold: true, size: 22, font: "Arial", color: C.darkText })],
  });
}

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, size: 20, font: "Arial", color: C.darkText, ...opts })],
  });
}

function pBold(text) {
  return p(text, { bold: true });
}

function bullet(text, numbering, level = 0) {
  return new Paragraph({
    numbering: { reference: numbering, level },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, size: 20, font: "Arial", color: C.darkText })],
  });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function divider(color = C.violet) {
  return new Paragraph({
    spacing: { before: 100, after: 100 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color } },
    children: [],
  });
}

function tagBadge(text, fillColor = C.lightPurple) {
  return new Paragraph({
    spacing: { before: 40, after: 40 },
    children: [
      new TextRun({ text: `  ${text}  `, size: 18, font: "Arial", color: C.purple, bold: true }),
    ],
    shading: { fill: fillColor, type: ShadingType.CLEAR },
  });
}

function infoBox(label, text, color = C.lightPurple) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [1800, 7560],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: borders(C.violet),
            width: { size: 1800, type: WidthType.DXA },
            shading: { fill: C.violet, type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: label, bold: true, size: 18, font: "Arial", color: C.white })]
            })],
          }),
          new TableCell({
            borders: borders(C.violet),
            width: { size: 7560, type: WidthType.DXA },
            shading: { fill: color, type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [new Paragraph({
              children: [new TextRun({ text, size: 20, font: "Arial", color: C.darkText })]
            })],
          }),
        ],
      }),
    ],
  });
}

function lessonBlock(num, title, duration, description, homework, bullets, hwBullets) {
  const rows = [
    new TableRow({
      children: [
        new TableCell({
          borders: borders(C.border),
          width: { size: 9360, type: WidthType.DXA },
          shading: { fill: C.medPurple, type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 160, right: 160 },
          columnSpan: 1,
          children: [new Paragraph({
            children: [
              new TextRun({ text: `Урок ${num}: ${title}`, bold: true, size: 22, font: "Arial", color: C.darkBg }),
              new TextRun({ text: `  |  ${duration}`, size: 18, font: "Arial", color: C.violet }),
            ]
          })],
        }),
      ]
    }),
    new TableRow({
      children: [
        new TableCell({
          borders: borders(C.border),
          width: { size: 9360, type: WidthType.DXA },
          shading: { fill: C.white, type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 160, right: 160 },
          children: [
            new Paragraph({ spacing: { before: 40, after: 40 }, children: [new TextRun({ text: description, size: 20, font: "Arial", color: C.darkText })] }),
            ...bullets.map(b => new Paragraph({
              numbering: { reference: "bullets", level: 0 },
              spacing: { before: 30, after: 30 },
              children: [new TextRun({ text: b, size: 19, font: "Arial", color: C.darkText })]
            })),
            new Paragraph({ spacing: { before: 60, after: 20 }, children: [new TextRun({ text: "ДЗ: " + homework, bold: true, size: 20, font: "Arial", color: C.green })] }),
            ...hwBullets.map(b => new Paragraph({
              numbering: { reference: "bullets", level: 0 },
              spacing: { before: 20, after: 20 },
              children: [new TextRun({ text: b, size: 19, font: "Arial", color: C.gray })]
            })),
          ],
        }),
      ]
    }),
  ];

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    margins: { top: 100 },
    rows,
  });
}

function spacer() {
  return new Paragraph({ spacing: { before: 60, after: 60 }, children: [] });
}

// ================== OVERVIEW TABLE ==================
function buildOverviewTable() {
  const header = new TableRow({
    tableHeader: true,
    children: ["Продукт", "Длительность", "Цена (гипотеза)", "Для кого", "Ведёт на"].map((t, i) => {
      const widths = [2800, 1200, 1400, 2000, 1960];
      return new TableCell({
        borders: borders(C.purple),
        width: { size: widths[i], type: WidthType.DXA },
        shading: { fill: C.darkBg, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 100, right: 100 },
        children: [new Paragraph({ children: [new TextRun({ text: t, bold: true, size: 18, font: "Arial", color: C.white })] })],
      });
    }),
  });

  const rows = [
    ["AI-Навигатор (групповой вводный)", "4 нед", "€149", "Абсолютный новичок", "Любой курс Блока 1", C.lightGreen],
    ["Мини-курс 1: AI за 7 дней", "1 нед", "Бесплатно", "Все", "n8n / Чат-боты / Агенты", C.lightAmber],
    ["Мини-курс 2: Автоматизации за неделю", "1 нед", "Бесплатно", "Все", "Курс по n8n/Make", C.lightAmber],
    ["Мини-курс 3: Первый AI-бот за неделю", "1 нед", "Бесплатно", "Все", "Курс по чат-ботам", C.lightAmber],
    ["Курс 1: AI-автоматизации на n8n / Make", "2 мес", "€499", "Фрилансеры, разработчики", "Курс 7: Консалтинг", C.lightPurple],
    ["Курс 2: Telegram / WhatsApp чат-боты с AI", "6 нед", "€449", "Предприниматели, разраб.", "Курс 7: Консалтинг", C.lightPurple],
    ["Курс 3: Голосовые AI-агенты", "6 нед", "€549", "Продажи, сервис", "Курс 7: Консалтинг", C.lightPurple],
    ["Курс 4: AI-агенты и мультиагентные системы", "2 мес", "€649", "Разработчики, middle", "Курс 5: SaaS", C.lightPurple],
    ["Курс 5: AI-приложения / SaaS (Vibe Coding)", "2 мес", "€599", "Предприниматели, разраб.", "Курс 7: Консалтинг", C.lightPurple],
    ["Курс 6: AI для маркетинга и контента", "6 нед", "€399", "Маркетологи, SMM", "Курс 7: Консалтинг", C.lightPurple],
    ["Курс 7: AI-консалтинг и интеграции для бизнеса", "2 мес", "€799", "Выпускники курсов, эксперты", "—", C.lightBlue],
  ];

  const dataRows = rows.map(([name, dur, price, who, leads, fill]) =>
    new TableRow({
      children: [name, dur, price, who, leads].map((text, i) => {
        const widths = [2800, 1200, 1400, 2000, 1960];
        return new TableCell({
          borders: borders(C.border),
          width: { size: widths[i], type: WidthType.DXA },
          shading: { fill, type: ShadingType.CLEAR },
          margins: { top: 60, bottom: 60, left: 100, right: 100 },
          children: [new Paragraph({ children: [new TextRun({ text, size: 18, font: "Arial", color: C.darkText })] })],
        });
      }),
    })
  );

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2800, 1200, 1400, 2000, 1960],
    rows: [header, ...dataRows],
  });
}

// ================== DOCUMENT BUILDER ==================
const children = [];

// TITLE PAGE
children.push(
  new Paragraph({
    spacing: { before: 800, after: 200 },
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "AI Insider School", bold: true, size: 64, font: "Arial", color: C.violet })],
  }),
  new Paragraph({
    spacing: { before: 100, after: 100 },
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Полная образовательная линейка 2026", size: 28, font: "Arial", color: C.gray })],
  }),
  new Paragraph({
    spacing: { before: 60, after: 600 },
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "11 продуктов · 7 платных курсов · 3 мини-курса · 1 групповой вводный", size: 22, font: "Arial", color: C.purple })],
  }),
  divider(),
  spacer(),
  h1("КАРТА ПРОДУКТОВОЙ ЛИНЕЙКИ"),
  spacer(),
  buildOverviewTable(),
  spacer(),
  p("Легенда: 🟢 групповой вводный  |  🟡 бесплатные мини-курсы  |  🟣 платные основные курсы  |  🔵 флагманский курс", { color: C.gray }),
  pageBreak(),
);

// ================== БЛОК 3: ГРУППОВОЙ AI-НАВИГАТОР ==================
children.push(
  h1("БЛОК 3 — ГРУППОВОЙ КУРС-ВВЕДЕНИЕ"),
  h2("AI-Навигатор: Найди своё направление за 4 недели"),
  spacer(),
  infoBox("Позиционирование", "Обзорный курс-дегустация: студент за 4 недели пробует все 6 AI-направлений, понимает, что ему ближе, и осознанно выбирает платный трек. Старт потоком, всё обучение — только в записи, без созвонов."),
  spacer(),
  infoBox("Аудитория", "Полные новички в AI, которые хотят разобраться «с чего начать» — предприниматели, маркетологи, фрилансеры, разработчики без опыта автоматизаций"),
  infoBox("Результат", "Студент понимает экосистему AI 2026, умеет промптить, собрал 6 мини-практик по каждому треку и прошёл профориентационный тест с рекомендацией курса"),
  infoBox("Формат", "4 недели · 2–3 урока в неделю (открываются по расписанию) · Общий чат потока в Telegram · ДЗ проверяет куратор асинхронно · Финальный тест — автоматически на платформе"),
  infoBox("Стек", "ChatGPT-5, Claude 4 Sonnet, Gemini 3 Flash, n8n (пробный), Telegram BotFather, ElevenLabs (demo), Cursor AI, Canva AI, Sora 2 demo"),
  infoBox("Цена", "€149 за поток (или бесплатно для первых 50 студентов как лид-магнит)"),
  spacer(),
  divider(),
);

// WEEK 1
children.push(
  h3("НЕДЕЛЯ 1 — Фундамент AI и промптинг"),
  p("Цель недели: понять, как работают LLM, освоить промпт-инжиниринг и настроить рабочее окружение."),
  spacer(),
);

const week1lessons = [
  {
    num: "1.1", title: "Как устроен современный AI: LLM, токены, температура",
    dur: "35 мин", day: "День 1 (понедельник)",
    desc: "Разбираем внутреннее устройство больших языковых моделей: что такое трансформеры, токены и контекстное окно. Сравниваем флагманы 2026 — GPT-5, Claude 4 Opus, Gemini 3 Ultra — по скорости, качеству и стоимости. Объясняем температуру, top-p, max_tokens на практических примерах. Настраиваем аккаунты и API-ключи. Демонстрируем разницу между бесплатными и платными моделями на реальных запросах.",
    bullets: ["Архитектура трансформера (без математики, только концепция)", "Сравнительная таблица моделей 2026", "Настройка ChatGPT-5, Claude.ai, Gemini Advanced"],
    hw: "Сравнительный тест: задай один и тот же промпт всем трём моделям, сделай скриншоты ответов и напиши 3–5 предложений о разнице. Прислать: 3 скриншота + текстовый вывод.",
    hwBullets: ["3 скриншота ответов моделей (ChatGPT-5, Claude 4, Gemini 3)", "Текстовый вывод: чем отличаются ответы"]
  },
  {
    num: "1.2", title: "Промпт-инжиниринг: от новичка до эксперта",
    dur: "50 мин", day: "День 2 (вторник)",
    desc: "Разбираем 8 техник промптинга: zero-shot, few-shot, chain-of-thought, role prompting, XML-теги, system prompt, JSON-mode, structured output. На экране собираем шаблонную библиотеку промптов для 3 бизнес-кейсов: копирайтинг, анализ данных, код-ревью. Разбираем, как правильно задавать контекст, примеры и ограничения. Тестируем промпты в Claude 4 и GPT-5 параллельно.",
    bullets: ["8 ключевых техник с примерами", "Библиотека из 10 готовых промптов", "Инструмент: PromptBase, Anthropic Prompt Library"],
    hw: "Создай 5 промптов для своей реальной задачи (работа, бизнес, учёба). Каждый промпт оформи по шаблону: Role / Task / Context / Format / Constraints. Прислать: .txt или Notion-документ с 5 промптами.",
    hwBullets: ["5 промптов в формате Role/Task/Context/Format/Constraints", "Для каждого — скриншот результата из модели"]
  },
  {
    num: "1.3", title: "AI-инструменты 2026: экосистема и выбор стека",
    dur: "40 мин", day: "День 3 (среда)",
    desc: "Обзорный урок-карта: показываем полную экосистему AI-инструментов 2026 по категориям — автоматизации, чат-боты, голос, агенты, вайб-кодинг, контент. Объясняем разницу между no-code, low-code и code-first подходами. Помогаем студенту понять, какой трек ближе по навыкам и целям. Демонстрируем 2–3 готовых AI-продукта, построенных на инструментах курса (n8n-бот, голосовой агент, SaaS-лендинг).",
    bullets: ["Карта 40+ AI-инструментов с категориями", "Матрица выбора: no-code vs low-code vs code", "3 демо готовых продуктов"],
    hw: "Заполни матрицу выбора трека: 10 вопросов о навыках и целях. Прислать: заполненный шаблон (Google Sheets / скриншот) + 2–3 предложения: 'Мне кажется, мне ближе трек X, потому что...'",
    hwBullets: ["Заполненная матрица (скриншот или ссылка)", "Текстовый вывод о предпочтительном треке"]
  },
];

week1lessons.forEach(l => {
  children.push(
    p(`📅 ${l.day}`, { color: C.gray, bold: true }),
    lessonBlock(l.num, l.title, l.dur, l.desc, l.hw, l.bullets, l.hwBullets),
    spacer(),
  );
});

// WEEK 2
children.push(
  divider(),
  h3("НЕДЕЛЯ 2 — Дегустация треков: Часть 1 (Автоматизации, Чат-боты, Голос)"),
  p("Цель недели: попробовать первые три направления, собрать мини-практику по каждому."),
  spacer(),
);

const week2lessons = [
  {
    num: "2.1", title: "Вкус автоматизаций: первая связка в n8n за 30 минут",
    dur: "45 мин", day: "День 1 (понедельник)",
    desc: "Устанавливаем n8n Cloud (бесплатный тариф) и собираем первую связку: Google Sheets → GPT-5 → Telegram-уведомление. На экране — полный процесс от регистрации до запуска. Разбираем ноды: Trigger, HTTP Request, AI Agent, Send Message. Объясняем концепцию workflow и разницу между n8n и Make. Кейс: автоматическая рассылка AI-сгенерированных советов из таблицы клиентов.",
    bullets: ["n8n Cloud setup за 5 минут", "Связка Google Sheets → GPT-5 → Telegram", "Базовые ноды: Webhook, HTTP, AI, Telegram"],
    hw: "Повтори связку: Google Sheets (5 строк данных) → GPT-5 (обработка) → Telegram (уведомление). Прислать: скриншот рабочей связки в n8n + скриншот полученного сообщения в Telegram.",
    hwBullets: ["Скриншот workflow в n8n с активными нодами", "Скриншот уведомления в Telegram"]
  },
  {
    num: "2.2", title: "Вкус чат-ботов: Telegram-бот с GPT за 20 минут",
    dur: "40 мин", day: "День 2 (вторник)",
    desc: "Через BotFather создаём бота, подключаем к n8n через Webhook. Добавляем AI-ноду с системным промптом. Бот отвечает на вопросы в рамках заданной роли. На экране — бот-FAQ для интернет-магазина: отвечает на 5 типов вопросов (доставка, возврат, оплата, наличие, контакты). Разбираем хранение контекста диалога через Memory-ноду n8n. Показываем разницу между stateless и stateful ботом.",
    bullets: ["BotFather + Webhook в n8n", "AI Agent нода с системным промптом", "Memory нода для хранения контекста"],
    hw: "Создай бота для реального кейса (своя тема). Бот должен отвечать минимум на 5 типов вопросов. Прислать: ссылку на бота (@username) + скриншот диалога с 5 разными вопросами.",
    hwBullets: ["@username бота в Telegram", "Скриншот диалога (5 вопросов + ответы)"]
  },
  {
    num: "2.3", title: "Вкус голосовых агентов: говорящий AI за 15 минут",
    dur: "35 мин", day: "День 3 (среда)",
    desc: "Регистрируемся в ElevenLabs, клонируем голос (demo). Создаём первый AI-голосовой персонаж через ElevenLabs Conversational AI. Разбираем параметры: voice, latency, interruption sensitivity, system prompt. На экране демонстрируем живой звонок с агентом — ресепшен для стоматологии: записывает на приём, отвечает на вопросы о ценах. Объясняем разницу между TTS и conversational AI. Показываем Vapi как альтернативу.",
    bullets: ["ElevenLabs Conversational AI setup", "Параметры голосового агента", "Демо: ресепшен стоматологии"],
    hw: "Настрой голосового агента в ElevenLabs для любого бизнеса (2–3 сценария диалога). Прислать: ссылку на агента + видеозапись тестового разговора (1–2 мин).",
    hwBullets: ["Ссылка на ElevenLabs агента (shareable)", "Видео тестового звонка (1–2 мин)"]
  },
];

week2lessons.forEach(l => {
  children.push(
    p(`📅 ${l.day}`, { color: C.gray, bold: true }),
    lessonBlock(l.num, l.title, l.dur, l.desc, l.hw, l.bullets, l.hwBullets),
    spacer(),
  );
});

// WEEK 3
children.push(
  divider(),
  h3("НЕДЕЛЯ 3 — Дегустация треков: Часть 2 (AI-агенты, SaaS, Контент)"),
  p("Цель недели: попробовать оставшиеся три направления и начать понимать, где будущий проект."),
  spacer(),
);

const week3lessons = [
  {
    num: "3.1", title: "Вкус AI-агентов: автономный агент с MCP",
    dur: "45 мин", day: "День 1 (понедельник)",
    desc: "Собираем простой AI-агент с тулами через Claude 4 + MCP (Model Context Protocol). Агент умеет: искать информацию в интернете, читать файлы, записывать результат. На экране — агент-исследователь: получает тему, собирает 5 источников, пишет краткий отчёт и сохраняет в Google Docs. Разбираем концепцию агентного цикла: plan → tool call → observe → next step. Объясняем разницу между чат-ботом и агентом.",
    bullets: ["MCP протокол: что это и зачем", "Claude 4 + MCP tools (web search, file)", "Агентный цикл: plan → act → observe"],
    hw: "Запусти агента-исследователя на любую тему. Прислать: скриншот логов агента (шаги + тулы) + итоговый отчёт (текст или ссылка на Google Doc).",
    hwBullets: ["Скриншот цепочки шагов агента", "Итоговый отчёт (минимум 300 слов)"]
  },
  {
    num: "3.2", title: "Вкус SaaS: лендинг AI-продукта за 30 минут",
    dur: "40 мин", day: "День 2 (вторник)",
    desc: "Используем Lovable.dev для генерации полноценного веб-приложения по текстовому описанию. На экране — создаём AI-инструмент для генерации email-рассылок: пользователь вводит тему → GPT-5 через API генерирует письмо → можно скопировать или скачать. Разбираем стек: Next.js + Anthropic API + Vercel deploy. Показываем, как Cursor AI помогает дописывать и дебажить код. Итог: рабочий деплой за 30 минут.",
    bullets: ["Lovable.dev: text-to-app", "Anthropic API подключение в браузерном приложении", "Деплой на Vercel за 2 клика"],
    hw: "Создай любое простое AI-приложение через Lovable или v0.dev. Прислать: ссылку на задеплоенный сайт + скриншот интерфейса с результатом работы AI.",
    hwBullets: ["Ссылка на задеплоенный сайт", "Скриншот рабочего интерфейса"]
  },
  {
    num: "3.3", title: "Вкус AI-контента: карусель для Instagram за 20 минут",
    dur: "40 мин", day: "День 3 (среда)",
    desc: "Используем Claude 4 для генерации контент-плана и текстов карусели (5 слайдов). Затем через Canva AI или Adobe Firefly генерируем визуалы по промптам. Собираем готовую карусель. Показываем n8n-связку автоматической генерации: тема → текст → изображения → публикация в Telegram. Разбираем Sora 2 и Runway Gen-4 для создания short-form видео. Кейс: неделя контента для B2B SaaS за 15 минут работы.",
    bullets: ["Claude 4 → структура карусели за 1 промпт", "Canva AI / Firefly для визуалов", "Sora 2 demo: видео из текста"],
    hw: "Создай карусель на 5 слайдов на любую профессиональную тему. Прислать: PDF/PNG слайдов (5 штук) + промпт, который использовал для текстов.",
    hwBullets: ["5 слайдов карусели (PDF или PNG)", "Промпт, использованный для генерации текстов"]
  },
];

week3lessons.forEach(l => {
  children.push(
    p(`📅 ${l.day}`, { color: C.gray, bold: true }),
    lessonBlock(l.num, l.title, l.dur, l.desc, l.hw, l.bullets, l.hwBullets),
    spacer(),
  );
});

// WEEK 4
children.push(
  divider(),
  h3("НЕДЕЛЯ 4 — Финальный мини-проект + профориентационный тест"),
  p("Цель недели: собрать первый осознанный AI-продукт и выбрать трек для дальнейшего обучения."),
  spacer(),
);

const week4lessons = [
  {
    num: "4.1", title: "Финальный мини-проект: выбираешь направление сам",
    dur: "60 мин", day: "День 1 (понедельник)",
    desc: "Вводный урок к финальному проекту. Студент выбирает одно из 6 направлений и получает соответствующее задание. Показываем 6 примеров финальных проектов прошлых потоков: n8n-автоматизация, Telegram-бот, голосовой агент, агент с MCP, Lovable-приложение, контент-план. Разбираем критерии оценки: работает ли продукт, решает ли реальную задачу, есть ли краткое описание (что это, для кого). На экране — куратор показывает образец сдачи в формате видеозаписи.",
    bullets: ["6 вариантов финального проекта", "Критерии оценки: working product + описание", "Формат сдачи: видеодемо 3–5 мин"],
    hw: "Сдать финальный проект до конца недели: видеозапись демо (3–5 мин), где показываешь работающий продукт + объясняешь: что делает, для кого, как сделал. Прислать: видеофайл или ссылку на Loom/YouTube (unlisted).",
    hwBullets: ["Видео-демо 3–5 минут (Loom или YouTube unlisted)", "Описание проекта в 3–5 предложениях (текст в комментарии)"]
  },
  {
    num: "4.2", title: "Профориентационный тест + рекомендация трека",
    dur: "20 мин", day: "День 3 (среда)",
    desc: "Урок-инструкция: как проходить профориентационный тест на платформе. Рассказываем логику вопросов и как интерпретировать результат. Показываем, как читать рекомендацию и что значит каждый трек. Отдельно разбираем комбинации (например, автоматизации + консалтинг = продавать услуги агентствам). В конце — специальные офферы для выпускников навигатора на платные курсы.",
    bullets: ["Логика профориентационного теста (15 вопросов)", "Как читать рекомендацию трека", "Комбинированные траектории обучения"],
    hw: "Пройти профориентационный тест на платформе. Прислать: скриншот результата + 2–3 предложения 'Согласен / не согласен с рекомендацией, потому что...'",
    hwBullets: ["Скриншот результата теста", "Личный комментарий к рекомендации (2–3 предложения)"]
  },
];

week4lessons.forEach(l => {
  children.push(
    p(`📅 ${l.day}`, { color: C.gray, bold: true }),
    lessonBlock(l.num, l.title, l.dur, l.desc, l.hw, l.bullets, l.hwBullets),
    spacer(),
  );
});

// Профтест
children.push(
  h4("ПРОФОРИЕНТАЦИОННЫЙ ТЕСТ — Логика и вопросы"),
  p("15 вопросов с весовыми коэффициентами. Каждый ответ добавляет баллы к одному из 6 треков. Трек с максимальным баллом — главная рекомендация. При разнице <10% — показываем два трека."),
  spacer(),
);

const testQuestions = [
  ["1", "Что тебе интереснее всего в работе с AI?", "Связывать сервисы (n8n) / Общаться с ботом / Слышать голос AI / Строить агентов / Кодить приложения / Создавать контент"],
  ["2", "Твой технический бэкграунд?", "Нет опыта / Базовый (Excel, Notion) / Работал с API / Пишу код / Знаю Python/JS / Full-stack"],
  ["3", "Что хочешь построить через 3 месяца?", "Автоматизацию рабочих процессов / Чат-бот для бизнеса / Голосовой агент / Умный AI-агент / SaaS-продукт / Контент-машину"],
  ["4", "Кто твой клиент или работодатель?", "Агентства/сервисные компании / E-com / Продажи и колл-центры / Разработчики / Стартапы / Медиа и инфобиз"],
  ["5", "Сколько готов вложить времени в неделю?", "2–3 часа (автоматизации) / 3–5 часов (боты) / 5–7 часов (голос) / 7–10 часов (агенты) / 10+ часов (SaaS) / 2–4 часа (контент)"],
];

testQuestions.forEach(([n, q, opts]) => {
  children.push(
    p(`Вопрос ${n}: ${q}`, { bold: true }),
    p(`Варианты: ${opts}`, { color: C.gray }),
    spacer(),
  );
});

// Куратор
children.push(
  h4("АСИНХРОННОЕ ВЗАИМОДЕЙСТВИЕ КУРАТОРА С ПОТОКОМ"),
  infoBox("SLA на ответ", "Проверка ДЗ — в течение 48 часов после дедлайна. Ответы в общем чате — в течение 24 часов в рабочие дни."),
  spacer(),
  infoBox("Форматы фидбэка", "1. Письменный комментарий в платформе (для простых ДЗ). 2. Видеоразбор в записи (3–7 мин) для сложных или популярных ошибок — публикуется в чате."),
  spacer(),
  infoBox("Правила чата", "Вопросы — в тематические ветки. Нет правильных/глупых вопросов. Скриншот + описание проблемы. Куратор не отвечает в ночное время (22:00–08:00 CET)."),
  spacer(),
  pageBreak(),
);

// ================== БЛОК 2: МИНИ-КУРСЫ ==================
children.push(
  h1("БЛОК 2 — БЕСПЛАТНЫЕ МИНИ-КУРСЫ (7 дней)"),
  p("Формат: 7 видео по 20–30 минут, без ДЗ, уроки выходят по одному в день. Цель — прогрев в платные курсы."),
  spacer(),
);

// Мини-курс 1
children.push(
  h2("Мини-курс 1: «AI за 7 дней: Старт без страха»"),
  infoBox("Обещание (лендинг)", "За 7 дней ты разберёшься в ChatGPT-5 и Claude 4, научишься промптить как профи и поймёшь, какой AI-инструмент поможет именно в твоей работе — без кода и без страха."),
  infoBox("Прогревает на", "Курс 1 (n8n-автоматизации), Курс 2 (чат-боты), Курс 4 (AI-агенты) — в зависимости от ответов в мини-квизе в финале"),
  spacer(),
);

const mini1 = [
  { day: 1, title: "Что такое ChatGPT-5 и почему все сходят с ума", desc: "Объясняем, как работает LLM за 10 минут — без математики. Разбираем, что изменилось в 2025–2026: multimodal, reasoning, агентный режим. Сравниваем ChatGPT-5, Claude 4 и Gemini 3 в двух тестах. Зритель уносит: понимание, что это инструмент, а не магия, и первый вход в ChatGPT." },
  { day: 2, title: "10 промптов, которые изменят твою работу прямо сейчас", desc: "Показываем 10 промптов для реальных задач: резюме за 5 минут, анализ конкурентов, генерация идей, ответы на email, код без программирования. Каждый промпт демонстрируется на экране. Зритель уносит: готовую библиотеку промптов для своей сферы." },
  { day: 3, title: "Claude 4 vs ChatGPT-5: что выбрать и зачем платить", desc: "Сравнение на 3 реальных задачах: написание текста, анализ таблицы, code review. Объясняем систему тарификации и когда бесплатного хватает. Показываем Claude Projects и Custom Instructions в GPT. Зритель уносит: понимание, какую модель использовать для каких задач." },
  { day: 4, title: "AI как партнёр по работе: ChatGPT в твоём рабочем потоке", desc: "Показываем реальный рабочий день с AI: утренний брифинг, анализ задач, написание писем, подготовка презентации. Используем ChatGPT-5 и плагины. Разбираем, что AI делает хорошо, а где он лажает. Зритель уносит: конкретный план интеграции AI в свой рабочий день." },
  { day: 5, title: "Gemini 3 и другие модели: что ещё существует в AI-мире", desc: "Обзор экосистемы: Google Gemini 3 Ultra, Mistral, Llama 3.3, Grok. Разбираем специализированные инструменты: Perplexity для поиска, Midjourney для картинок, ElevenLabs для голоса. Зритель уносит: карту AI-инструментов и понимание, какой для чего." },
  { day: 6, title: "Безопасность и реальность AI: мифы и правда", desc: "Разбираем главные мифы: 'AI заменит меня', 'AI всегда прав', 'AI опасен'. Объясняем галлюцинации, limits и почему нельзя слепо доверять ответам. Показываем, как верифицировать AI-контент. Зритель уносит: здоровое критическое мышление про AI." },
  { day: 7, title: "Что дальше: твой путь в AI за 60 дней", desc: "Подводим итог недели. Показываем конкретные карьерные и бизнес-треки: AI-автоматизатор, разработчик ботов, создатель контента, консультант. Демонстрируем реальные кейсы выпускников. В финале — тест из 5 вопросов 'какой трек тебе подходит' и оффер на AI-Навигатор или платный курс." },
];

mini1.forEach(({ day, title, desc }) => {
  children.push(
    p(`День ${day}: ${title}`, { bold: true }),
    p(desc, { color: C.darkText }),
    spacer(),
  );
});

children.push(
  infoBox("CTA (День 7)", "Ты только что за 7 дней прошёл путь, который большинство не делает за месяц. Следующий шаг — выбери свой трек. Присоединяйся к AI-Навигатору (старт потока через 3 дня) или сразу прыгай в платный курс со скидкой 20% по промокоду MINI1."),
  spacer(),
  divider(),
);

// Мини-курс 2
children.push(
  h2("Мини-курс 2: «Автоматизации за неделю: Первая связка без кода»"),
  infoBox("Обещание (лендинг)", "За 7 дней ты соберёшь первую рабочую автоматизацию в n8n: данные идут сами, уведомления приходят сами, задачи создаются сами. Без единой строки кода — только визуальный редактор."),
  infoBox("Прогревает на", "Курс 1: AI-автоматизации на n8n / Make"),
  spacer(),
);

const mini2 = [
  { day: 1, title: "Зачем вообще автоматизировать? ROI за 10 минут", desc: "Показываем реальный расчёт: 2 часа ручной работы в день × 250 рабочих дней = 500 часов в год. Автоматизация этого = €25 000+ экономии. Разбираем топ-5 задач, которые автоматизируют чаще всего. Зритель уносит: конкретный список задач, которые он хочет автоматизировать." },
  { day: 2, title: "n8n vs Make vs Zapier: что выбрать в 2026", desc: "Честное сравнение: цены, лимиты, количество интеграций, сложность. Показываем одну и ту же задачу в трёх инструментах. Объясняем, почему n8n выигрывает для серьёзных задач. Зритель уносит: регистрацию в n8n Cloud." },
  { day: 3, title: "Интерфейс n8n: первое знакомство без паники", desc: "Полный тур по интерфейсу: Canvas, Node Library, Credentials, Executions. Показываем, как искать ноды и подключать credentials. Собираем простейший workflow — ручной запуск → ответ. Зритель уносит: уверенность в интерфейсе n8n." },
  { day: 4, title: "Первая реальная связка: Telegram → Google Sheets", desc: "Шаг за шагом: Telegram Webhook → парсинг сообщения → запись в Google Sheets. Показываем обработку ошибок и тест-режим. Кейс: сбор лидов из Telegram-канала в таблицу. Зритель уносит: рабочую связку из двух нод." },
  { day: 5, title: "AI-нода: добавляем GPT-5 в workflow", desc: "Подключаем OpenAI/Claude API через credentials. Строим цепочку: входящий текст → GPT-5 обрабатывает → отправляем результат. Кейс: автоматическая классификация входящих заявок (горячий/тёплый/холодный лид). Зритель уносит: AI в реальной рабочей связке." },
  { day: 6, title: "Расписание и триггеры: автоматизация без кнопок", desc: "Schedule Trigger, Webhook Trigger, Email Trigger. Строим workflow, который запускается каждое утро: берёт данные из Notion, анализирует через AI, отправляет дайджест в Telegram. Зритель уносит: workflow на расписании." },
  { day: 7, title: "Итоги и финальная связка: полноценный мини-пайплайн", desc: "Собираем финальную связку из 5 нод: Schedule → Google Sheets (читаем данные) → AI обработка → фильтр → Telegram уведомление. Показываем дебаггинг и чтение логов. В финале — оффер на полный курс по n8n/Make со скидкой." },
];

mini2.forEach(({ day, title, desc }) => {
  children.push(
    p(`День ${day}: ${title}`, { bold: true }),
    p(desc, { color: C.darkText }),
    spacer(),
  );
});

children.push(
  infoBox("CTA (День 7)", "За неделю ты прошёл путь от нуля до рабочего пайплайна. Хочешь зайти глубже — научиться парсить, работать с REST API, строить сложные условия и продавать готовые связки клиентам? Жди старта курса 'AI-автоматизации на n8n / Make' — скидка 25% по промокоду MINI2."),
  spacer(),
  divider(),
);

// Мини-курс 3
children.push(
  h2("Мини-курс 3: «Свой первый AI-бот за неделю: Telegram + GPT за 7 вечеров»"),
  infoBox("Обещание (лендинг)", "За 7 дней ты запустишь своего первого Telegram-бота с AI-мозгом. Он будет отвечать на вопросы, помнить контекст и работать 24/7 — без сервера, без кода, без головной боли."),
  infoBox("Прогревает на", "Курс 2: Telegram / WhatsApp чат-боты с AI"),
  spacer(),
);

const mini3 = [
  { day: 1, title: "Почему боты — это бизнес в 2026: обзор рынка", desc: "Показываем реальные кейсы: бот поддержки снизил затраты на 60%, бот для квалификации лидов увеличил конверсию в 2 раза. Разбираем типы ботов: FAQ, продажи, поддержка, внутренний помощник. Зритель уносит: понимание бизнес-ценности бота и выбор своего кейса." },
  { day: 2, title: "BotFather и Telegram API: создаём бота за 5 минут", desc: "Шаг за шагом через BotFather: имя, username, токен. Объясняем архитектуру: Telegram API → n8n Webhook → логика → ответ. Подключаем бота к n8n. Зритель уносит: живой бот, который отвечает 'Привет'." },
  { day: 3, title: "AI-мозг для бота: подключаем Claude 4 или GPT-5", desc: "Добавляем AI Agent ноду в n8n. Пишем системный промпт: роль бота, ограничения, стиль общения. Тестируем бота на 10 типах вопросов. Разбираем, как промпт влияет на качество ответов. Зритель уносит: бота с AI-мозгом и настроенным промптом." },
  { day: 4, title: "Память бота: чтобы он не забывал, о чём говорили", desc: "Подключаем Memory ноду (In-Memory или Redis). Показываем разницу: бот без памяти vs с памятью. Кейс: бот-ассистент, который помнит имя пользователя, его запросы и предпочтения. Зритель уносит: бота с контекстом разговора." },
  { day: 5, title: "Команды и кнопки: делаем бота удобным", desc: "Добавляем /start, /help, /reset команды. Встраиваем inline-кнопки через n8n. Строим простое меню. Кейс: бот для онлайн-школы с меню: расписание / FAQ / поддержка. Зритель уносит: бота с полноценным UX." },
  { day: 6, title: "База знаний: бот, который знает всё о твоём бизнесе", desc: "Подключаем Google Docs или Notion как базу знаний через n8n. Бот ищет ответ сначала в базе, потом у AI. Показываем RAG-логику без сложного кода. Кейс: бот для интернет-магазина знает весь каталог и условия доставки. Зритель уносит: бота с кастомной базой знаний." },
  { day: 7, title: "Публикация и мониторинг: бот работает 24/7", desc: "Переводим workflow в режим production (активный Webhook). Настраиваем Error Workflow для оповещения об ошибках. Показываем логи и как их читать. Финальный кейс: полноценный бот FAQ для малого бизнеса. Оффер на полный курс по чат-ботам." },
];

mini3.forEach(({ day, title, desc }) => {
  children.push(
    p(`День ${day}: ${title}`, { bold: true }),
    p(desc, { color: C.darkText }),
    spacer(),
  );
});

children.push(
  infoBox("CTA (День 7)", "Твой первый бот работает — поздравляю! Это только 10% от того, что умеют профессиональные чат-боты: интеграция с CRM, мультиязычность, воронки продаж, WhatsApp, анализ диалогов. Хочешь всё это? Курс 'Telegram / WhatsApp чат-боты с AI' стартует через неделю — скидка 20% по промокоду MINIBOT."),
  spacer(),
  pageBreak(),
);

// ================== БЛОК 1: ПЛАТНЫЕ КУРСЫ ==================
children.push(
  h1("БЛОК 1 — ПЛАТНЫЕ КУРСЫ"),
  spacer(),
);

// ======= КУРС 1: n8n/Make =======
children.push(
  h2("Курс 1: «Мастер автоматизаций: n8n и Make с нуля до продаж»"),
  infoBox("Позиционирование", "Самый полный русскоязычный курс по n8n и Make 2026. От первой связки до продажи автоматизаций клиентам. Строим реальные пайплайны для e-com, SaaS, агентств и B2B-продаж."),
  infoBox("Аудитория", "Фрилансеры, разработчики, маркетологи, операционные менеджеры. Хотят автоматизировать свою работу или продавать автоматизации как услугу."),
  infoBox("Результат", "Умеет строить сложные n8n-workflow с AI-нодами, парсингом, REST API, webhooks, базами данных. Может брать заказы на автоматизации от €500."),
  infoBox("Уровень", "С нуля (базовое понимание API приветствуется, но не обязательно)"),
  infoBox("Стек", "n8n (self-hosted + cloud), Make.com, Airtable, PostgreSQL, Redis, OpenAI API, Claude API, Google APIs, Apify, Puppeteer, Webhook.site"),
  infoBox("Открытие уроков", "Сразу весь курс открывается при оплате. Рекомендуемый темп: 2–3 урока в неделю."),
  infoBox("Длительность", "8 недель · 24 урока · ~30 часов видео · ДЗ к каждому уроку"),
  spacer(),
);

children.push(h3("Модуль 1: Основы n8n и первые связки"));

const c1m1 = [
  { num: "1.1", title: "Архитектура n8n: canvas, ноды, credentials, executions", dur: "40 мин",
    desc: "Полный тур по интерфейсу n8n 1.x: холст, библиотека нод, управление credentials, журнал выполнений. Разбираем типы нод: Trigger, Action, Logic, Sub-workflow. Устанавливаем n8n локально через Docker и регистрируемся на n8n Cloud. Показываем разницу версий и best practices для production. Кейс на экране: собираем первый workflow — ручной триггер → HTTP Request → Set-нода → ответ.",
    bullets: ["Docker setup за 10 минут", "Типы нод и их роли", "n8n Cloud vs self-hosted: когда что выбирать"],
    hw: "Установи n8n локально через Docker (или зарегистрируйся на Cloud). Собери workflow: Webhook → JSON-ответ. Прислать: скриншот рабочего workflow + результат вызова Webhook через Postman/curl.",
    hwBullets: ["Скриншот workflow", "Скриншот ответа на Webhook-вызов"]
  },
  { num: "1.2", title: "Trigger-ноды: Schedule, Webhook, Email, Form", dur: "45 мин",
    desc: "Разбираем все способы запустить workflow: по расписанию (cron), по HTTP-запросу, по email, через форму, по событию в сервисе. На экране строим 4 workflow с разными триггерами. Объясняем разницу между sync и async webhook. Показываем n8n Form Trigger — создаём форму без кода. Кейс: форма для сбора заявок → уведомление в Telegram + запись в Notion.",
    bullets: ["Cron-синтаксис: 5 примеров", "Sync vs Async Webhook", "Form Trigger: бесплатный аналог Typeform"],
    hw: "Создай workflow с Form Trigger: форма (имя, email, сообщение) → запись в Google Sheets → уведомление в Telegram. Прислать: ссылку на форму + скриншот записи в таблице.",
    hwBullets: ["Ссылка на активную форму n8n", "Скриншот записи в Google Sheets"]
  },
  { num: "1.3", title: "Работа с данными: JSON, Set, Code, IF-ноды", dur: "50 мин",
    desc: "Глубокий разбор работы с данными: структура JSON-объектов в n8n, dot-notation для доступа к полям, выражения {{ $json.field }}. Code-нода: JavaScript для трансформаций данных. IF-нода: ветвления и условия. Switch-нода: мультиветвление. На экране — обработчик заявок: парсим поля, классифицируем по условию, маршрутизируем в разные ветки.",
    bullets: ["n8n expressions: полный синтаксис", "Code-нода: 5 частых операций", "IF vs Switch: когда что применять"],
    hw: "Построй workflow обработки данных: входящий JSON (массив из 10 объектов) → фильтрация по условию → трансформация через Code-ноду → разные ветки для разных категорий → запись результатов. Прислать: ссылку на workflow (n8n Cloud) + скриншот результата.",
    hwBullets: ["Ссылка на workflow в n8n Cloud", "Скриншот выполнения с данными"]
  },
];

c1m1.forEach(l => children.push(lessonBlock(l.num, l.title, l.dur, l.desc, l.hw, l.bullets, l.hwBullets), spacer()));

children.push(h3("Модуль 2: AI-ноды и интеграция LLM"));

const c1m2 = [
  { num: "2.1", title: "AI Agent нода: GPT-5 и Claude 4 в workflow", dur: "55 мин",
    desc: "Подключаем OpenAI и Anthropic через credentials. Разбираем AI Agent ноду: system prompt, tools, memory, output parser. Строим агента с тулами: Calculator, HTTP Request, Google Calendar. На экране — агент-планировщик: получает задачу текстом, разбивает на шаги, проверяет календарь, создаёт события. Разбираем structured output через JSON schema.",
    bullets: ["AI Agent нода: все параметры", "Tools: Calculator, HTTP, Custom Function", "Structured output через JSON Schema"],
    hw: "Создай AI-агента с минимум двумя инструментами (тулами). Агент должен выполнить задачу из нескольких шагов. Прислать: описание задачи + скриншот цепочки reasoning + итоговый результат.",
    hwBullets: ["Описание задачи агента (текст)", "Скриншот reasoning-цепочки", "Итоговый результат"]
  },
  { num: "2.2", title: "RAG в n8n: подключение базы знаний через векторное хранилище", dur: "60 мин",
    desc: "Разбираем RAG (Retrieval-Augmented Generation) без кода: Pinecone, Supabase pgvector, Qdrant как векторные БД. Строим pipeline: загрузка документов → chunking → embedding (OpenAI text-embedding-3-large) → хранение. AI-агент ищет релевантные чанки перед ответом. На экране — корпоративный ассистент: отвечает по базе из 50 PDF-документов.",
    bullets: ["Векторные БД: Pinecone vs Qdrant vs pgvector", "Chunking стратегии: fixed vs semantic", "Embedding: OpenAI vs open-source"],
    hw: "Построй RAG-систему: загрузи минимум 3 документа (PDF/TXT) в векторную БД, настрой AI-агента для поиска по ним. Бот должен корректно отвечать на 5 вопросов по содержимому. Прислать: скриншот workflow + 5 вопросов с ответами бота.",
    hwBullets: ["Скриншот RAG-workflow", "5 Q&A пар с правильными ответами"]
  },
  { num: "2.3", title: "Цепочки промптов и self-reflection агентов", dur: "50 мин",
    desc: "Паттерны цепочек: sequential chains, map-reduce, parallelism. Self-reflection: агент оценивает свой собственный ответ и улучшает его. На экране — pipeline генерации контента с автоматическим QA: GPT-5 пишет → Claude 4 критикует → GPT-5 переписывает. Разбираем ограничения и когда цепочки избыточны.",
    bullets: ["Chain patterns: sequential, parallel, map-reduce", "Self-reflection loop в n8n", "Когда цепочки переусложняют задачу"],
    hw: "Построй цепочку из 3 нод: генерация → критика → улучшение. Применить к реальной задаче (текст, план, код). Прислать: workflow + сравнение первоначального и итогового вывода.",
    hwBullets: ["Ссылка на workflow", "Сравнение first draft vs final output"]
  },
];

c1m2.forEach(l => children.push(lessonBlock(l.num, l.title, l.dur, l.desc, l.hw, l.bullets, l.hwBullets), spacer()));

children.push(h3("Модуль 3: REST API и интеграции"));

const c1m3 = [
  { num: "3.1", title: "HTTP Request нода: работа с любым API", dur: "55 мин",
    desc: "Анатомия HTTP-запроса: method, headers, auth, body, params. Все методы: GET, POST, PUT, PATCH, DELETE. Аутентификация: Bearer, API Key, OAuth 2.0, Basic Auth. На экране — 5 реальных интеграций: OpenWeatherMap, Clearbit, HubSpot, Notion, Stripe. Разбираем обработку пагинации и rate limits.",
    bullets: ["HTTP методы и когда применять", "OAuth 2.0 flow в n8n", "Pagination: offset, cursor, page-based"],
    hw: "Интегрируй любой внешний API (на выбор): получи данные, обработай их в n8n, сохрани результат. Прислать: ссылку на workflow + скриншот успешного ответа от API.",
    hwBullets: ["Ссылка на workflow с HTTP нодой", "Скриншот ответа API (200 OK)"]
  },
  { num: "3.2", title: "Парсинг данных: Apify, Puppeteer и встроенные инструменты", dur: "60 мин",
    desc: "Парсинг без кода через Apify Actors: Google Maps, LinkedIn, Amazon, Instagram. HTTP Request + CSS selectors через Cheerio-нод для простых сайтов. Puppeteer для JavaScript-рендеренных сайтов через API. На экране — полный пайплайн лидогенерации: парсинг Google Maps по нише → нормализация данных → обогащение через AI → запись в Airtable.",
    bullets: ["Apify: топ-10 готовых акторов для лидогенерации", "HTML parsing в n8n без кода", "Rate limiting и ротация прокси"],
    hw: "Построй парсер: выбери источник (Google Maps / любой сайт), собери 50+ записей, очисти данные, сохрани в таблицу. Время выполнения < 3 минут. Прислать: скриншот workflow + таблицу с результатами (50+ строк).",
    hwBullets: ["Скриншот workflow", "Google Sheets/Airtable с 50+ строками данных"]
  },
  { num: "3.3", title: "Базы данных: PostgreSQL, Airtable, Notion как хранилище", dur: "50 мин",
    desc: "Подключение PostgreSQL через n8n: SELECT, INSERT, UPDATE, DELETE. Airtable как no-code БД: поиск, фильтрация, создание записей. Notion как база данных: работа через API. Сравниваем подходы. На экране — CRM на Airtable: входящий лид → проверка дублей → создание/обновление записи → уведомление менеджера.",
    bullets: ["PostgreSQL ноды: CRUD операции", "Airtable: search & upsert pattern", "Когда нужна 'настоящая' БД vs Airtable"],
    hw: "Построй мини-CRM: Telegram-форма → проверка дублей в Airtable → создание/обновление контакта → уведомление. Система должна корректно обрабатывать повторные заявки. Прислать: ссылку на Airtable + скриншот теста с дублем.",
    hwBullets: ["Ссылка на Airtable base (view only)", "Скриншот обработки дубля"]
  },
];

c1m3.forEach(l => children.push(lessonBlock(l.num, l.title, l.dur, l.desc, l.hw, l.bullets, l.hwBullets), spacer()));

children.push(h3("Модуль 4: Продвинутые паттерны и продакшн"));

const c1m4 = [
  { num: "4.1", title: "Sub-workflows и переиспользование логики", dur: "45 мин",
    desc: "Sub-workflow pattern: вынос повторяющейся логики в дочерние workflows. Execute Sub-workflow нода: параметры, возврат данных. Библиотека переиспользуемых workflow: нормализация телефона, валидация email, обогащение лида. На экране — рефакторинг монолитного workflow в модульную архитектуру из 4 sub-workflows.",
    bullets: ["Sub-workflow архитектура: когда и зачем", "Передача данных между workflow", "Версионирование и документирование workflow"],
    hw: "Возьми любой свой сложный workflow (6+ нод) и вынеси повторяющуюся логику в sub-workflow. Прислать: скриншот до и после рефакторинга + описание что вынес и почему.",
    hwBullets: ["Скриншот workflow ДО рефакторинга", "Скриншот ПОСЛЕ с sub-workflows", "Описание архитектуры"]
  },
  { num: "4.2", title: "Error handling и мониторинг workflow", dur: "50 мин",
    desc: "Error Workflow: глобальный обработчик ошибок. Try/Catch через noOp+IF. Retry логика для API с rate limits. Alerting: ошибки → Telegram/Slack уведомление с контекстом. Мониторинг через n8n встроенные метрики и внешние (UptimeRobot). На экране — production-ready workflow с полным error handling.",
    bullets: ["Error Workflow: настройка глобального обработчика", "Retry с exponential backoff", "Alerting: что включать в сообщение об ошибке"],
    hw: "Добавь error handling к одному из своих workflow: global error handler + retry логика + уведомление в Telegram при ошибке. Прислать: скриншот Error Workflow + скриншот тестового уведомления об ошибке.",
    hwBullets: ["Скриншот Error Workflow", "Скриншот уведомления в Telegram при ошибке"]
  },
  { num: "4.3", title: "n8n self-hosted: деплой на VPS и безопасность", dur: "55 мин",
    desc: "Docker Compose для n8n self-hosted: конфигурация, переменные окружения, volumes. Reverse proxy через Nginx + SSL (Let's Encrypt). Безопасность: basic auth, IP whitelist, secrets management. Бэкап и восстановление данных. На экране — полный деплой n8n на Hostinger VPS за 20 минут с HTTPS и базовой защитой.",
    bullets: ["Docker Compose файл для production", "Nginx reverse proxy + SSL за 5 минут", "Backup workflow: автоматический экспорт в S3/Git"],
    hw: "Задеплой n8n на VPS (или покажи локальный Docker Compose). Настрой HTTPS и basic auth. Прислать: URL задеплоенного n8n + скриншот SSL-сертификата.",
    hwBullets: ["URL задеплоенного n8n (с HTTPS)", "Скриншот SSL-сертификата в браузере"]
  },
  { num: "4.4", title: "Make.com: когда Make лучше n8n и продажи Make-связок", dur: "45 мин",
    desc: "Сравнение экосистем: Make vs n8n — количество модулей, UI, сложность, цены. Make-специфичные фичи: Router, Aggregator, Iterator, Error Handler. Сценарии где Make выигрывает. На экране — полная миграция n8n-workflow в Make. Разбираем ценообразование для клиентов: за операцию vs flat rate.",
    bullets: ["Make modules vs n8n nodes: чего нет в n8n", "Aggregator и Iterator: уникальные паттерны Make", "Ценообразование для клиентов: модели"],
    hw: "Пересобери один из своих n8n-workflow в Make. Сравни: сложность, время настройки, стоимость запуска. Прислать: скриншоты обоих workflow + текстовое сравнение (100–200 слов).",
    hwBullets: ["Скриншот n8n workflow", "Скриншот Make scenario", "Текстовое сравнение"]
  },
];

c1m4.forEach(l => children.push(lessonBlock(l.num, l.title, l.dur, l.desc, l.hw, l.bullets, l.hwBullets), spacer()));

children.push(
  h4("ФИНАЛЬНЫЙ ПРОЕКТ КУРСА 1"),
  infoBox("Задание", "Построй полноценный production-ready автоматизационный продукт для реального бизнес-кейса. Минимальные требования: 3+ взаимосвязанных workflow, AI-нода, внешний API, БД, error handling. Примеры: лидогенерация + CRM + уведомления, контент-фабрика, автоматизация инвойсинга."),
  infoBox("Формат сдачи", "Видеодемо 5–10 минут (Loom/YouTube unlisted) + README с описанием архитектуры + экспорт workflow из n8n (JSON-файлы)."),
  infoBox("Портфолио", "Готовый кейс-продукт для показа клиентам + техническое описание + видеодемо."),
  spacer(),
  pageBreak(),
);

// ======= КУРС 2: ЧАТБОТЫ =======
children.push(
  h2("Курс 2: «Чат-боты с AI: Telegram и WhatsApp от идеи до продажи»"),
  infoBox("Позиционирование", "Практический курс по созданию умных чат-ботов для Telegram и WhatsApp с интеграцией LLM. От простого FAQ-бота до многоканального AI-ассистента с CRM-интеграцией и воронкой продаж."),
  infoBox("Аудитория", "Предприниматели, маркетологи, разработчики. Хотят автоматизировать поддержку, продажи и коммуникацию через мессенджеры."),
  infoBox("Результат", "Умеет создавать производительных чат-ботов для бизнеса: FAQ, воронки продаж, поддержка 24/7, интеграция с CRM. Может брать проекты от €300."),
  infoBox("Стек", "n8n, Telegraf.js, WhatsApp Business API (360dialog / Twilio), Claude 4 Sonnet, Pinecone/Qdrant, Airtable, Redis, Manychat (обзор)"),
  infoBox("Длительность", "6 недель · 18 уроков · ~22 часа видео"),
  spacer(),
);

children.push(h3("Модуль 1: Архитектура чат-ботов"));

const c2m1 = [
  { num: "1.1", title: "Типы ботов и бизнес-модели: что строим и кому продаём", dur: "35 мин",
    desc: "Классификация чат-ботов: FAQ, квалификация лидов, booking, поддержка, внутренние ассистенты, боты-продавцы. Бизнес-кейсы с ROI: сколько стоит час поддержки vs бот 24/7. Разбираем рынок: стоимость проектов, профили заказчиков, типичные ТЗ. Сравниваем платформы: n8n vs Telegraf.js vs Botpress vs Manychat. Показываем примеры 5 живых ботов.",
    bullets: ["Матрица: тип бота × платформа × сложность × цена", "Типичное ТЗ от клиента: что значат слова", "n8n vs Telegraf: когда что"],
    hw: "Составь ТЗ на бота для реального бизнеса (своего или клиента): тип, функции, интеграции, примеры диалогов. Прислать: документ ТЗ (Google Doc или PDF).",
    hwBullets: ["ТЗ на бота: тип, функции, интеграции, диалоги (минимум 2 страницы)"]
  },
  { num: "1.2", title: "Telegram Bot API глубоко: все возможности платформы", dur: "50 мин",
    desc: "Полный разбор Telegram Bot API: типы сообщений (текст, фото, файл, голос, стикер), keyboards (inline, reply, remove), callback_data, inline mode, deep linking, payments, Web App. Webhook vs long polling: архитектурный выбор. Лимиты API и как не попасть в бан. На экране — бот, который обрабатывает все типы входящих сообщений.",
    bullets: ["Inline vs Reply keyboard: когда что применять", "Deep linking для tracking каналов", "Web App: mini-приложения внутри Telegram"],
    hw: "Создай бота с полноценным UI: приветствие с inline-кнопками, обработка минимум 3 типов ввода (текст, фото, кнопка), главное меню. Прислать: @username бота + скриншоты всех состояний.",
    hwBullets: ["@username бота", "Скриншоты: стартовое меню, обработка фото, обработка текста"]
  },
  { num: "1.3", title: "Диалоговые системы: FSM, контекст, state management", dur: "55 мин",
    desc: "Конечный автомат (FSM) для управления диалогом: states, transitions, guards. Хранение состояния: in-memory vs Redis vs Airtable. На экране — квалификационная воронка из 5 шагов: имя → компания → задача → бюджет → запись на встречу. Каждый шаг валидирует ввод и переходит дальше. Обработка /cancel и возврат назад.",
    bullets: ["FSM паттерн для диалога", "Redis для хранения состояния (Docker setup)", "Validation и error messages"],
    hw: "Построй многошаговую воронку (минимум 4 шага): сбор данных → валидация → финальное действие (запись в таблицу/уведомление). Прислать: @username бота + видео прохождения воронки.",
    hwBullets: ["@username бота с воронкой", "Видео полного прохождения воронки (1–2 мин)"]
  },
];

c2m1.forEach(l => children.push(lessonBlock(l.num, l.title, l.dur, l.desc, l.hw, l.bullets, l.hwBullets), spacer()));

children.push(h3("Модуль 2: AI-интеграции и умные боты"));

const c2m2 = [
  { num: "2.1", title: "LLM-ядро для бота: системный промпт, роли, ограничения", dur: "55 мин",
    desc: "Проектирование системного промпта для бизнес-бота: роль, контекст, правила, ограничения, формат ответа. Паттерн: XML-теги для чёткой структуры промпта Claude 4. Управление hallucinations: что делать, когда бот не знает ответа. На экране — промпт-инжиниринг для бота техподдержки SaaS: бот знает продукт, отвечает по базе знаний и говорит 'не знаю' когда нужно.",
    bullets: ["Шаблон промпта для бизнес-бота (скачать)", "XML-структура для Claude 4", "Graceful fallback: как бот говорит 'не знаю'"],
    hw: "Напиши системный промпт для своего бота (реальный кейс). Протестируй на 10 вопросах: 7 должны получить правильный ответ, 3 — грамотный отказ. Прислать: промпт + результаты 10 тестов.",
    hwBullets: ["Системный промпт (полный текст)", "10 тест-кейсов с оценкой ответов"]
  },
  { num: "2.2", title: "RAG-бот: база знаний для бизнеса", dur: "60 мин",
    desc: "Полный pipeline RAG для чат-бота: загрузка документов → chunking → embedding → Pinecone/Qdrant → retrieval → augmented response. Инструменты: LangChain.js или n8n Vector Store нода. На экране — бот-консультант для интернет-магазина косметики: знает полный каталог (200 товаров), условия доставки, программу лояльности. Тест: 20 вопросов о товарах.",
    bullets: ["Pinecone setup за 5 минут", "Chunk size vs accuracy: тест на реальных данных", "Hybrid search: dense + sparse"],
    hw: "Создай RAG-бота для реального кейса: загрузи минимум 5 документов, настрой retrieval. Бот должен правильно отвечать на 8 из 10 тестовых вопросов. Прислать: @username бота + 10 Q&A с оценками.",
    hwBullets: ["@username RAG-бота", "10 Q&A тест (оценка: правильно/неправильно)"]
  },
  { num: "2.3", title: "Мультиязычные боты и персонализация", dur: "45 мин",
    desc: "Автоопределение языка пользователя через Claude API. Структура переводов: i18n подход для бота. Персонализация: бот запоминает имя, историю, предпочтения. На экране — бот для Swiss e-com: определяет язык (DE/FR/IT/EN), переключает контент, персонализирует рекомендации. Практика для европейского рынка (DACH).",
    bullets: ["Language detection: Claude vs dedicated APIs", "i18n структура для бота", "Персонализация без перегрузки памяти"],
    hw: "Добавь мультиязычность к своему боту (минимум 2 языка). Бот должен корректно переключаться. Прислать: @username бота + скриншоты диалогов на двух языках.",
    hwBullets: ["@username мультиязычного бота", "Скриншоты на двух языках"]
  },
];

c2m2.forEach(l => children.push(lessonBlock(l.num, l.title, l.dur, l.desc, l.hw, l.bullets, l.hwBullets), spacer()));

children.push(h3("Модуль 3: WhatsApp и монетизация"));

const c2m3 = [
  { num: "3.1", title: "WhatsApp Business API: 360dialog, Twilio, Meta Cloud API", dur: "55 мин",
    desc: "Архитектура WhatsApp Business API: официальный Meta Cloud API vs провайдеры (360dialog, Twilio, Wati). Регистрация и верификация бизнес-аккаунта. Шаблонные сообщения (HSM): требования Meta, апрув. Webhook интеграция в n8n. На экране — уведомления об оплате заказа через WhatsApp: триггер из Shopify → генерация сообщения → отправка через 360dialog.",
    bullets: ["Meta Cloud API vs 360dialog: сравнение стоимости", "HSM шаблоны: типы и требования", "Webhook от Meta: verification + events"],
    hw: "Настрой WhatsApp Business API (песочница через 360dialog или Twilio Trial). Отправь тестовое шаблонное сообщение из n8n-workflow. Прислать: скриншот отправленного сообщения в WhatsApp + скриншот webhook-события в n8n.",
    hwBullets: ["Скриншот полученного WhatsApp-сообщения", "Скриншот webhook в n8n (success)"]
  },
  { num: "3.2", title: "CRM-интеграция: HubSpot, AmoCRM, Bitrix24 через бот", dur: "50 мин",
    desc: "Паттерн: бот как фронтенд CRM. Создание контактов, сделок, задач через Telegram-бота. Синхронизация статусов: изменения в CRM → уведомление в мессенджер. На экране — полная воронка: лид пишет в Telegram → бот квалифицирует → создаёт сделку в HubSpot → уведомляет менеджера → менеджер закрывает из CRM → клиент получает уведомление в Telegram.",
    bullets: ["HubSpot API через n8n: contacts, deals, tasks", "Two-way sync: бот ↔ CRM", "Webhook от CRM в n8n"],
    hw: "Подключи бота к любой CRM (HubSpot Free, Notion, Airtable-CRM). Воронка: входящий вопрос → квалификация → создание записи → уведомление. Прислать: скриншот воронки в n8n + запись в CRM.",
    hwBullets: ["Скриншот n8n workflow", "Скриншот созданной записи в CRM"]
  },
  { num: "3.3", title: "Аналитика, A/B тесты и монетизация ботов", dur: "45 мин",
    desc: "Метрики для бота: DAU/MAU, retention, conversation completion rate, fallback rate. Логирование диалогов в Google Sheets/Airtable для анализа. A/B тест системных промптов: два варианта → рандомизация → сравнение. Модели монетизации: flat monthly, per message, revenue share. На экране — дашборд в Looker Studio по данным бота.",
    bullets: ["Ключевые метрики бота: что мерить", "A/B test через n8n: rounding robin", "Ценообразование: 3 модели с примерами"],
    hw: "Добавь базовую аналитику к своему боту: логируй каждый диалог в таблицу (user_id, timestamp, message_type, handled). За 3 дня тестирования собери минимум 20 диалогов. Прислать: таблицу с данными + простой анализ (топ-5 частых запросов).",
    hwBullets: ["Таблица с логами (20+ диалогов)", "Анализ: топ-5 запросов"]
  },
];

c2m3.forEach(l => children.push(lessonBlock(l.num, l.title, l.dur, l.desc, l.hw, l.bullets, l.hwBullets), spacer()));

children.push(
  h4("ФИНАЛЬНЫЙ ПРОЕКТ КУРСА 2"),
  infoBox("Задание", "Создай полноценный production-бот для реального бизнеса: минимум 10 функций, AI-ядро, база знаний (RAG), CRM-интеграция, аналитика. Протестируй 50+ реальными запросами."),
  infoBox("Формат сдачи", "Видеодемо 7–12 минут + @username бота + GitHub/n8n экспорт + краткое описание кейса."),
  infoBox("Портфолио", "Готовый кейс с метриками для показа клиентам + видеодемо."),
  spacer(),
  pageBreak(),
);

// ======= КУРС 3: ГОЛОС =======
children.push(
  h2("Курс 3: «Голосовые AI-агенты: Телефонные ресепшены, Обзвоны и Поддержка»"),
  infoBox("Позиционирование", "Единственный русскоязычный курс по голосовым AI-агентам 2026. ElevenLabs, Vapi, Retell, Bland — строим агентов для обзвона, записи на приём и обработки входящих звонков."),
  infoBox("Аудитория", "Специалисты по продажам, операционные директора, агентства автоматизации. Хотят автоматизировать холодные звонки, входящие обращения и запись клиентов."),
  infoBox("Результат", "Умеет запускать голосовых AI-агентов для обзвона и ресепшена. Может продавать как сервис от €1000/мес."),
  infoBox("Стек", "ElevenLabs Conversational AI, Vapi.ai, Retell.ai, Bland.ai, Twilio, Vocode, OpenAI Realtime API, DTMF обработка, n8n интеграция"),
  infoBox("Длительность", "6 недель · 18 уроков · ~24 часа видео"),
  spacer(),
);

children.push(h3("Модуль 1: Основы голосовых AI"));

const c3m1 = [
  { num: "1.1", title: "Архитектура голосовых агентов: STT → LLM → TTS", dur: "40 мин",
    desc: "Разбираем полную цепочку: Speech-to-Text (Deepgram, Whisper) → обработка LLM → Text-to-Speech (ElevenLabs, OpenAI TTS). Latency: почему это критично и как измерять. Realtime API OpenAI: новый подход без промежуточных шагов. Vapi vs ElevenLabs vs Retell: сравнение по latency, голосам, ценам. На экране — тест латентности трёх платформ.",
    bullets: ["STT: Deepgram Nova-2 vs Whisper Large v3", "Latency цель: <800ms для комфортного диалога", "OpenAI Realtime API: game changer 2025"],
    hw: "Создай тестовый голосовой агент в ElevenLabs Conversational AI. Проведи 3 тестовых звонка (записать или экранная запись). Измерь среднюю задержку. Прислать: видео теста + оценка латентности.",
    hwBullets: ["Видео тестового разговора (1–2 мин)", "Субъективная оценка латентности (мс примерно)"]
  },
  { num: "1.2", title: "ElevenLabs: голоса, клонирование, настройка агента", dur: "55 мин",
    desc: "ElevenLabs Voice Lab: выбор голоса, клонирование (instant vs professional). Conversational AI: создание агента, системный промпт, инструменты (переключение, завершение звонка, transfer). Настройка: interruption sensitivity, background noise cancellation, turn detection. На экране — голосовой ресепшен для частной клиники: запись на приём, ответы на FAQ о ценах и часах работы.",
    bullets: ["Instant voice cloning: что нужно (3 мин аудио)", "Conversational AI tools: end_call, transfer_call", "Настройка interruption под телефонный диалог"],
    hw: "Создай голосового агента в ElevenLabs для конкретного бизнеса. Агент должен отвечать на 5 типовых вопросов. Прислать: ссылку на агента (shareable) + видео тестового разговора.",
    hwBullets: ["Ссылка на ElevenLabs агента", "Видео тест-разговора (3–5 мин)"]
  },
  { num: "1.3", title: "Vapi.ai: продвинутые сценарии и phone numbers", dur: "60 мин",
    desc: "Vapi.ai архитектура: assistant, phone number, squad. Подключение Twilio номеров. Inbound vs outbound вызовы. Tool calls в Vapi: реальные данные в разговоре (проверить запись, обновить CRM). На экране — агент исходящего обзвона для B2B: звонит по списку из Airtable, квалифицирует лид по 5 критериям, записывает результат.",
    bullets: ["Vapi Squad: несколько агентов = один звонок", "Tool calls: fetch calendar, update CRM", "Outbound calling из n8n через Vapi API"],
    hw: "Настрой Vapi-агента с phone number (Twilio trial). Создай сценарий исходящего звонка с 3 вопросами квалификации. Прислать: скриншот настройки агента + запись тестового звонка.",
    hwBullets: ["Скриншот Vapi dashboard", "Запись тестового звонка (2–3 мин)"]
  },
];

c3m1.forEach(l => children.push(lessonBlock(l.num, l.title, l.dur, l.desc, l.hw, l.bullets, l.hwBullets), spacer()));

children.push(h3("Модуль 2: Продвинутые сценарии и интеграции"));

const c3m2 = [
  { num: "2.1", title: "Сценарии диалогов: скрипты, возражения, ветвления", dur: "55 мин",
    desc: "Проектирование диалогового дерева для голосового агента. Обработка возражений: 'занят', 'не интересно', 'перезвоните позже'. DTMF (нажатия кнопок): меню через тоновый набор. Hotword detection: ключевые слова меняют поведение агента. На экране — агент-продавец с обработкой 5 типичных возражений и escalation на живого оператора.",
    bullets: ["Диалоговое дерево: инструмент для проектирования", "5 паттернов обработки возражений", "Escalation: когда передавать на человека"],
    hw: "Спроектируй и реализуй агента с 3 ветками диалога и обработкой 2 возражений. Прислать: схему диалога (mindmap/текст) + видео теста всех веток.",
    hwBullets: ["Схема диалога (Miro/Figma/текст)", "Видео прохождения всех веток (5–7 мин)"]
  },
  { num: "2.2", title: "Интеграция с CRM и календарём в реальном времени", dur: "55 мин",
    desc: "Tool calls во время разговора: агент проверяет доступность в Google Calendar и записывает встречу не выходя из диалога. Интеграция с HubSpot: создание контакта и сделки по итогам звонка. Webhooks от Vapi/ElevenLabs в n8n: пост-обработка результатов. На экране — полная воронка записи на встречу: агент звонит → проверяет слоты → записывает → создаёт событие → уведомляет менеджера.",
    bullets: ["Google Calendar API в Tool Call", "Webhook от Vapi: структура payload", "Post-call processing в n8n"],
    hw: "Реализуй агента, который записывает на встречу через Google Calendar Tool Call. Прислать: скриншот созданного события в календаре после тестового звонка + запись звонка.",
    hwBullets: ["Скриншот события в Google Calendar", "Запись звонка с записью (2–4 мин)"]
  },
  { num: "2.3", title: "Массовый обзвон: кампании и управление списками", dur: "50 мин",
    desc: "Batch calling через Vapi API: загрузка списка номеров, запуск кампании. Управление кампанией: пауза, стоп, retry. Соответствие требованиям: часы звонков, DNC-списки, запись с согласием. Rate limiting и стоимость. На экране — кампания исходящего обзвона 100 контактов из Airtable: настройка, запуск, мониторинг результатов.",
    bullets: ["Vapi Batch API: endpoint и параметры", "DNC compliance: базовые правила для ЕС", "Стоимость: расчёт кампании на 500 звонков"],
    hw: "Настрой и запусти кампанию минимум на 5 тестовых номеров из Airtable. Прислать: скриншот dashboard кампании с результатами (answered/voicemail/failed) + один пример записи звонка.",
    hwBullets: ["Скриншот dashboard кампании", "Запись одного звонка из кампании"]
  },
];

c3m2.forEach(l => children.push(lessonBlock(l.num, l.title, l.dur, l.desc, l.hw, l.bullets, l.hwBullets), spacer()));

children.push(
  h4("ФИНАЛЬНЫЙ ПРОЕКТ КУРСА 3"),
  infoBox("Задание", "Построй полноценного голосового агента для реального кейса (ресепшен, обзвон, поддержка). Минимум: 5 сценариев диалога, Tool Call с реальными данными, интеграция с CRM/календарём."),
  infoBox("Формат сдачи", "Видеодемо 7–10 минут с реальными тестовыми звонками + схема диалогов + конфиг агента."),
  spacer(),
  pageBreak(),
);

// ======= КУРС 4: AI АГЕНТЫ =======
children.push(
  h2("Курс 4: «AI-агенты и Мультиагентные системы: LangGraph, CrewAI, MCP»"),
  infoBox("Позиционирование", "Самый глубокий курс для разработчиков: строим автономных AI-агентов, мультиагентные пайплайны и MCP-серверы. От ReAct-агента до production-системы с 5 специализированными агентами."),
  infoBox("Аудитория", "Python/JavaScript разработчики и middle-специалисты по автоматизациям. Хотят строить сложные AI-продукты."),
  infoBox("Уровень", "Middle: нужен базовый Python или JavaScript, понимание API, REST"),
  infoBox("Стек", "Python 3.12, LangChain 0.3, LangGraph 0.2, CrewAI, AutoGen 0.4, Claude 4 (MCP), OpenAI API, Pydantic v2, FastAPI, PostgreSQL, Redis, Docker"),
  infoBox("Длительность", "8 недель · 24 урока · ~35 часов видео"),
  spacer(),
);

children.push(h3("Модуль 1: Основы агентных систем"));

const c4m1 = [
  { num: "1.1", title: "ReAct паттерн: Reasoning + Acting без фреймворков", dur: "55 мин",
    desc: "Разбираем архитектуру ReAct с нуля: Thought → Action → Observation цикл. Реализуем на чистом Python + Claude API: агент с инструментами (web search, calculator, file read). Разбираем, зачем нужны фреймворки и когда они лишние. Сравниваем подходы: чистый API vs LangChain vs MCP. На экране — агент-аналитик: получает вопрос, ищет данные, считает, формирует отчёт.",
    bullets: ["ReAct цикл: code walkthrough", "Tool calling: OpenAI format vs Anthropic format", "Когда обходиться без фреймворка"],
    hw: "Реализуй ReAct-агента на чистом Python (без LangChain) с минимум 2 инструментами. Агент должен решить задачу в 3+ шага. Прислать: код на GitHub + скриншот reasoning-цепочки.",
    hwBullets: ["Ссылка на GitHub repo", "Скриншот reasoning-цепочки агента"]
  },
  { num: "1.2", title: "LangChain 0.3: агенты, цепочки, инструменты", dur: "60 мин",
    desc: "LangChain 0.3 архитектура: LCEL (LangChain Expression Language), Runnable, chains. AgentExecutor vs нативные агенты. Built-in tools: DuckDuckGo, Wikipedia, Python REPL, Shell. На экране — исследовательский агент: получает тему, ищет в интернете, анализирует 5 источников, пишет структурированный отчёт в Markdown.",
    bullets: ["LCEL: pipe operator и composability", "AgentExecutor: verbose mode для отладки", "Custom tools: @tool декоратор"],
    hw: "Построй LangChain-агента с 3+ инструментами для реальной задачи. Прислать: GitHub репо + README с описанием + пример output.",
    hwBullets: ["GitHub репо с кодом", "README с описанием агента", "Пример output агента (текст/скриншот)"]
  },
  { num: "1.3", title: "MCP (Model Context Protocol): серверы и клиенты", dur: "60 мин",
    desc: "MCP — протокол Anthropic для стандартизации инструментов агентов. Архитектура: MCP Server (инструменты) + MCP Client (агент). Реализация MCP-сервера на Python с FastMCP. Готовые MCP-серверы: Filesystem, GitHub, Google Drive, Slack, PostgreSQL. На экране — агент Claude 4 через MCP подключается к файловой системе, читает код, анализирует и предлагает улучшения.",
    bullets: ["MCP Protocol: transport (stdio, SSE, HTTP)", "FastMCP: 5 строк для MCP-сервера", "MCP Inspector для отладки"],
    hw: "Создай кастомный MCP-сервер с минимум 3 инструментами для реальной задачи (работа с файлами, API, БД). Подключи к Claude Desktop. Прислать: GitHub репо + видео демо работы.",
    hwBullets: ["GitHub репо MCP-сервера", "Видео демо (2–3 мин)"]
  },
];

c4m1.forEach(l => children.push(lessonBlock(l.num, l.title, l.dur, l.desc, l.hw, l.bullets, l.hwBullets), spacer()));

children.push(h3("Модуль 2: LangGraph и stateful агенты"));

const c4m2 = [
  { num: "2.1", title: "LangGraph: граф состояний для сложной логики", dur: "65 мин",
    desc: "LangGraph как расширение LangChain для агентных workflow: StateGraph, nodes, edges, conditional edges. Отличие от простых цепочек: циклы, ветвления, human-in-the-loop. Checkpointing для сохранения состояния. На экране — агент кодревью: получает PR → анализирует изменения → проверяет стиль → пишет комментарии → если критичные ошибки — запрашивает человека.",
    bullets: ["StateGraph: TypedDict для state", "Conditional edges: логика ветвления", "Human-in-the-loop: interrupt_before"],
    hw: "Реализуй LangGraph-агента с условным ветвлением и минимум 4 нодами. Агент должен принимать разные решения в зависимости от входных данных. Прислать: GitHub репо + схема графа (автогенерация через LangGraph) + 2 примера execution.",
    hwBullets: ["GitHub репо", "PNG графа состояний", "2 примера execution с разными путями"]
  },
  { num: "2.2", title: "Долгосрочная память агентов: LangMem и векторные хранилища", dur: "55 мин",
    desc: "Типы памяти: working memory (контекст), episodic memory (история сессий), semantic memory (факты о пользователе). LangMem для автоматического управления памятью. Векторное хранилище для персонализации. На экране — персональный ассистент с долгосрочной памятью: помнит цели пользователя, прошлые проекты, предпочтения.",
    bullets: ["Working vs episodic vs semantic memory", "LangMem: автоматический distillation", "Retrieval strategies: MMR vs similarity"],
    hw: "Добавь долгосрочную память к агенту: после 5+ диалогов агент должен демонстрировать персонализацию (помнить факты). Прислать: GitHub репо + скриншот 2 сессий с разными данными и 1 сессии где агент их использует.",
    hwBullets: ["GitHub репо", "Скриншоты: 3 сессии (2 ввод + 1 с персонализацией)"]
  },
];

c4m2.forEach(l => children.push(lessonBlock(l.num, l.title, l.dur, l.desc, l.hw, l.bullets, l.hwBullets), spacer()));

children.push(h3("Модуль 3: Мультиагентные системы"));

const c4m3 = [
  { num: "3.1", title: "CrewAI: команды агентов с ролями и задачами", dur: "60 мин",
    desc: "CrewAI архитектура: Crew, Agent, Task, Process (sequential, hierarchical). Специализация агентов: исследователь, аналитик, писатель, рецензент. Manager agent для координации. На экране — контент-команда из 4 агентов: Researcher → Fact Checker → Writer → Editor. Входные данные: тема статьи. Выход: готовая статья с верифицированными фактами.",
    bullets: ["Agent roles: goal, backstory, tools", "Process: sequential vs hierarchical", "CrewAI Flow: event-driven coordination"],
    hw: "Создай CrewAI-команду минимум из 3 агентов для реальной задачи. Прислать: GitHub репо + пример output команды (финальный результат + логи).",
    hwBullets: ["GitHub репо", "Финальный output команды", "Лог работы агентов"]
  },
  { num: "3.2", title: "AutoGen 0.4: чаты агентов и AutoGen Studio", dur: "55 мин",
    desc: "AutoGen 0.4 архитектура: AgentChat, Teams, Selector. UserProxyAgent vs AssistantAgent. SelectorGroupChat: динамический выбор следующего агента. AutoGen Studio: no-code UI для построения мультиагентных систем. На экране — команда дебагеров: Python Error → AutoGen команда (analyzer + fixer + tester) → исправленный код с тестами.",
    bullets: ["AgentChat API vs AssistantAgent API", "SelectorGroupChat: логика выбора агента", "AutoGen Studio: демо интерфейса"],
    hw: "Построй AutoGen-команду для итеративного улучшения текста или кода (минимум 3 цикла улучшения). Прислать: GitHub репо + сравнение input/output на 3 итерациях.",
    hwBullets: ["GitHub репо", "Сравнение: input → round 1 → round 2 → round 3"]
  },
  { num: "3.3", title: "Production мультиагентная система: мониторинг и отладка", dur: "60 мин",
    desc: "Observability для агентов: LangSmith tracing, токены и стоимость, latency. Тесты для агентов: unit tests для инструментов, integration tests для workflow. Оптимизация: кеширование, параллельность, выбор модели. На экране — production мультиагентная система с полным tracing в LangSmith и алертингом в Telegram.",
    bullets: ["LangSmith: traces, runs, datasets", "Cost tracking: автоматический учёт токенов", "Параллельный запуск агентов: asyncio"],
    hw: "Добавь LangSmith трейсинг к своему мультиагентному проекту. Запусти 10 тестовых задач, проанализируй стоимость и latency. Прислать: скриншот LangSmith dashboard + отчёт (стоимость, среднее время, accuracy).",
    hwBullets: ["Скриншот LangSmith traces", "Отчёт: cost/token/latency для 10 запусков"]
  },
];

c4m3.forEach(l => children.push(lessonBlock(l.num, l.title, l.dur, l.desc, l.hw, l.bullets, l.hwBullets), spacer()));

children.push(
  h4("ФИНАЛЬНЫЙ ПРОЕКТ КУРСА 4"),
  infoBox("Задание", "Построй production-ready мультиагентную систему: минимум 3 агента с ролями, LangGraph или CrewAI, долгосрочная память, MCP-интеграция, LangSmith трейсинг. Реальная бизнес-задача."),
  infoBox("Формат сдачи", "GitHub репо + README + видеодемо 7–10 мин + LangSmith public trace."),
  spacer(),
  pageBreak(),
);

// ======= КУРС 5: SAAS =======
children.push(
  h2("Курс 5: «Vibe Coding: AI-приложения и SaaS от идеи до первых €1000»"),
  infoBox("Позиционирование", "Создай работающий AI SaaS-продукт с помощью Cursor, Lovable и v0 — без глубокого знания кода. От MVP за выходные до монетизированного продукта с первыми платящими клиентами."),
  infoBox("Аудитория", "Предприниматели и разработчики с любым уровнем кода. Хотят построить и монетизировать AI-продукт."),
  infoBox("Стек", "Cursor AI, Lovable.dev, v0.dev, Replit, Next.js 15, Supabase, Stripe, Vercel, Cloudflare, Anthropic API, OpenAI API, Railway"),
  infoBox("Длительность", "8 недель · 24 урока · ~30 часов видео"),
  spacer(),
);

children.push(h3("Модуль 1: Vibe Coding — разработка с AI"));

const c5m1 = [
  { num: "1.1", title: "Cursor AI: полный курс по вайб-кодингу", dur: "60 мин",
    desc: "Cursor AI полное руководство 2026: Tab autocomplete, Cmd+K инлайн-редактирование, Cmd+L чат, Composer для больших задач, Cursor Rules (.cursorrules файл). Composer в агентном режиме: пишем feature по описанию. На экране — создаём REST API на FastAPI за 20 минут через Cursor. Разбираем стратегию промптинга для кода: context, constraints, examples.",
    bullets: ["Cursorrules: 10 правил для продуктивной работы", "Composer Agent: multi-file changes", "@-синтаксис: @codebase, @docs, @web"],
    hw: "Создай REST API с 3 endpoint через Cursor AI (от описания к коду). Прислать: GitHub репо + скриншот успешных запросов через Postman.",
    hwBullets: ["GitHub репо", "Скриншоты 3 успешных запросов в Postman"]
  },
  { num: "1.2", title: "Lovable и v0: полноценные приложения из промпта", dur: "55 мин",
    desc: "Lovable.dev: генерация full-stack приложения из текста, Supabase интеграция, деплой на Vercel. v0.dev: компонентный подход, shadcn/ui, Next.js. Сравниваем: Lovable для MVP, v0 для компонентов. На экране — AI-инструмент для генерации landing page: пользователь описывает бизнес → получает готовый HTML. Деплой за 2 клика.",
    bullets: ["Lovable vs v0 vs Replit: когда что", "Supabase auth + database из Lovable", "Custom domains и staging environments"],
    hw: "Создай работающее AI-приложение через Lovable (не Hello World — реальный инструмент с AI). Прислать: ссылку на задеплоенный сайт + скриншот с результатом работы AI.",
    hwBullets: ["Ссылка на живое приложение", "Скриншот рабочего AI-функционала"]
  },
  { num: "1.3", title: "Supabase: база данных, аутентификация, хранилище", dur: "55 мин",
    desc: "Supabase как backend-as-a-service: PostgreSQL с realtime, Auth (email, OAuth, magic link), Storage, Edge Functions. Строим с Cursor: users таблица → auth → protected routes → user data. Row Level Security (RLS): безопасность на уровне строк. На экране — система аутентификации для SaaS за 30 минут.",
    bullets: ["Supabase CLI: local development", "RLS policies: 5 частых паттернов", "Edge Functions: Deno runtime"],
    hw: "Добавь аутентификацию через Supabase к своему приложению (email+password + Google OAuth). Прислать: ссылку на приложение + скриншоты: регистрация, логин, защищённая страница.",
    hwBullets: ["Ссылка на приложение с auth", "3 скриншота: signup + login + protected page"]
  },
];

c5m1.forEach(l => children.push(lessonBlock(l.num, l.title, l.dur, l.desc, l.hw, l.bullets, l.hwBullets), spacer()));

children.push(h3("Модуль 2: Монетизация и рост"));

const c5m2 = [
  { num: "2.1", title: "Stripe: платёжная система за один день", dur: "55 мин",
    desc: "Stripe Checkout для простых платежей. Stripe Subscriptions: tiers, trials, pause/cancel. Customer Portal: self-service управление подпиской. Webhooks: обработка событий (payment_succeeded, subscription_cancelled). На экране — полная интеграция Stripe в Next.js SaaS: Free/Pro/Business тарифы, checkout, portal, ограничение функций по плану.",
    bullets: ["Stripe Checkout vs Elements: когда что", "Webhook security: stripe-signature validation", "Usage-based billing для AI: per token"],
    hw: "Добавь Stripe к своему приложению: минимум 2 тарифа, checkout flow, webhook обработка. Прислать: скриншот успешного тестового платежа в Stripe dashboard + скриншот защищённого контента.",
    hwBullets: ["Скриншот тестового платежа (Stripe dashboard)", "Скриншот: доступ к premium функции после оплаты"]
  },
  { num: "2.2", title: "AI-фичи: usage tracking и rate limiting", dur: "45 мин",
    desc: "Учёт использования AI токенов по пользователям: Supabase таблица usage. Rate limiting по тарифному плану (Free: 10 запросов/день, Pro: unlimited). Оптимизация стоимости: кеширование ответов, выбор модели по задаче. На экране — дашборд использования токенов в Supabase + ограничение на уровне API.",
    bullets: ["Token counting: tiktoken + Anthropic usage field", "Rate limiting: Upstash Redis", "Model routing: GPT-3.5 vs GPT-4 по сложности"],
    hw: "Добавь трекинг использования AI: каждый запрос логируется (user_id, tokens, cost, timestamp). Реализуй лимит (5 запросов/день для Free). Прислать: скриншот таблицы usage + поведение при превышении лимита.",
    hwBullets: ["Скриншот Supabase usage таблицы", "Скриншот: сообщение о превышении лимита"]
  },
  { num: "2.3", title: "Лендинг, SEO и Product Hunt запуск", dur: "50 мин",
    desc: "Landing page для AI SaaS: структура, копирайтинг (проблема → решение → кейсы → цены → CTA). Next.js metadata, sitemap, robots.txt для SEO. Product Hunt запуск: стратегия, timing, kitty. На экране — создаём лендинг для нашего SaaS через v0 + Cursor, настраиваем SEO, подготавливаем материалы для Product Hunt.",
    bullets: ["Структура landing page для AI SaaS: 7 блоков", "Next.js 15 metadata API", "Product Hunt: пошаговый чеклист"],
    hw: "Напиши landing page для своего продукта (7 блоков). Добавь базовый SEO (title, description, OG). Прислать: ссылку на лендинг + Google PageSpeed результат (>80).",
    hwBullets: ["Ссылка на лендинг", "Google PageSpeed скриншот (>80)"]
  },
];

c5m2.forEach(l => children.push(lessonBlock(l.num, l.title, l.dur, l.desc, l.hw, l.bullets, l.hwBullets), spacer()));

children.push(
  h4("ФИНАЛЬНЫЙ ПРОЕКТ КУРСА 5"),
  infoBox("Задание", "Запусти монетизированный AI SaaS: аутентификация, AI-функционал, Stripe-платежи, лендинг, деплой. Получи первых 3 пользователей (даже бесплатных)."),
  infoBox("Формат сдачи", "Ссылка на живой продукт + GitHub репо + скриншот Stripe dashboard + видеодемо 5–8 мин."),
  spacer(),
  pageBreak(),
);

// ======= КУРС 6: МАРКЕТИНГ =======
children.push(
  h2("Курс 6: «AI-маркетинг и Контент: От Поста до Видео на Автопилоте»"),
  infoBox("Позиционирование", "Практический курс по AI-автоматизации маркетинга: генерация контента, видео с Sora 2 и Runway Gen-4, SMM-пайплайны, SEO-автоматизации, аналитика. Строим контент-машину, которая работает без тебя."),
  infoBox("Аудитория", "Маркетологи, SMM-специалисты, контент-менеджеры, предприниматели ведущие соцсети."),
  infoBox("Стек", "Claude 4 Sonnet, GPT-5, Midjourney v7, Sora 2, Runway Gen-4, Kling 2, ElevenLabs, Canva AI, n8n, Ahrefs API, Google Ads API"),
  infoBox("Длительность", "6 недель · 18 уроков · ~22 часа видео"),
  spacer(),
);

children.push(h3("Модуль 1: AI-контент для соцсетей"));

const c6m1 = [
  { num: "1.1", title: "Контент-стратегия с AI: планирование на месяц за 2 часа", dur: "50 мин",
    desc: "Промпт-система для создания контент-плана: аудитория → темы → форматы → расписание. Claude 4 для анализа конкурентов: входящие данные — 10 постов конкурента, выход — анализ стратегии + идеи для своего контента. Google Trends + Claude для поиска трендовых тем. На экране — генерация контент-плана на 30 дней для B2B SaaS: 90 постов за 1 час работы.",
    bullets: ["Контент-аудит конкурентов через AI за 30 мин", "Промпт-система для 5 форматов контента", "Google Trends API + Claude: тренды недели"],
    hw: "Создай контент-план на 2 недели для реального аккаунта (14 постов с темами, хештегами, форматами). Используй Claude 4. Прислать: Google Sheets с планом + промпт, который использовал.",
    hwBullets: ["Google Sheets с контент-планом (14 постов)", "Промпт для генерации"]
  },
  { num: "1.2", title: "Тексты и карусели: промпт-системы для разных платформ", dur: "55 мин",
    desc: "Промпт-архитектура для разных платформ: LinkedIn (профессиональный), Instagram (визуальный сторителлинг), Telegram (экспертный), Twitter/X (лаконичный). Карусели: генерация структуры (хук → тело → CTA) через Claude 4. Адаптация одного контента для 4 платформ автоматически. На экране — один кейс компании превращается в 4 поста для разных платформ.",
    bullets: ["Формула поста для каждой платформы", "Hook generator: 10 типов заголовков", "Репурпозинг контента: 1 статья → 4 формата"],
    hw: "Напиши один пост-кейс и адаптируй его для LinkedIn, Instagram и Telegram. Прислать: 3 поста + краткий анализ отличий (tone, length, structure).",
    hwBullets: ["3 поста (LinkedIn + Instagram + Telegram)", "Сравнение: tone/length/structure"]
  },
  { num: "1.3", title: "AI-изображения для маркетинга: Midjourney v7 и Ideogram 3", dur: "55 мин",
    desc: "Midjourney v7 2026: новые параметры, character consistency, product shots. Идеограф 3 для текста на изображениях (баннеры, карусели). Adobe Firefly для корпоративных изображений. Workflow: бриф → промпт через Claude → генерация → postprocessing в Canva. На экране — создаём визуальный брендбук из 20 изображений за 40 минут.",
    bullets: ["Midjourney v7: --sref для consistent style", "Ideogram 3: текст без ошибок на картинке", "Brand consistency через style reference"],
    hw: "Создай набор из 5 брендированных визуалов для одного аккаунта (единый стиль, один стиль). Прислать: 5 изображений + промпты.",
    hwBullets: ["5 изображений в едином стиле", "Промпты для каждого изображения"]
  },
];

c6m1.forEach(l => children.push(lessonBlock(l.num, l.title, l.dur, l.desc, l.hw, l.bullets, l.hwBullets), spacer()));

children.push(h3("Модуль 2: AI-видео 2026"));

const c6m2 = [
  { num: "2.1", title: "Sora 2 и Runway Gen-4: видео из текста для маркетинга", dur: "60 мин",
    desc: "Sora 2 (OpenAI) возможности 2026: стилистика, длина, camera control. Runway Gen-4: reference images для consistent characters. Kling 2: азиатская альтернатива с уникальными эффектами. Стратегия: когда какую модель. На экране — создаём 3 варианта одного рекламного видео для косметического бренда в разных стилях.",
    bullets: ["Sora 2 prompting: camera moves, lighting, timing", "Runway Gen-4: Act-One для актёров", "Kling 2: motion brush техника"],
    hw: "Создай рекламное видео 15–30 секунд для реального продукта через Sora 2 или Runway. Прислать: видео + промпт + платформа.",
    hwBullets: ["Видео 15–30 сек", "Промпт + платформа генерации"]
  },
  { num: "2.2", title: "Автоматизированные видео-пайплайны: контент-фабрика", dur: "60 мин",
    desc: "n8n пайплайн для автоматического создания видео: тема из Google Trends → скрипт через Claude 4 → голос через ElevenLabs → изображения через Midjourney → монтаж через Shotstack API. Результат: 1 видео в сутки без ручной работы. На экране — полная демонстрация пайплайна: ввод темы → готовое вертикальное видео с текстом и озвучкой.",
    bullets: ["Shotstack API: video composition программно", "Автопостинг в Instagram Reels через n8n", "A/B тест хуков: 2 версии → сравнение"],
    hw: "Настрой мини-контент-фабрику: минимум 3 ноды (скрипт → голос → сборка). Сгенерируй 3 видео на разные темы. Прислать: 3 видео + схема пайплайна.",
    hwBullets: ["3 видео от автоматизации", "Скриншот схемы пайплайна"]
  },
];

c6m2.forEach(l => children.push(lessonBlock(l.num, l.title, l.dur, l.desc, l.hw, l.bullets, l.hwBullets), spacer()));

children.push(h3("Модуль 3: SEO и аналитика с AI"));

const c6m3 = [
  { num: "3.1", title: "AI-SEO: ключевые слова, кластеризация, тексты массово", dur: "55 мин",
    desc: "Ahrefs/Semrush API для массового сбора KW-данных. Claude 4 для кластеризации по интенту: информационные, коммерческие, транзакционные. Массовая генерация SEO-текстов: темплейт + данные + Claude = 100 страниц за день. Факт-чек и уникализация. На экране — SEO-пайплайн для интернет-магазина: 50 карточек товаров с уникальными описаниями за 30 минут.",
    bullets: ["Ahrefs Data API: SERP, KW, backlinks", "Кластеризация через GPT-5: prompt template", "Bulk generation: Google Sheets → Claude → Sheets"],
    hw: "Сгенерируй 10 SEO-текстов для реальных ключевых слов (любая ниша). Тексты: уникальные, минимум 300 слов. Прислать: Google Sheets с 10 текстами + KW для каждого.",
    hwBullets: ["Google Sheets с 10 SEO-текстами (300+ слов каждый)", "Список KW для каждого текста"]
  },
  { num: "3.2", title: "Аналитика контента с AI: что работает и почему", dur: "45 мин",
    desc: "Google Analytics 4 → экспорт данных → Claude 4 для анализа. Паттерны: какие темы набирают engagement, лучшее время публикации, тренды по контенту. Отчёт автоматически каждый понедельник через n8n. На экране — AI-аналитик для Instagram: загружает данные за месяц, объясняет что работало и предлагает план на следующий месяц.",
    bullets: ["GA4 Data API: export через Python", "Prompt для анализа маркетинговых данных", "Автоматический еженедельный отчёт в n8n"],
    hw: "Настрой автоматический отчёт: данные из любого источника (GA4, Instagram Insights, Telegram) → анализ через AI → результат в Telegram каждый понедельник. Прислать: скриншот полученного отчёта + workflow.",
    hwBullets: ["Скриншот автоматического отчёта", "Скриншот workflow в n8n"]
  },
];

c6m3.forEach(l => children.push(lessonBlock(l.num, l.title, l.dur, l.desc, l.hw, l.bullets, l.hwBullets), spacer()));

children.push(
  h4("ФИНАЛЬНЫЙ ПРОЕКТ КУРСА 6"),
  infoBox("Задание", "Запусти контент-машину для реального аккаунта: автоматизированный контент-план, 10 готовых постов, 2 AI-видео, SEO-тексты, автоматический аналитический отчёт."),
  infoBox("Формат сдачи", "Видеодемо пайплайна 5–7 мин + результаты (контент + видео) + скриншоты автоматизаций."),
  spacer(),
  pageBreak(),
);

// ======= КУРС 7: КОНСАЛТИНГ =======
children.push(
  h2("Курс 7: «AI-консалтинг и Интеграции: Построй Агентство с Первым Клиентом»"),
  infoBox("Позиционирование", "Флагманский курс для тех, кто хочет зарабатывать на AI-экспертизе. Поиск клиентов, проведение аудита, упаковка услуг, кейсы, продажи, ценообразование — полный бизнес-цикл AI-агентства."),
  infoBox("Аудитория", "Выпускники курсов 1–6 или специалисты с AI-опытом. Хотят перейти от «умею» к «зарабатываю»."),
  infoBox("Результат", "Готовое AI-агентство: сайт, оффер, 3+ кейса в портфолио, система лидогенерации. Первый клиент в течение курса."),
  infoBox("Стек", "Notion (CRM), Apollo.io, LinkedIn Sales Navigator, Loom, Calendly, Stripe, Framer/Webflow, n8n (own tools)"),
  infoBox("Длительность", "8 недель · 24 урока · ~28 часов видео"),
  spacer(),
);

children.push(h3("Модуль 1: Позиционирование и упаковка"));

const c7m1 = [
  { num: "1.1", title: "Ниша и оффер: как стать 'AI-агентством для [X]'", dur: "50 мин",
    desc: "Стратегия нишевания для AI-консультанта: горизонтальная (по инструменту) vs вертикальная (по отрасли). Почему 'AI-автоматизации для e-com в DACH' лучше чем 'AI для всех'. Формула оффера: для кого → какую проблему → каким способом → за сколько → с каким результатом. На экране — воркшоп по нишеванию на примере 5 профилей студентов.",
    bullets: ["Матрица нишевания: инструмент × отрасль × регион", "Формула оффера: 5 компонентов", "Как протестировать нишу до запуска"],
    hw: "Сформулируй свой оффер по формуле. Прислать: 1 предложение оффера + объяснение выбора ниши (200–300 слов).",
    hwBullets: ["Оффер (1 предложение)", "Обоснование ниши (200–300 слов)"]
  },
  { num: "1.2", title: "Ценообразование: от €300 до €5000 за проект", dur: "45 мин",
    desc: "Модели ценообразования: fixed price, time & material, monthly retainer, revenue share. Pricing psychology: почему €1997 лучше €2000. Как рассчитать минимальный проект (себестоимость × 3 = цена). Типичные ценники на рынке ЕС в 2026. На экране — разбор реальных кейсов: n8n-автоматизация за €800, AI-бот за €1200, голосовой агент за €2500/мес.",
    bullets: ["3 модели ценообразования с примерами", "Discovery call → proposal → contract: цикл сделки", "Договор на автоматизацию: ключевые пункты"],
    hw: "Составь прайс-лист из 3 услуг с описанием, включёнными работами и ценой. Прислать: прайс-лист (PDF или Notion) + обоснование цен.",
    hwBullets: ["Прайс-лист (3 услуги, PDF)", "Обоснование цен (100–150 слов)"]
  },
  { num: "1.3", title: "Сайт и материалы: онлайн-присутствие за 3 дня", dur: "50 мин",
    desc: "Минимальный сайт агентства через Framer или Webflow: структура (hero, услуги, кейсы, about, contact). Портфолио кейсов: как оформить проект без NDA. Loom-видео: 2-минутный питч для холодных продаж. LinkedIn-профиль агентства vs личный бренд. На экране — создаём сайт за 2 часа в Framer через AI-генерацию.",
    bullets: ["Структура сайта агентства: 5 обязательных блоков", "Case study без NDA: что можно показать", "LinkedIn: 10 элементов продающего профиля"],
    hw: "Создай минимальный сайт агентства или лендинг (Framer, Webflow, Notion). Прислать: ссылку + скриншот главной страницы.",
    hwBullets: ["Ссылка на сайт", "Скриншот главной страницы"]
  },
];

c7m1.forEach(l => children.push(lessonBlock(l.num, l.title, l.dur, l.desc, l.hw, l.bullets, l.hwBullets), spacer()));

children.push(h3("Модуль 2: Аудит и продажи"));

const c7m2 = [
  { num: "2.1", title: "AI-аудит бизнеса: методология и инструменты", dur: "55 мин",
    desc: "Методология AI-аудита: Process Mapping → Pain Point Analysis → Automation Potential Scoring → ROI Calculation. Инструменты: опросник в Notion/Typeform, Miro для карты процессов, таблица оценки ROI. На экране — полный аудит для интернет-магазина: 8 бизнес-процессов, оценка потенциала автоматизации, ROI-расчёт.",
    bullets: ["Шаблон аудита (Notion — скачать)", "ROI-калькулятор: формула и пример", "Process mapping: BPMN-lite"],
    hw: "Проведи AI-аудит для реального бизнеса (своего или знакомого). Прислать: заполненный шаблон аудита + ROI-расчёт для топ-3 автоматизаций.",
    hwBullets: ["Заполненный шаблон аудита", "ROI-расчёт (таблица)"]
  },
  { num: "2.2", title: "Лидогенерация: Apollo, LinkedIn, холодные письма", dur: "55 мин",
    desc: "Лидогенерация для AI-агентства в ЕС: Apollo.io для поиска по ICP, LinkedIn Sales Navigator, партнёрства с маркетинговыми агентствами. Холодное письмо для AI-услуг: структура (проблема → решение → доказательство → CTA). AI для персонализации писем: Company research → Claude → персональное письмо. На экране — кампания 100 писем: поиск списка → персонализация → отправка → трекинг.",
    bullets: ["ICP для AI-агентства в DACH: критерии", "Apollo.io: поиск + sequence автоматизация", "Шаблон холодного письма + 5 вариаций"],
    hw: "Составь список из 20 потенциальных клиентов (ICP) и напиши 5 персонализированных pitch-письма. Прислать: список + 5 писем.",
    hwBullets: ["Список 20 потенциальных клиентов (таблица)", "5 персонализированных писем"]
  },
  { num: "2.3", title: "Продажи: предложение, возражения, закрытие", dur: "50 мин",
    desc: "Структура коммерческого предложения для AI-услуг: проблема → решение → кейсы → сроки → цена → гарантии. Обработка 10 типичных возражений: 'дорого', 'нам это не нужно', 'сами разберёмся'. Закрытие сделки: deadline, пакетная скидка, pilot-проект. На экране — разбор 3 реальных КП от студентов прошлых потоков с комментариями.",
    bullets: ["Структура КП: 7 разделов", "10 возражений + контраргументы", "Pilot project: снижение порога входа"],
    hw: "Напиши коммерческое предложение для одной из своих услуг (реальный или вымышленный клиент). Прислать: PDF КП + ответ на возражение 'у нас нет бюджета'.",
    hwBullets: ["КП в PDF (минимум 3 страницы)", "Письменный ответ на возражение 'нет бюджета'"]
  },
];

c7m2.forEach(l => children.push(lessonBlock(l.num, l.title, l.dur, l.desc, l.hw, l.bullets, l.hwBullets), spacer()));

children.push(h3("Модуль 3: Операционка агентства"));

const c7m3 = [
  { num: "3.1", title: "Управление проектами: от брифа до сдачи", dur: "45 мин",
    desc: "Операционный цикл: бриф → декомпозиция → исполнение → тестирование → сдача → поддержка. Notion как PM-система: клиентская база, задачи, статусы. Коммуникация с клиентом: loom-апдейты вместо созвонов. Документирование для передачи: инструкция, видеогайд, README. На экране — управление реальным проектом автоматизации в Notion.",
    bullets: ["Notion шаблон для ведения проектов (скачать)", "Loom апдейт: что включать (5 пунктов)", "README-шаблон для сдачи автоматизации"],
    hw: "Создай Notion-базу для управления своим первым реальным или тестовым проектом. Прислать: ссылку на Notion (view access) + скриншот статуса проекта.",
    hwBullets: ["Ссылка на Notion проект (view)", "Скриншот board с задачами"]
  },
  { num: "3.2", title: "Поддержка и upsell: retention клиентов", dur: "45 мин",
    desc: "Модели поддержки: SLA, monthly retainer, on-demand. Upsell-стратегия: от разового проекта к ретейнеру. Customer success: метрики, QBR (quarterly business review). Клиентские кейсы для портфолио без NDA. На экране — система поддержки для 5 клиентов через n8n: мониторинг workflow + автоуведомления при ошибках + ежемесячный отчёт.",
    bullets: ["SLA для автоматизаций: что гарантировать", "Retainer pitch: от €300/мес", "QBR шаблон: что показывать клиенту"],
    hw: "Напиши пакет поддержки для одной из своих услуг (описание, SLA, цена). Прислать: описание пакета + ценник.",
    hwBullets: ["Описание пакета поддержки (1 страница)", "Ценник (месяц/год)"]
  },
  { num: "3.3", title: "Масштабирование: команда, субподрядчики, продукты", dur: "50 мин",
    desc: "Переход от фрилансера к агентству: найм subcontractors на Upwork/LinkedIn, стандартизация процессов. Productization: пакетированные услуги (стандартизированные → легко продавать). SaaS vs услуги: гибридная модель. Партнёрства: реферальные программы с агентствами. На экране — roadmap роста: месяц 1 (первый клиент) → месяц 6 (3 клиента ретейнер) → год 2 (команда из 3).",
    bullets: ["Стандарты для субподрядчика: что передать", "Productized service: 3 уровня пакета", "Партнёрская программа: условия и материалы"],
    hw: "Составь 12-месячный roadmap своего AI-агентства: цели по выручке, клиентам, найму. Прислать: roadmap (таблица/Notion) + 3 ключевых шага на первый месяц.",
    hwBullets: ["12-месячный roadmap (таблица)", "3 шага на первый месяц (текст)"]
  },
];

c7m3.forEach(l => children.push(lessonBlock(l.num, l.title, l.dur, l.desc, l.hw, l.bullets, l.hwBullets), spacer()));

children.push(
  h4("ФИНАЛЬНЫЙ ПРОЕКТ КУРСА 7"),
  infoBox("Задание", "Закрыть первый реальный клиентский проект (платный или pro bono для кейса). Сдать: КП + договор + выполненный проект + кейс для портфолио."),
  infoBox("Формат сдачи", "Видеопрезентация кейса 7–12 мин + КП + договор (redacted) + задокументированный проект."),
  infoBox("Портфолио", "Полноценный кейс с ROI-показателями, скриншотами и описанием — готов для сайта и LinkedIn."),
  spacer(),
);

// FOOTER
children.push(
  divider(),
  new Paragraph({
    spacing: { before: 200, after: 100 },
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "AI Insider School · aiinsider.it.com · @vladyslavarcher", size: 20, font: "Arial", color: C.gray })],
  }),
  new Paragraph({
    spacing: { before: 40, after: 40 },
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Документ актуален на 2026 год. Стек, цены и инструменты подлежат ежеквартальной ревизии.", size: 18, font: "Arial", color: C.gray, italics: true })],
  }),
);

// BUILD DOCUMENT
const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{
          level: 0,
          format: LevelFormat.BULLET,
          text: "\u2022",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      },
      {
        reference: "numbers",
        levels: [{
          level: 0,
          format: LevelFormat.DECIMAL,
          text: "%1.",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      }
    ]
  },
  styles: {
    default: {
      document: { run: { font: "Arial", size: 20 } }
    },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 40, bold: true, font: "Arial", color: C.darkBg },
        paragraph: { spacing: { before: 480, after: 240 }, outlineLevel: 0 }
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: C.violet },
        paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 1 }
      },
      {
        id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: C.purple },
        paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 2 }
      },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1080, bottom: 1440, left: 1080 }
      }
    },
    children,
  }]
});

Packer.toBuffer(doc).then(buffer => {
  const outDir = path.join(__dirname, '..', 'docs');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'AI_Insider_School_Curriculum_2026.docx');
  fs.writeFileSync(outFile, buffer);
  console.log('Done! File saved to', outFile);
}).catch(err => console.error('Error:', err));