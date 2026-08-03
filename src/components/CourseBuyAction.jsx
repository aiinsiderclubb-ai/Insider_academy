import { Link } from 'react-router-dom'
import { getCourseTributePaymentUrl } from '../data/tributePayments'
import { ComingSoonAction } from './ComingSoonLock'
import { isComingSoon } from '../config/availability'
import { useLanguage } from '../context/LanguageContext'

export function CourseBuyAction({
  course,
  className,
  children,
  fallbackPath,
  external = true,
  lang,
}) {
  const { lang: activeLang } = useLanguage()

  if (isComingSoon('courses')) {
    return <ComingSoonAction kind="courses" lang={lang || activeLang} className={className} />
  }

  const tributeUrl = getCourseTributePaymentUrl(course?.id)

  if (tributeUrl && external) {
    return (
      <a
        href={tributeUrl}
        target="_blank"
        rel="noreferrer noopener"
        className={className}
      >
        {children}
      </a>
    )
  }

  return (
    <Link to={fallbackPath} className={className}>
      {children}
    </Link>
  )
}
