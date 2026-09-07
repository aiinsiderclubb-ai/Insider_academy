import { LegalPage } from '../components/LegalPage'
import { legalRequisitesBlock } from '../data/legalEntity'

const requisites = legalRequisitesBlock('ru')

const SECTIONS = [
  {
    id: 'controller',
    title: '1. Оператор данных',
    paragraphs: [
      'Оператором персональных данных при использовании AI Insider Academy является владелец платформы AI Insider.',
      ...requisites,
      'Контакт по персональным данным: info@myinsideracademy.com.',
    ],
  },
  {
    id: 'data',
    title: '2. Какие данные мы собираем',
    paragraphs: [
      'При регистрации и оплате: имя, email, данные аккаунта, история покупок и прогресс обучения.',
      'Технические данные: IP-адрес, cookies, данные браузера и устройства — для безопасности и аналитики.',
      'При подключении Telegram-бота: идентификатор чата Telegram для уведомлений и участия в активностях сообщества.',
    ],
  },
  {
    id: 'purposes',
    title: '3. Цели обработки',
    paragraphs: [
      'Предоставление доступа к курсам и продуктам, обработка платежей, поддержка пользователей, улучшение сервиса, соблюдение юридических обязательств.',
      'Маркетинговые рассылки — только при отдельном согласии пользователя.',
    ],
  },
  {
    id: 'sharing',
    title: '4. Передача третьим лицам',
    paragraphs: [
      'Данные передаются только тем, без кого услуга не работает. Сейчас это Vercel, Render, Microsoft 365 и Tribute.',
    ],
  },
  {
    id: 'rights',
    title: '5. Права пользователя',
    paragraphs: [
      'Вы можете запросить доступ, исправление или удаление данных, ограничение обработки и отзыв согласия — через info@myinsideracademy.com или Telegram @vladyslavarcher.',
      'Жалоба в надзорный орган возможна в стране вашего проживания в рамках применимого законодательства (GDPR и др.).',
    ],
  },
  {
    id: 'cookies',
    title: '6. Cookies',
    paragraphs: [
      'Платформа использует необходимые cookies для авторизации и сохранения настроек. Аналитические cookies применяются при вашем согласии.',
    ],
  },
]

export function PrivacyPolicy() {
  return (
    <LegalPage
      title="Политика конфиденциальности"
      description="Политика конфиденциальности AI Insider Academy — обработка персональных данных."
      path="/privacy"
      sections={SECTIONS}
      draftNotice
    />
  )
}
