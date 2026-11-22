/**
 * Реквизиты продавца AI Insider Academy: частное лицо, продажи через Paddle.com
 * (Merchant of Record). Регистрационный и налоговый номера пусты, пока их нет.
 */
export const LEGAL_ENTITY = {
  draft: false,
  legalName: 'Vladyslav Katash',
  legalNameEn: 'Vladyslav Katash',
  registrationCountry: 'Катар',
  registrationCountryEn: 'Qatar',
  registrationNumber: '',
  taxId: '',
  address: '',
  emailClaims: 'info@myinsideracademy.com',
  emailPrivacy: 'info@myinsideracademy.com',
  telegram: '@vladyslavarcher',
  bankName: '',
  iban: '',
  bic: '',
  governingLaw: 'Право Государства Катар',
  governingLawEn: 'Laws of the State of Qatar',
  merchantOfRecord: 'Paddle.com Market Limited',
  updatedAt: '2026-11-22',
}

export function legalRequisitesBlock(lang = 'ru') {
  const e = LEGAL_ENTITY
  if (e.draft) {
    return lang === 'en'
      ? [
          'Seller identification and bank details are being finalized. Live checkout remains disabled until they are published.',
          `Claims and privacy: ${e.emailClaims}. Telegram: ${e.telegram}.`,
        ]
      : [
          'Идентификационные и банковские реквизиты продавца уточняются. Боевой checkout остаётся отключённым до их публикации.',
          `Вопросы до покупки и претензии: ${e.emailClaims}. Telegram: ${e.telegram}.`,
        ]
  }
  const optional = (label, value) => (value ? [`${label}: ${value}.`] : [])
  if (lang === 'en') {
    return [
      `Seller: ${e.legalNameEn}, ${e.registrationCountryEn}.`,
      ...optional('Registration', e.registrationNumber),
      ...optional('Tax ID', e.taxId),
      ...optional('Address', e.address),
      `Contact: ${e.emailClaims}. Telegram: ${e.telegram}.`,
      `Merchant of Record: ${e.merchantOfRecord}.`,
      `Governing law: ${e.governingLawEn}.`,
    ]
  }
  return [
    `Продавец: ${e.legalName}, ${e.registrationCountry}.`,
    ...optional('Регистрация', e.registrationNumber),
    ...optional('Налоговый номер', e.taxId),
    ...optional('Адрес', e.address),
    `Контакт: ${e.emailClaims}. Telegram: ${e.telegram}.`,
    `Продавец по заказам (Merchant of Record): ${e.merchantOfRecord}.`,
    `Применимое право: ${e.governingLaw}.`,
  ]
}
