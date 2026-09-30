/*
 * What the site assistant knows about the academy beyond the live catalogue.
 *
 * Courses and store products are read from the database on every request, so
 * Studio edits reach the assistant at once. The rest — plans, bundles, the
 * map of pages — lives in the web front end's content files and has no API, so
 * it is restated here. When plans or bundles change on the site
 * (content/data/memberships.json, content/data/coursePacks.json in
 * AI-Insider-Academy-New-design), change them here too: the assistant quotes
 * these prices to buyers.
 */

export const PLANS = [
  {
    tier: 'Club',
    prices: '€59 / month, or €419 / year',
    includes: [
      'AI Productivity Master and AI Content Creator',
      'every free programme',
      'new lessons every month',
      'the private Telegram community',
      'the Prompt Library and checklists',
      'assignments and certificates',
    ],
    excludes: ['AI Automation Engineer', 'AI Agent Engineer', 'AI Business Builder'],
  },
  {
    tier: 'Pro',
    prices: '€99 / month, or €659 / year',
    includes: [
      'every Academy course, including Automation, Agent and Business Builder',
      'every new course',
      'ready-made n8n workflows',
      'AI agent, bot and voice agent templates',
      'sales and outreach scripts for client work',
      'monthly case teardowns',
      'premium cases and AI business resources',
      'the private community',
    ],
  },
]

export const BUNDLES = [
  { id: 'ai-creator-pack', name: 'Creator Pack', price: '€69 (instead of €97)', courses: 'AI Productivity Master + AI Content Creator' },
  {
    id: 'ai-freelancer-pack',
    name: 'Freelancer Pack',
    price: '€119 (instead of €127)',
    courses: 'AI Productivity Master + AI Content Creator + AI Automation Engineer',
  },
  {
    id: 'ai-business-pack',
    name: 'Business Pack',
    price: '€179 (instead of €206)',
    courses: 'AI Productivity Master + AI Content Creator + AI Automation Engineer + AI Agent Engineer',
  },
]

/** Every path the assistant may link to. Anything else it must not invent. */
export const PAGES = [
  ['/', 'home page'],
  ['/learn', 'course catalogue'],
  ['/learn/{course-slug}', 'one course: programme, price, FAQ, buy button'],
  ['/learn/path', 'recommended learning path from zero to AI business'],
  ['/learn/bundles/{bundle-id}', 'one course bundle'],
  ['/plans', 'Club and Pro memberships compared'],
  ['/store', 'marketplace: prompt packs, n8n workflows, agent templates'],
  ['/store/{product-slug}', 'one store product'],
  ['/store/tools', 'partner AI tools with discounts (SYNTX AI: promo code AIINSIDER15)'],
  ['/community/forum', 'students-only Q&A forum (open to anyone who bought something)'],
  ['/community/blog', 'blog'],
  ['/community/events', 'live events and webinars'],
  ['/community/giveaways', 'giveaways'],
  ['/register', 'create an account'],
  ['/login', 'sign in'],
  ['/app', 'personal cabinet: my courses, progress, certificates'],
  ['/app/learning', 'my courses'],
  ['/app/homework', 'my assignments'],
  ['/app/orders', 'my orders'],
  ['/app/settings', 'profile, password, linking Telegram for notifications'],
  ['/app/support', 'support tickets'],
  ['/legal/offer', 'public offer (terms of sale)'],
  ['/legal/refund', 'refund policy'],
  ['/legal/privacy', 'privacy policy'],
]

export const CONTACTS = {
  manager: 'https://t.me/vladyslavarcher',
  community: 'https://t.me/+gu0HQTZLad9lOWE0',
  email: 'info@myinsideracademy.com',
  mainSite: 'https://insiderai.it.com',
}

export const HOW_IT_WORKS = [
  'Courses are recorded video lessons with written materials; learners study at their own pace in the study room. Courses with assignments take them in /app/homework, where each is reviewed and accepted or sent back for rework.',
  'Completing 100% of a course earns a certificate, shown in the cabinet (/app).',
  'The first lesson of every paid course is a free preview. AI Starter Week is entirely free.',
  'Payment is taken through Tribute. After paying, the learner opens Academy with the same email and the course is unlocked in /app.',
  'Purchases on the main site insiderai.it.com (Chat-Bot, Voice Agent programmes, VIP mentorship) also unlock learning here.',
]
