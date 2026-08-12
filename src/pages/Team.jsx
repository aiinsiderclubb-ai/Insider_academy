import { Link } from 'react-router-dom'
import { ArrowUpRight, Bot, Mic2, Network, Workflow } from 'lucide-react'
import { PageMeta } from '../components/PageMeta'
import { useLanguage } from '../context/LanguageContext'
import styles from './Team.module.css'

const EXPERTISE = [
  { Icon: Workflow, ru: 'n8n и бизнес-автоматизация', en: 'n8n and business automation' },
  { Icon: Bot, ru: 'AI-агенты и MCP', en: 'AI agents and MCP' },
  { Icon: Mic2, ru: 'Голосовые агенты', en: 'Voice agents' },
  { Icon: Network, ru: 'Архитектура клиентских систем', en: 'Client system architecture' },
]

export function Team() {
  const { lang } = useLanguage()
  const ru = lang === 'ru'
  return (
    <main className={styles.page}>
      <PageMeta title={ru ? 'Команда и менторы' : 'Team and mentors'} description={ru ? 'Кто создаёт программы AI Insider Academy и проверяет практические проекты.' : 'People building AI Insider Academy programs and reviewing practical projects.'} path="/team" />
      <section className={styles.hero}>
        <p className={styles.eyebrow}>AI INSIDER / PEOPLE</p>
        <h1>{ru ? 'Практики, которые строят системы — и учат на них' : 'Practitioners who build systems — and teach from them'}</h1>
        <p>{ru ? 'Публикуем только подтверждённых участников команды. Без вымышленных должностей, стоковых профилей и анонимных «экспертов».' : 'Only verified team members are published. No invented titles, stock profiles or anonymous “experts”.'}</p>
      </section>

      <section className={styles.profile}>
        <div className={styles.portrait}>
          <img src="/design/ai-insider-mentor.webp" alt="Vladyslav Archer" />
          <span>{ru ? 'Основатель · Lead mentor' : 'Founder · Lead mentor'}</span>
        </div>
        <div className={styles.bio}>
          <p className={styles.index}>01 / CORE TEAM</p>
          <h2>Vladyslav Archer</h2>
          <p>{ru ? 'Создаёт AI-чатботов, голосовых агентов и n8n-автоматизации для бизнеса. В Academy отвечает за архитектуру программ, практические задания и выпуск Marketplace kits.' : 'Builds AI chatbots, voice agents and n8n automations for businesses. Leads program architecture, practical assignments and Marketplace kit releases.'}</p>
          <div className={styles.grid}>
            {EXPERTISE.map(({ Icon, ru: ruText, en }) => <div key={en}><Icon size={18} /><span>{ru ? ruText : en}</span></div>)}
          </div>
          <Link to="/courses" className={styles.link}>{ru ? 'Посмотреть программы' : 'View programs'} <ArrowUpRight size={18} /></Link>
        </div>
      </section>

      <section className={styles.mentorPolicy}>
        <p className={styles.index}>MENTOR STANDARD</p>
        <h2>{ru ? 'Как появятся новые менторы' : 'How new mentors are added'}</h2>
        <p>{ru ? 'Профиль публикуется после подтверждения личности, специализации, формата обратной связи и проектов, которые можно проверить. До этого направление не выдаётся за персонального ментора.' : 'A profile goes live only after identity, expertise, feedback format and verifiable projects are confirmed. Until then, a discipline is not presented as a personal mentor.'}</p>
      </section>
    </main>
  )
}
