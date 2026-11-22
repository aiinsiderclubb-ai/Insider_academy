/** Расширенные тексты страниц Vault */

export const VAULT_DETAILS = {
  'vault-prompt': {
    heroRu: 'Библиотека из 270 проверенных промптов',
    heroEn: 'A library of 270 tested prompts',
    outcomesRu: [
      'Быстрее писать тексты и письма',
      'Готовые маркетинговые и SEO-запросы',
      'Шаблоны для исследований и продаж',
    ],
    outcomesEn: [
      'Write copy and emails faster',
      'Ready marketing and SEO prompts',
      'Templates for research and sales',
    ],
  },
  'vault-automation': {
    heroRu: 'Готовые n8n workflow под ключ',
    heroEn: 'Ready-to-deploy n8n workflows',
    outcomesRu: [
      'Экономия недель настройки',
      'Инструкции к каждому сценарию',
      'CRM, мессенджеры и отчёты',
    ],
    outcomesEn: [
      'Save weeks of setup time',
      'Instructions for every workflow',
      'CRM, messengers and reporting',
    ],
  },
  'vault-agency': {
    heroRu: 'Запуск AI-агентства с документами',
    heroEn: 'Launch your AI agency with templates',
    outcomesRu: [
      'Контракты и proposal из коробки',
      'Скрипты продаж и outreach',
      'Onboarding и delivery SOP',
    ],
    outcomesEn: [
      'Contracts and proposals out of the box',
      'Sales and outreach scripts',
      'Onboarding and delivery SOPs',
    ],
  },
  'vault-agent': {
    heroRu: 'Пять готовых AI-агентов для n8n',
    heroEn: 'Five ready AI agents for n8n',
    outcomesRu: [
      'Агент поддержки и агент продаж на сайте и в Telegram',
      'Квалификация заявок и запись на встречи без менеджера',
      'Ответы по вашим документам со ссылками на источник',
    ],
    outcomesEn: [
      'A support agent and a sales agent on your site and in Telegram',
      'Lead qualification and booking without a manager',
      'Answers from your documents with source citations',
    ],
  },
  'vault-creator': {
    heroRu: 'Контент на месяцы вперёд',
    heroEn: 'Months of content planned ahead',
    outcomesRu: [
      '365 идей без творческого кризиса',
      'Сценарии Shorts и Reels',
      'Hooks, CTA и storytelling',
    ],
    outcomesEn: [
      '365 ideas without creative block',
      'Shorts and Reels scripts',
      'Hooks, CTAs and storytelling',
    ],
  },
}

export function getVaultDetails(vaultId) {
  return VAULT_DETAILS[vaultId] || null
}
