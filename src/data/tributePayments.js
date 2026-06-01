/** Прямые ссылки Tribute на оплату курсов (webLink из tribute.tg) */
export const TRIBUTE_COURSE_PAYMENTS = {
  'ai-agency-builder': {
    productId: 126606,
    paymentUrl: 'https://web.tribute.tg/p/wW2',
    telegramUrl: 'https://t.me/tribute/app?startapp=pwW2',
  },
}

export function getCourseTributePaymentUrl(courseId) {
  return TRIBUTE_COURSE_PAYMENTS[courseId]?.paymentUrl || null
}

export function getCourseTributeProductId(courseId) {
  return TRIBUTE_COURSE_PAYMENTS[courseId]?.productId || null
}
