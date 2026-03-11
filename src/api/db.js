/**
 * Заготовка для подключения к базе данных.
 * Позже можно подключить PostgreSQL, MongoDB, Supabase и т.д.
 * Сейчас все данные берутся из localStorage и статического data/.
 */

// Пример: после подключения БД раскомментировать и настроить
// import { createClient } from '@supabase/supabase-js'
// const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

/**
 * Получить пользователя по email (для авторизации)
 * @param {string} email
 * @returns {Promise<{ id: string, email: string, name?: string } | null>}
 */
export async function getUserByEmail(email) {
  // TODO: заменить на запрос к БД
  // const { data } = await supabase.from('users').select('*').eq('email', email).single()
  return null
}

/**
 * Создать или обновить пользователя
 * @param {{ email: string, name?: string }}
 * @returns {Promise<{ id: string }>}
 */
export async function upsertUser({ email, name }) {
  // TODO: insert/update в БД
  return { id: email }
}

/**
 * Получить покупки пользователя
 * @param {string} userId
 * @returns {Promise<Array<{ courseId: string, purchasedAt: string }>>}
 */
export async function getPurchases(userId) {
  // TODO: select из таблицы purchases
  return []
}

/**
 * Записать покупку курса
 * @param {string} userId
 * @param {string} courseId
 * @returns {Promise<void>}
 */
export async function addPurchase(userId, courseId) {
  // TODO: insert в purchases с purchasedAt = now()
}

/**
 * Получить список постов блога (для главной и страницы /blog)
 * @returns {Promise<Array<{ id: string, title: string, excerpt: string, slug: string, date: string }>>}
 */
export async function getBlogPosts(limit = 10) {
  // TODO: select из таблицы blog_posts, order by date desc
  return []
}

/**
 * Получить один пост по slug
 * @param {string} slug
 * @returns {Promise<{ id: string, title: string, body: string, date: string } | null>}
 */
export async function getBlogPostBySlug(slug) {
  // TODO: select from blog_posts where slug = ?
  return null
}
