import { getDb, parseJson } from './db.js'
import { courses as defaultCourses } from '../src/data/courses.js'
import { blogPosts as defaultBlog } from '../src/data/blog.js'

export async function seedIfEmpty() {
  const db = getDb()
  const countRow = await db.get('SELECT COUNT(*) AS n FROM courses')
  const count = Number(countRow?.n || 0)
  if (count === 0) {
    for (const c of defaultCourses) {
      await db.run('INSERT INTO courses (id, data) VALUES (?, ?)', [c.id, JSON.stringify(c)])
    }
    console.log(`[seed] ${defaultCourses.length} courses loaded`)
  }

  const blogRow = await db.get('SELECT COUNT(*) AS n FROM blog_posts')
  if (Number(blogRow?.n || 0) === 0 && defaultBlog?.length) {
    for (const p of defaultBlog) {
      await db.run('INSERT INTO blog_posts (id, data) VALUES (?, ?)', [p.id, JSON.stringify(p)])
    }
    console.log(`[seed] ${defaultBlog.length} blog posts loaded`)
  }

  const analytics = await db.get('SELECT value FROM analytics WHERE key = ?', ['main'])
  if (!analytics) {
    await db.run('INSERT INTO analytics (key, value) VALUES (?, ?)', ['main', JSON.stringify({ visits: 0, courseClicks: {} })])
  }
}
