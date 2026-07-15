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
import { getPackProgressForUser } from '../utils/packProgress'
import { ReferralDashboard } from '../components/ReferralDashboard'
import { TelegramConnect } from '../components/TelegramConnect'
import { WeeklyChallenge } from '../components/WeeklyChallenge'
import { CertificateShare } from '../components/CertificateShare'
import { RecommendationsStrip } from '../components/RecommendationsStrip'
import { CabinetDashboard } from '../components/CabinetDashboard'
import { api, checkApiOnline } from '../api/client'
import { getPersonalUpsells } from '../data/marketplace/recommendations'
import { hasClubMembership } from '../data/club'
import { useUserNotifications } from '../hooks/useUserNotifications'
import { syncSmartNotifications } from '../utils/smartNotifications'
import { pickContinueTarget } from '../utils/continueLearning'
import { getCourseDesignCover } from '../utils/designAssets'
import { getMarketplaceCoverImage } from '../utils/marketplaceCover'
import { getActiveGiveaways } from '../data/giveaways'
import styles from './Cabinet.module.css'

export function Cabinet() {
  const { user, purchases, apiMode, hasPurchased } = useAuth()
  const { getPercent, getProgress, syncHomeworkAccepted } = useProgress()
  const { t, lang } = useLanguage()
  const { getCourseById, courses } = useCourses()
  const { notifications, unreadCount } = useUserNotifications(user?.email)
  const [copied, setCopied] = useState(false)
  const [stats, setStats] = useState(null)
  const [team, setTeam] = useState(null)
  const [teamName, setTeamName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [myCertificates, setMyCertificates] = useState([])
  const [giveawayCount, setGiveawayCount] = useState(null)

  const hasPriority = hasClubMembership(purchases)
  const { products: recProducts, seed: recSeed } = getPersonalUpsells({ purchases, limit: 3 })

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
  const packProgress = getPackProgressForUser(purchases, getPercent, courses)

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

  useEffect(() => {
    let cancelled = false
    checkApiOnline().then(async (ok) => {
      if (cancelled) return
      if (!ok) return
      try {
        const list = await api.getGiveaways()
        const map = {}
        list.forEach((g) => { map[g.slug] = g.participantCount })
        const active = getActiveGiveaways()[0]
        if (active && map[active.slug] != null) setGiveawayCount(map[active.slug])
      } catch (_) {}
    })
    return () => { cancelled = true }
  }, [lang])

  useEffect(() => {
    if (!user?.email) return
    const continueTarget = pickContinueTarget({ purchases, courses, getPercent, getProgress })
    syncSmartNotifications({
      email: user.email,
      purchases,
      continueTarget,
      certificates: myCertificates,
      lang,
    })
  }, [user?.email, purchases, courses, getPercent, getProgress, myCertificates, lang])

  useEffect(() => {
    if (!user?.email || myCourses.length === 0) return
    let cancelled = false
    ;(async () => {
      const online = apiMode || await checkApiOnline()
      if (!online) return
      for (const course of myCourses) {
        const total = course.lessons?.length ?? 0
        if (!total) continue
        const accepted = []
        await Promise.all(
          Array.from({ length: total }, (_, index) => index).map(async (index) => {
            try {
              const hw = await api.getHomework(course.id, index)
              if (hw?.status === 'accepted') accepted.push(index)
            } catch (_) {}
          })
        )
        if (!cancelled && accepted.length) syncHomeworkAccepted(course.id, accepted)
      }
    })()
    return () => { cancelled = true }
  }, [user?.email, apiMode, purchases, courses, syncHomeworkAccepted])

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

  return (
    <div className={styles.wrap}>
      <div className={styles.container}>
        <CabinetDashboard
          lang={lang}
          notifications={notifications}
          unreadCount={unreadCount}
          giveawayCount={giveawayCount}
          stats={stats}
          certificateCount={myCertificates.length}
        />

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

        <WeeklyChallenge
          lang={lang}
          email={user?.email}
          hasPriority={hasPriority}
        />

        {packProgress.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{lang === 'ru' ? 'Прогресс по пакам' : 'Pack progress'}</h2>
            <div className={styles.packList}>
              {packProgress.map((pack) => (
                <div key={pack.packId} className={styles.packRow}>
                  <span>{lang === 'ru' ? pack.titleRu : pack.titleEn}</span>
                  <span className={styles.packMeta}>
                    {pack.completed}/{pack.total} {lang === 'ru' ? 'курсов' : 'courses'} · {pack.percent}%
                  </span>
                </div>
              ))}
            </div>
          </section>
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
                      style={{ minHeight: 120 }}
                    >
                      <img
                        src={getMarketplaceCoverImage(item)}
                        alt=""
                        className={styles.cardImage}
                        loading="lazy"
                      />
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
                        style={{ minHeight: 100 }}
                      >
                        <img
                          src={getMarketplaceCoverImage(item)}
                          alt=""
                          className={styles.cardImage}
                          loading="lazy"
                        />
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

        {recProducts.length > 0 && (
          <RecommendationsStrip
            products={recProducts}
            lang={lang}
            purchases={purchases}
            hasPurchased={hasPurchased}
            reason={
              recSeed
                ? (lang === 'ru'
                  ? `Раз у вас есть «${recSeed.titleRu}» — вам подойдёт следующее${hasPriority ? ' (−10% Club)' : ''}`
                  : `Since you own “${recSeed.titleEn}” — try these next${hasPriority ? ' (Club −10%)' : ''}`)
                : (lang === 'ru' ? 'Подборка под ваш прогресс' : 'Picked for your progress')
            }
          />
        )}

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
                      style={{ minHeight: 120 }}
                    >
                      <img
                        src={vault.coverImage}
                        alt=""
                        className={styles.cardImage}
                        loading="lazy"
                      />
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
                    <img src={getCourseDesignCover(course)} alt="" className={styles.cardImage} />
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
          <h2 className={styles.sectionTitle}>Telegram-уведомления</h2>
          <p className={styles.sectionDesc}>
            {lang === 'ru'
              ? 'Подключите бота — он пришлёт в Telegram принятые ДЗ, промокоды, новости курсов и другое.'
              : 'Connect the bot for homework, promos, course news, and more.'}
          </p>
          <TelegramConnect lang={lang} personalId={user?.personalId} />
        </section>

        <section id="certificates" className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('nav.myCertificates')}</h2>
          {myCertificates.length === 0 ? (
            <p className={styles.muted}>{lang === 'ru' ? 'Пока нет сертификатов.' : 'No certificates yet.'}</p>
          ) : (
            <ul className={styles.certList}>
              {myCertificates.map((cert, i) => (
                <li key={cert.id || i} className={styles.certCard}>
                  <div className={styles.certCardBody}>
                    <strong>{cert.courseTitle}</strong>
                    {cert.score != null && (
                      <span className={styles.certScore}>{formatCompactScore(cert.score)}</span>
                    )}
                    {(cert.date || cert.updatedAt) && (
                      <span className={styles.certDate}>
                        {new Date(cert.date || cert.updatedAt).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-GB')}
                      </span>
                    )}
                  </div>
                  <CertificateShare cert={cert} lang={lang} userName={user?.name || user?.email} />
                </li>
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
