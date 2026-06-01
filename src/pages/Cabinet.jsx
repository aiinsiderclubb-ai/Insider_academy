import { useState, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useProgress } from '../context/ProgressContext'
import { useLanguage } from '../context/LanguageContext'
import { useCourses } from '../context/CoursesContext'
import { getCourseField, formatCourseDuration } from '../data/courses'
import { getVaultProduct, isVaultProductId } from '../data/vaultProducts'
import { isMarketplaceProductId } from '../data/marketplace/discounts'
import { getMarketplaceProduct } from '../data/marketplace/products'
import { getMarketplaceFavorites } from '../utils/marketplaceFavorites'
import { getCertificates, getUserDiscountPercent, getCourseAverageScore, getReferrals } from '../api/adminStore'
import { ReferralDashboard } from '../components/ReferralDashboard'
import { ProgressRing } from '../components/ProgressRing'
import { api, checkApiOnline } from '../api/client'
import styles from './Cabinet.module.css'

export function Cabinet() {
  const { user, purchases, apiMode } = useAuth()
  const { getPercent } = useProgress()
  const { t, lang } = useLanguage()
  const { getCourseById } = useCourses()
  const [copied, setCopied] = useState(false)
  const [stats, setStats] = useState(null)
  const [team, setTeam] = useState(null)
  const [teamName, setTeamName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [telegramId, setTelegramId] = useState('')
  const [myCertificates, setMyCertificates] = useState([])

  const myCourses = purchases
    .filter((p) => !isVaultProductId(p.id) && !isMarketplaceProductId(p.id))
    .map((p) => getCourseById(p.id))
    .filter(Boolean)
  const myVault = purchases
    .map((p) => getVaultProduct(p.id))
    .filter(Boolean)
  const myMarketplace = purchases
    .map((p) => getMarketplaceProduct(p.id))
    .filter(Boolean)
  const favoriteProducts = getMarketplaceFavorites()
    .map((id) => getMarketplaceProduct(id))
    .filter(Boolean)
  const userDiscount = getUserDiscountPercent(user?.email || 0)
  const referralLink = user?.email ? `${window.location.origin}/?ref=${btoa(user.email)}` : ''
  const referralsCount = user?.email
    ? getReferrals().filter((r) => r.referrerEmail?.toLowerCase() === user.email.toLowerCase()).length
    : 0
  const overallProgress = myCourses.length
    ? Math.round(myCourses.reduce((s, c) => s + getPercent(c.id, c.lessons?.length ?? 0), 0) / myCourses.length)
    : 0

  useEffect(() => {
    if (!user) return
    const load = async () => {
      try {
        if (apiMode || await checkApiOnline()) {
          setStats(await api.getStats())
          setTeam(await api.getTeam())
          const certs = await api.getCertificates()
          setMyCertificates(certs || [])
          return
        }
      } catch (_) {}
      const local = (getCertificates() || []).filter(
        (c) => c.email && user.email && c.email.toLowerCase() === user.email.toLowerCase()
      )
      setMyCertificates(local)
    }
    load()
  }, [user, apiMode])

  const copyReferralLink = useCallback(() => {
    if (!referralLink) return
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }, [referralLink])

  const formatScore = (value) => {
    if (value == null || Number.isNaN(value)) return lang === 'ru' ? 'Оценка появится после проверки ДЗ' : 'Score will appear after homework review'
    return `${String(value).replace('.', ',')} / 10`
  }

  const formatCompactScore = (value) => {
    if (value == null || Number.isNaN(value)) return lang === 'ru' ? 'нет оценки' : 'no score'
    return `${String(value).replace('.', ',')} / 10`
  }

  const createTeam = async () => {
    if (!teamName.trim()) return
    const res = await api.createTeam(teamName.trim())
    setTeam(await api.getTeam())
    setTeamName('')
    if (res.inviteCode) setInviteCode(res.inviteCode)
  }

  const joinTeam = async () => {
    if (!inviteCode.trim()) return
    await api.joinTeam(inviteCode.trim())
    setTeam(await api.getTeam())
  }

  const linkTelegram = async () => {
    if (!telegramId.trim()) return
    await api.linkTelegram(telegramId.trim())
    alert(lang === 'ru' ? 'Telegram подключён' : 'Telegram linked')
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.container}>
        <div className={styles.headerRow}>
          <h1 className={styles.pageTitle}>{t('cabinet.title')}</h1>
          <ProgressRing percent={overallProgress} size={56} stroke={3}>
            <span className={styles.ringLabel}>{overallProgress}%</span>
          </ProgressRing>
        </div>

        {(user?.personalId || user?.id) && (
          <div className={styles.accountIdBanner}>
            <span>
              {t('account.personalId')}: <strong>{user.personalId || '—'}</strong>
            </span>
            <span className={styles.accountIdMeta}>
              {lang === 'ru' ? 'Внутренний ID' : 'Internal ID'}: {user.id}
            </span>
          </div>
        )}

        {stats?.streak && (
          <div className={styles.streakBanner}>
            🔥 {lang === 'ru' ? 'Серия' : 'Streak'}: {stats.streak.current} {lang === 'ru' ? 'дн.' : 'days'}
          </div>
        )}

        {stats?.chart?.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{lang === 'ru' ? 'Прогресс по курсам' : 'Course progress'}</h2>
            <div className={styles.chart}>
              {stats.chart.map((row) => {
                const c = getCourseById(row.courseId)
                const title = c ? getCourseField(c, 'title', lang) : row.courseId
                return (
                  <div key={row.courseId} className={styles.chartRow}>
                    <span className={styles.chartLabel}>{title}</span>
                    <div className={styles.chartBar}><div style={{ width: `${row.percent}%` }} /></div>
                    <span className={styles.chartPct}>{row.percent}%</span>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {userDiscount > 0 && (
          <p className={styles.discountBadge}>
            {lang === 'ru' ? `Ваша реферальная скидка: −${userDiscount}%` : `Referral discount: −${userDiscount}%`}
          </p>
        )}

        <section id="marketplace" className={styles.section}>
          <h2 className={styles.sectionTitle}>
            {lang === 'ru' ? 'Marketplace' : 'Marketplace'}
          </h2>
          <p className={styles.sectionDesc}>
            {lang === 'ru'
              ? 'Покупки, загрузки и избранное AI Insider Marketplace.'
              : 'Purchases, downloads and favorites from AI Insider Marketplace.'}
          </p>
          {myMarketplace.length > 0 ? (
            <div className={styles.cards}>
              {myMarketplace.map((item) => {
                const title = lang === 'ru' ? item.titleRu : item.titleEn
                return (
                  <Link to={`/marketplace/${item.slug}`} key={item.id} className={styles.card}>
                    <div
                      className={styles.cardImageWrap}
                      style={{ background: item.coverGradient, minHeight: 120 }}
                    >
                      <span style={{ fontSize: '2.5rem', padding: 16 }} aria-hidden>{item.coverIcon}</span>
                      <span className={styles.cardBadge}>{lang === 'ru' ? 'Скачать' : 'Download'}</span>
                    </div>
                    <h3 className={styles.cardTitle}>{title}</h3>
                    <p className={styles.cardMeta}>
                      {item.fileTypes?.join(' · ') || 'ZIP'}
                    </p>
                  </Link>
                )
              })}
            </div>
          ) : (
            <p className={styles.muted}>
              {lang === 'ru' ? 'Пока нет покупок. ' : 'No purchases yet. '}
              <Link to="/marketplace" className={styles.link}>
                {lang === 'ru' ? 'Открыть Marketplace →' : 'Browse Marketplace →'}
              </Link>
            </p>
          )}
          {favoriteProducts.length > 0 && (
            <>
              <h3 className={styles.sectionTitle} style={{ fontSize: '1rem', marginTop: 24 }}>
                {lang === 'ru' ? 'Избранное' : 'Favorites'}
              </h3>
              <div className={styles.cards}>
                {favoriteProducts.map((item) => {
                  const title = lang === 'ru' ? item.titleRu : item.titleEn
                  const owned = myMarketplace.some((m) => m.id === item.id)
                  return (
                    <Link to={`/marketplace/${item.slug}`} key={item.id} className={styles.card}>
                      <div
                        className={styles.cardImageWrap}
                        style={{ background: item.coverGradient, minHeight: 100 }}
                      >
                        <span style={{ fontSize: '2rem', padding: 12 }} aria-hidden>{item.coverIcon}</span>
                      </div>
                      <h3 className={styles.cardTitle}>{title}</h3>
                      <p className={styles.cardMeta}>
                        {owned
                          ? (lang === 'ru' ? 'Куплено' : 'Owned')
                          : `${item.priceEur}€`}
                      </p>
                    </Link>
                  )
                })}
              </div>
            </>
          )}
        </section>

        {myVault.length > 0 && (
          <section id="vault" className={styles.section}>
            <h2 className={styles.sectionTitle}>
              {lang === 'ru' ? 'AI Insider Vault' : 'AI Insider Vault'}
            </h2>
            <p className={styles.sectionDesc}>
              {lang === 'ru'
                ? 'Готовые ресурсы и шаблоны — скачивание и обновления в этом разделе.'
                : 'Ready resources and templates — download and updates in this section.'}
            </p>
            <div className={styles.cards}>
              {myVault.map((vault) => {
                const title = lang === 'ru' ? vault.titleRu : vault.titleEn
                return (
                  <Link to={`/vault/${vault.slug}`} key={vault.id} className={styles.card}>
                    <div
                      className={styles.cardImageWrap}
                      style={{ background: vault.gradient, minHeight: 120 }}
                    >
                      {vault.coverImage ? (
                        <img src={vault.coverImage} alt="" className={styles.cardImage} />
                      ) : (
                        <span style={{ fontSize: '2.5rem', padding: 16 }} aria-hidden>{vault.icon}</span>
                      )}
                      <span className={styles.cardBadge}>Vault</span>
                    </div>
                    <h3 className={styles.cardTitle}>{title}</h3>
                    <p className={styles.cardMeta}>
                      {lang === 'ru' ? 'Доступ открыт' : 'Access granted'}
                    </p>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {myCourses.length === 0 ? (
          <div className={styles.empty}>
            <p>{t('cabinet.empty')}</p>
            <Link to="/courses" className={styles.link}>{t('cabinet.toCatalog')}</Link>
          </div>
        ) : (
          <div className={styles.cards}>
            {myCourses.map((course) => {
              const percent = getPercent(course.id, course.lessons?.length ?? 0)
              const title = getCourseField(course, 'title', lang)
              const duration = formatCourseDuration(course, lang)
              const score = getCourseAverageScore(user?.email, course.id)
              return (
                <Link to={`/courses/${course.slug}`} key={course.id} className={styles.card}>
                  <div className={styles.cardImageWrap}>
                    <img src={course.image} alt="" className={styles.cardImage} />
                    <span className={styles.cardBadge}>{t('cabinet.accessOpen')}</span>
                    <div className={styles.cardProgressBar}><div className={styles.cardProgressFill} style={{ width: `${percent}%` }} /></div>
                    <span className={styles.cardPercent}>{percent}% {t('cabinet.completed')}</span>
                  </div>
                  <h3 className={styles.cardTitle}>{title}</h3>
                  <p className={styles.cardMeta}>{duration}</p>
                  <div className={styles.cardStats}>
                    <p className={styles.cardStatRow}><span>{lang === 'ru' ? 'Пройдено:' : 'Done:'}</span><strong>{percent}%</strong></p>
                    <p className={styles.cardStatRow}><span>{lang === 'ru' ? 'Балл:' : 'Score:'}</span><strong>{formatCompactScore(score)}</strong></p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        <section id="awards" className={styles.section}>
          <h2 className={styles.sectionTitle}>{lang === 'ru' ? 'Награды' : 'Achievements'}</h2>
          {!stats?.achievements?.length ? (
            <p className={styles.muted}>{lang === 'ru' ? 'Учитесь — награды появятся здесь.' : 'Keep learning to unlock achievements.'}</p>
          ) : (
            <div className={styles.awardsGrid}>
              {stats.achievements.map((a) => (
                <div key={a.id} className={styles.awardCard}>
                  <span className={styles.awardIcon}>{a.icon}</span>
                  <strong>{lang === 'en' ? a.titleEn : a.titleRu}</strong>
                  <p>{lang === 'en' ? a.descEn : a.descRu}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section id="team" className={styles.section}>
          <h2 className={styles.sectionTitle}>{lang === 'ru' ? 'Корпоративный доступ' : 'Team access'}</h2>
          {team?.team ? (
            <div>
              <p><strong>{team.team.name}</strong> · {team.members?.length || 0} {lang === 'ru' ? 'участников' : 'members'}</p>
              <p className={styles.muted}>{lang === 'ru' ? 'Код приглашения' : 'Invite code'}: <code>{team.team.inviteCode}</code></p>
            </div>
          ) : (
            <div className={styles.teamForms}>
              <div>
                <input placeholder={lang === 'ru' ? 'Название команды' : 'Team name'} value={teamName} onChange={(e) => setTeamName(e.target.value)} className={styles.referralInput} />
                <button type="button" onClick={createTeam} className={styles.copyBtn}>{lang === 'ru' ? 'Создать' : 'Create'}</button>
              </div>
              <div>
                <input placeholder={lang === 'ru' ? 'Код приглашения' : 'Invite code'} value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} className={styles.referralInput} />
                <button type="button" onClick={joinTeam} className={styles.copyBtn}>{lang === 'ru' ? 'Вступить' : 'Join'}</button>
              </div>
            </div>
          )}
        </section>

        <section id="telegram" className={styles.section}>
          <h2 className={styles.sectionTitle}>Telegram</h2>
          <p className={styles.sectionDesc}>{lang === 'ru' ? 'Подключите бота для напоминаний об уроках. Напишите /start боту и вставьте Chat ID.' : 'Connect Telegram for lesson reminders.'}</p>
          <div className={styles.referralRow}>
            <input value={telegramId} onChange={(e) => setTelegramId(e.target.value)} placeholder="Chat ID" className={styles.referralInput} />
            <button type="button" onClick={linkTelegram} className={styles.copyBtn}>{lang === 'ru' ? 'Подключить' : 'Link'}</button>
          </div>
        </section>

        <section id="certificates" className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('nav.myCertificates')}</h2>
          {myCertificates.length === 0 ? (
            <p className={styles.muted}>{lang === 'ru' ? 'Пока нет сертификатов.' : 'No certificates yet.'}</p>
          ) : (
            <ul className={styles.certList}>
              {myCertificates.map((cert, i) => (
                <li key={i}><span>{cert.courseTitle}</span></li>
              ))}
            </ul>
          )}
        </section>

        <ReferralDashboard
          lang={lang}
          discount={userDiscount}
          referralLink={referralLink}
          copied={copied}
          onCopy={copyReferralLink}
          referralsCount={referralsCount}
        />
      </div>
    </div>
  )
}
