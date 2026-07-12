/**
 * Юридические реквизиты продавца AI Insider Academy.
 * DRAFT — замените значениями из регистрационных документов перед подключением платежей.
 */
export const LEGAL_ENTITY = {
  draft: true,
  legalName: 'TODO: Полное наименование юрлица / ФОП',
  legalNameEn: 'TODO: Full legal entity name',
  registrationCountry: 'TODO: страна регистрации (например, Україна / Estonia / …)',
  registrationNumber: 'TODO: ЕГРПОУ / реєстраційний номер / Company ID',
  taxId: 'TODO: ІПН / VAT / Tax ID',
  address: 'TODO: юридический адрес (улица, город, индекс, страна)',
  emailClaims: 'hello@aiinsider.com',
  emailPrivacy: 'hello@aiinsider.com',
  telegram: '@vladyslavarcher',
  bankName: 'TODO: название банка',
  iban: 'TODO: IBAN',
  bic: 'TODO: SWIFT/BIC',
  governingLaw: 'TODO: применимое право и суд (юрисдикция)',
  updatedAt: '2026-07-11',
}

export function legalRequisitesBlock(lang = 'ru') {
  const e = LEGAL_ENTITY
  if (lang === 'en') {
    return [
      `Seller (draft): ${e.legalNameEn}.`,
      `Registration: ${e.registrationCountry}, ID ${e.registrationNumber}, Tax ${e.taxId}.`,
      `Address: ${e.address}.`,
      `Claims: ${e.emailClaims}. Privacy: ${e.emailPrivacy}. Telegram: ${e.telegram}.`,
      `Bank: ${e.bankName}. IBAN: ${e.iban}. BIC: ${e.bic}.`,
      `Governing law: ${e.governingLaw}.`,
      'Status: DRAFT — replace TODO fields with final lawyer-approved details before accepting live payments.',
    ]
  }
  return [
    `Продавец (черновик): ${e.legalName}.`,
    `Регистрация: ${e.registrationCountry}, номер ${e.registrationNumber}, налог ${e.taxId}.`,
    `Адрес: ${e.address}.`,
    `Претензии: ${e.emailClaims}. Персональные данные: ${e.emailPrivacy}. Telegram: ${e.telegram}.`,
    `Банк: ${e.bankName}. IBAN: ${e.iban}. BIC: ${e.bic}.`,
    `Применимое право: ${e.governingLaw}.`,
    'Статус: DRAFT — замените поля TODO финальными реквизитами до приёма боевых платежей.',
  ]
}
