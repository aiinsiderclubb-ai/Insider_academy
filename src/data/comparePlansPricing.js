import { COURSE_BUNDLES } from './coursePacks'
import { MEMBERSHIP_PLANS } from './memberships'
import { resolveCourseId } from './courseAliases'
import { CLUB_INCLUDED_PAID_IDS } from './productStructure'

function subscriptionIncludesCourse(plan, courseId) {
  if (plan.tier === 'pro') return true
  if (plan.tier === 'club') return CLUB_INCLUDED_PAID_IDS.includes(courseId)
  return false
}

/** Варианты оплаты для сравнения на странице покупки курса (только цены) */
export function getPriceComparisonForCourse(course, coursePriceEur) {
  const courseId = resolveCourseId(course?.id)
  if (!courseId) return []

  const rows = [
    {
      id: 'single-course',
      kind: 'course',
      labelKey: 'single',
      priceEur: coursePriceEur,
      billing: 'once',
      includesCourse: true,
      link: null,
      isCurrent: true,
    },
  ]

  COURSE_BUNDLES.filter((bundle) => bundle.courseIds.includes(courseId))
    .sort((a, b) => a.priceEur - b.priceEur)
    .forEach((bundle) => {
      rows.push({
        id: bundle.id,
        kind: 'pack',
        labelKey: bundle.id,
        label: bundle.title,
        priceEur: bundle.priceEur,
        billing: 'once',
        includesCourse: true,
        link: `/packs/${bundle.id}`,
        courseCount: bundle.courseIds.length,
      })
    })

  const subscriptionOrder = [
    'ai-insider-club',
    'ai-insider-pro',
    'ai-insider-club-annual',
    'ai-insider-pro-annual',
  ]

  subscriptionOrder.forEach((planId) => {
    const plan = MEMBERSHIP_PLANS.find((p) => p.id === planId)
    if (!plan) return
    rows.push({
      id: plan.id,
      kind: 'subscription',
      labelKey: plan.id,
      label: plan.name,
      labelEn: plan.nameEn,
      priceEur: plan.priceEur,
      billing: plan.billing,
      includesCourse: subscriptionIncludesCourse(plan, courseId),
      link: `/memberships/${plan.tier}`,
      saveLabelRu: plan.saveLabelRu,
      saveLabelEn: plan.saveLabelEn,
    })
  })

  const including = rows.filter((r) => r.includesCourse && r.kind !== 'course')
  const minIncluding = including.length
    ? Math.min(...including.map((r) => r.priceEur))
    : null

  return rows.map((row) => ({
    ...row,
    isBestOneTime:
      row.billing === 'once' &&
      row.includesCourse &&
      minIncluding != null &&
      row.priceEur === minIncluding &&
      row.kind !== 'course',
  }))
}
