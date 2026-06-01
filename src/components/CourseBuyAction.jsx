import { Link } from 'react-router-dom'
import { getCourseTributePaymentUrl } from '../data/tributePayments'

export function CourseBuyAction({
  course,
  className,
  children,
  fallbackPath,
  external = true,
}) {
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
