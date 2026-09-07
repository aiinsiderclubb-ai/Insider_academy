export const EMAIL_LOCALES = ['ru', 'ukr', 'en']

export const MARKETING_TEMPLATES = new Set([
  'welcome_1',
  'welcome_2',
  'welcome_3',
  'inactive_3d',
  'inactive_7d',
  'inactive_14d',
])

export const TEMPLATE_CATALOG = [
  { id: 'verify_code', kind: 'transactional', name: { ru: 'Код подтверждения', ukr: 'Код підтвердження', en: 'Verification code' } },
  { id: 'password_reset', kind: 'transactional', name: { ru: 'Сброс пароля', ukr: 'Скидання пароля', en: 'Password reset' } },
  { id: 'welcome_1', kind: 'marketing', name: { ru: 'Welcome 1 — вход', ukr: 'Welcome 1 — вхід', en: 'Welcome 1 — start' } },
  { id: 'welcome_2', kind: 'marketing', name: { ru: 'Welcome 2 — первый шаг', ukr: 'Welcome 2 — перший крок', en: 'Welcome 2 — first step' } },
  { id: 'welcome_3', kind: 'marketing', name: { ru: 'Welcome 3 — карта', ukr: 'Welcome 3 — мапа', en: 'Welcome 3 — map' } },
  { id: 'hw_reviewed', kind: 'transactional', name: { ru: 'ДЗ проверено', ukr: 'ДЗ перевірено', en: 'Homework reviewed' } },
  { id: 'inactive_3d', kind: 'marketing', name: { ru: 'Не заходил 3 дня', ukr: 'Не заходив 3 дні', en: 'Inactive 3 days' } },
  { id: 'inactive_7d', kind: 'marketing', name: { ru: 'Мы соскучились', ukr: 'Ми сумуємо', en: 'We miss you' } },
  { id: 'inactive_14d', kind: 'marketing', name: { ru: 'Не заходил 14 дней', ukr: 'Не заходив 14 днів', en: 'Inactive 14 days' } },
  { id: 'access_granted', kind: 'transactional', name: { ru: 'Доступ к курсу', ukr: 'Доступ до курсу', en: 'Course access' } },
  { id: 'certificate_ready', kind: 'transactional', name: { ru: 'Сертификат', ukr: 'Сертифікат', en: 'Certificate' } },
  { id: 'test_email', kind: 'transactional', name: { ru: 'Тест SMTP', ukr: 'Тест SMTP', en: 'SMTP test' } },
  { id: 'admin_digest', kind: 'transactional', name: { ru: 'Админ-дайджест', ukr: 'Адмін-дайджест', en: 'Admin digest' } },
]

export function normalizeLocale(raw) {
  const value = String(raw || '').trim().toLowerCase()
  if (value === 'uk' || value === 'ua' || value === 'ukr' || value.startsWith('uk-')) return 'ukr'
  if (value === 'en' || value.startsWith('en-')) return 'en'
  return 'ru'
}

const packs = {
  ru: {
    brand: 'AI Insider Academy',
    ignore: 'Если вы не запрашивали это письмо — просто проигнорируйте его.',
    unsubscribe: 'Отписаться от писем Academy',
    openSite: 'Открыть сайт',
    greeting: (name) => (name ? `Здравствуйте, ${name}.` : 'Здравствуйте.'),
    verify: {
      subject: (code) => `${code} — код подтверждения AI Insider Academy`,
      title: 'Подтвердите email',
      lead: 'Спасибо за регистрацию. Введите код на сайте — он действует 15 минут.',
      cta: 'Ввести код на сайте',
    },
    reset: {
      subject: 'Сброс пароля — AI Insider Academy',
      title: 'Новый пароль',
      lead: 'Вы запросили сброс пароля. Ссылка действует один час.',
      cta: 'Создать новый пароль',
    },
    welcome1: {
      subject: 'Вы внутри AI Insider Academy',
      title: 'Добро пожаловать',
      lead: 'Аккаунт подтверждён. Дальше — кабинет: там курсы, прогресс и домашки.',
      cta: 'Открыть кабинет',
    },
    welcome2: {
      subject: 'Первый шаг — 15 минут',
      title: 'Начните с одного урока',
      lead: 'Не разбирайте всю академию сразу. Откройте стартовый курс и пройдите первый урок.',
      cta: 'Открыть AI Starter Week',
    },
    welcome3: {
      subject: 'Карта Academy',
      title: 'Куда идти дальше',
      leadLive: 'Когда будете готовы — выберите один курс и идите по программе. Каталог уже открыт.',
      leadPrelaunch: 'Платформа ещё в предстарте. Каталог можно смотреть, доступ к урокам откроем при запуске.',
      ctaLive: 'Смотреть курсы',
      ctaPrelaunch: 'Смотреть каталог',
    },
    homework: {
      subject: (course) => `ДЗ: ${course}`,
      title: 'Проверка домашнего задания',
      accepted: 'принято',
      resubmit: 'на доработку',
      cta: 'Открыть кабинет',
    },
    inactive3: {
      subject: 'Продолжите с того места',
      title: 'Вы остановились на полпути',
      lead: 'Три дня без входа. Вернитесь к уроку — это быстрее, чем начинать заново.',
      cta: 'Продолжить',
      kicker: 'Урок ждёт',
    },
    inactive7: {
      subject: 'Мы соскучились',
      title: 'Нам тебя не хватает',
      lead: 'Неделя без тебя в Academy. Место сохранено: можно открыть тот же урок и идти дальше, без старта с нуля.',
      cta: 'Вернуться к уроку',
      kicker: 'Мы рядом',
    },
    inactive14: {
      subject: 'Мы на месте, когда вернётесь',
      title: 'Короткое напоминание',
      lead: 'Две недели тишины. Кабинет и курсы на месте — без срочности и дедлайнов.',
      cta: 'Вернуться в Academy',
      kicker: 'Academy',
    },
    access: {
      subject: (course) => `Доступ открыт: ${course}`,
      title: 'Курс доступен',
      leadLive: 'Оплата прошла. Можно открывать первый урок.',
      leadPrelaunch: 'Доступ записан. Уроки откроются, когда снимем предзапуск.',
      sameEmail: 'Зайдите в Academy под той же почтой, с которой оплачивали.',
      cta: 'Открыть курс',
    },
    certificate: {
      subject: (course) => `Сертификат: ${course}`,
      title: 'Сертификат готов',
      lead: 'Курс пройден. Сертификат лежит в кабинете.',
      cta: 'Открыть сертификаты',
    },
    test: {
      subject: 'Тест почты — AI Insider Academy',
      title: 'Почта работает',
      lead: 'Это проверка SMTP. Если письмо дошло, шаблон и отправитель настроены верно.',
      cta: 'Открыть сайт',
    },
    digest: {
      subject: (hw) => `AI Insider Admin — ${hw} ДЗ на проверке`,
      title: 'Ежедневный дайджест',
      cta: 'Открыть Studio',
    },
    unsubPage: {
      title: 'Отписка оформлена',
      lead: 'Больше не будем присылать welcome и напоминания. Сервисные письма (код, пароль, доступ) останутся.',
    },
  },
  ukr: {
    brand: 'AI Insider Academy',
    ignore: 'Якщо ви не запитували цей лист — просто проігноруйте його.',
    unsubscribe: 'Відписатися від листів Academy',
    openSite: 'Відкрити сайт',
    greeting: (name) => (name ? `Вітаємо, ${name}.` : 'Вітаємо.'),
    verify: {
      subject: (code) => `${code} — код підтвердження AI Insider Academy`,
      title: 'Підтвердіть email',
      lead: 'Дякуємо за реєстрацію. Введіть код на сайті — він діє 15 хвилин.',
      cta: 'Ввести код на сайті',
    },
    reset: {
      subject: 'Скидання пароля — AI Insider Academy',
      title: 'Новий пароль',
      lead: 'Ви запросили скидання пароля. Посилання діє одну годину.',
      cta: 'Створити новий пароль',
    },
    welcome1: {
      subject: 'Ви всередині AI Insider Academy',
      title: 'Ласкаво просимо',
      lead: 'Акаунт підтверджено. Далі — кабінет: курси, прогрес і домашні.',
      cta: 'Відкрити кабінет',
    },
    welcome2: {
      subject: 'Перший крок — 15 хвилин',
      title: 'Почніть з одного уроку',
      lead: 'Не розбирайте всю академію одразу. Відкрийте стартовий курс і пройдіть перший урок.',
      cta: 'Відкрити AI Starter Week',
    },
    welcome3: {
      subject: 'Мапа Academy',
      title: 'Куди йти далі',
      leadLive: 'Коли будете готові — оберіть один курс і йдіть за програмою. Каталог уже відкритий.',
      leadPrelaunch: 'Платформа ще в передзапуску. Каталог можна дивитися, доступ до уроків відкриємо на старті.',
      ctaLive: 'Дивитися курси',
      ctaPrelaunch: 'Дивитися каталог',
    },
    homework: {
      subject: (course) => `ДЗ: ${course}`,
      title: 'Перевірка домашнього завдання',
      accepted: 'прийнято',
      resubmit: 'на доопрацювання',
      cta: 'Відкрити кабінет',
    },
    inactive3: {
      subject: 'Продовжіть з того місця',
      title: 'Ви зупинилися на півдорозі',
      lead: 'Три дні без входу. Поверніться до уроку — це швидше, ніж починати знову.',
      cta: 'Продовжити',
      kicker: 'Урок чекає',
    },
    inactive7: {
      subject: 'Ми сумуємо',
      title: 'Нам тебе не вистачає',
      lead: 'Тиждень без тебе в Academy. Місце збережене: можна відкрити той самий урок і йти далі.',
      cta: 'Повернутися до уроку',
      kicker: 'Ми поруч',
    },
    inactive14: {
      subject: 'Ми на місці, коли повернетесь',
      title: 'Коротке нагадування',
      lead: 'Два тижні тиші. Кабінет і курси на місці — без терміновості.',
      cta: 'Повернутися в Academy',
      kicker: 'Academy',
    },
    access: {
      subject: (course) => `Доступ відкрито: ${course}`,
      title: 'Курс доступний',
      leadLive: 'Оплата пройшла. Можна відкривати перший урок.',
      leadPrelaunch: 'Доступ записано. Уроки відкриються, коли знімемо передзапуск.',
      sameEmail: 'Увійдіть в Academy під тією ж поштою, з якої оплачували.',
      cta: 'Відкрити курс',
    },
    certificate: {
      subject: (course) => `Сертифікат: ${course}`,
      title: 'Сертифікат готовий',
      lead: 'Курс пройдено. Сертифікат лежить у кабінеті.',
      cta: 'Відкрити сертифікати',
    },
    test: {
      subject: 'Тест пошти — AI Insider Academy',
      title: 'Пошта працює',
      lead: 'Це перевірка SMTP. Якщо лист дійшов, шаблон і відправник налаштовані правильно.',
      cta: 'Відкрити сайт',
    },
    digest: {
      subject: (hw) => `AI Insider Admin — ${hw} ДЗ на перевірці`,
      title: 'Щоденний дайджест',
      cta: 'Відкрити Studio',
    },
    unsubPage: {
      title: 'Відписку оформлено',
      lead: 'Більше не надсилатимемо welcome і нагадування. Сервісні листи (код, пароль, доступ) залишаться.',
    },
  },
  en: {
    brand: 'AI Insider Academy',
    ignore: 'If you did not request this email, you can ignore it.',
    unsubscribe: 'Unsubscribe from Academy emails',
    openSite: 'Open the site',
    greeting: (name) => (name ? `Hi, ${name}.` : 'Hi.'),
    verify: {
      subject: (code) => `${code} — AI Insider Academy verification code`,
      title: 'Confirm your email',
      lead: 'Thanks for registering. Enter this code on the site — it expires in 15 minutes.',
      cta: 'Enter the code',
    },
    reset: {
      subject: 'Reset your password — AI Insider Academy',
      title: 'New password',
      lead: 'You asked to reset your password. This link expires in one hour.',
      cta: 'Create a new password',
    },
    welcome1: {
      subject: 'You are in AI Insider Academy',
      title: 'Welcome',
      lead: 'Your account is confirmed. The cabinet has your courses, progress, and homework.',
      cta: 'Open the cabinet',
    },
    welcome2: {
      subject: 'First step — 15 minutes',
      title: 'Start with one lesson',
      lead: 'Do not map the whole academy at once. Open the starter course and finish the first lesson.',
      cta: 'Open AI Starter Week',
    },
    welcome3: {
      subject: 'Your Academy map',
      title: 'Where to go next',
      leadLive: 'When you are ready, pick one course and follow the program. The catalog is open.',
      leadPrelaunch: 'The platform is still in prelaunch. You can browse the catalog; lessons unlock at launch.',
      ctaLive: 'Browse courses',
      ctaPrelaunch: 'Browse the catalog',
    },
    homework: {
      subject: (course) => `Homework: ${course}`,
      title: 'Homework review',
      accepted: 'accepted',
      resubmit: 'needs revision',
      cta: 'Open the cabinet',
    },
    inactive3: {
      subject: 'Continue where you left off',
      title: 'You paused mid-way',
      lead: 'Three days without a visit. Jump back into the lesson — faster than starting over.',
      cta: 'Continue',
      kicker: 'Lesson waiting',
    },
    inactive7: {
      subject: 'We miss you',
      title: 'Academy is quieter without you',
      lead: 'A week away. Your spot is saved — open the same lesson and keep going.',
      cta: 'Back to the lesson',
      kicker: 'Still here',
    },
    inactive14: {
      subject: 'We are here when you are back',
      title: 'A quiet reminder',
      lead: 'Two weeks of silence. Your cabinet and courses are still here — no countdown.',
      cta: 'Return to Academy',
      kicker: 'Academy',
    },
    access: {
      subject: (course) => `Access is open: ${course}`,
      title: 'Course unlocked',
      leadLive: 'Payment went through. You can open the first lesson.',
      leadPrelaunch: 'Access is recorded. Lessons open when we leave prelaunch.',
      sameEmail: 'Sign in to Academy with the same email you paid with.',
      cta: 'Open the course',
    },
    certificate: {
      subject: (course) => `Certificate: ${course}`,
      title: 'Certificate ready',
      lead: 'The course is complete. Your certificate is in the cabinet.',
      cta: 'Open certificates',
    },
    test: {
      subject: 'Mail test — AI Insider Academy',
      title: 'Mail is working',
      lead: 'This is an SMTP check. If you can read this, the template and sender are correct.',
      cta: 'Open the site',
    },
    digest: {
      subject: (hw) => `AI Insider Admin — ${hw} homework waiting`,
      title: 'Daily digest',
      cta: 'Open Studio',
    },
    unsubPage: {
      title: 'You are unsubscribed',
      lead: 'We will stop welcome and reminder emails. Transactional mail (codes, passwords, access) still goes out.',
    },
  },
}

export function copyFor(locale) {
  return packs[normalizeLocale(locale)]
}
