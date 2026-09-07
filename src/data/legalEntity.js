/**
 * Юридические реквизиты продавца AI Insider Academy.
 * DRAFT — замените TODO полями из регистрационных документов перед открытием продаж.
 */
export const LEGAL_ENTITY = {
  draft: true,
  legalName: 'TODO: Полное юридическое имя (например, Vladyslav Katash / GmbH / ФОП)',
  legalNameEn: 'TODO: Full legal name',
  registrationCountry: 'TODO: страна регистрации',
  registrationNumber: 'TODO: Handelsregister / ЄДРПОУ / Company ID',
  taxId: 'TODO: USt-IdNr / Steuernummer / ІПН',
  address: 'TODO: улица, индекс, город, страна',
  emailClaims: 'info@myinsideracademy.com',
  emailPrivacy: 'info@myinsideracademy.com',
  telegram: '@vladyslavarcher',
  bankName: 'TODO: банк',
  iban: 'TODO: IBAN',
  bic: 'TODO: SWIFT/BIC',
  governingLaw: 'TODO: применимое право и суд',
  updatedAt: '2026-09-07',
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
  if (lang === 'en') {
    return [
      `Seller: ${e.legalNameEn}.`,
      `Registration: ${e.registrationCountry}, ID ${e.registrationNumber}, Tax ${e.taxId}.`,
      `Address: ${e.address}.`,
      `Claims: ${e.emailClaims}. Privacy: ${e.emailPrivacy}. Telegram: ${e.telegram}.`,
      `Bank: ${e.bankName}. IBAN: ${e.iban}. BIC: ${e.bic}.`,
      `Governing law: ${e.governingLaw}.`,
    ]
  }
  return [
    `Продавец: ${e.legalName}.`,
    `Регистрация: ${e.registrationCountry}, номер ${e.registrationNumber}, налог ${e.taxId}.`,
    `Адрес: ${e.address}.`,
    `Претензии: ${e.emailClaims}. Персональные данные: ${e.emailPrivacy}. Telegram: ${e.telegram}.`,
    `Банк: ${e.bankName}. IBAN: ${e.iban}. BIC: ${e.bic}.`,
    `Применимое право: ${e.governingLaw}.`,
  ]
}
