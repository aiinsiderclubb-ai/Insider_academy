/** Table-based email kit. Dark brand header + light letter — survives Gmail/Outlook. */

export const COLORS = {
  canvas: '#07060f',
  header: '#0f0c1f',
  card: '#ffffff',
  ink: '#14121c',
  body: '#3d3850',
  muted: '#5c5670',
  faint: '#8a84a0',
  line: '#ece8f4',
  violet: '#7c3aed',
  violetSoft: '#f3eefe',
  orange: '#f97316',
  codeBg: '#f4f0ff',
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function primaryButton(href, label) {
  const safeHref = escapeHtml(href)
  const safeLabel = escapeHtml(label)
  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:28px 0 4px">
      <tr>
        <td align="left" bgcolor="${COLORS.violet}" style="border-radius:999px;background:${COLORS.violet}">
          <a href="${safeHref}" style="display:inline-block;padding:14px 28px;border-radius:999px;font:700 15px/1 system-ui,-apple-system,sans-serif;text-decoration:none;color:#ffffff">${safeLabel}</a>
        </td>
      </tr>
    </table>
  `
}

export function otpBlock(code) {
  const digits = escapeHtml(String(code || '').replace(/\s/g, ''))
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0">
      <tr>
        <td align="center" style="background:${COLORS.codeBg};border:1px solid ${COLORS.line};border-radius:18px;padding:26px 16px">
          <p style="margin:0 0 8px;font:700 11px/1 system-ui,sans-serif;letter-spacing:0.16em;text-transform:uppercase;color:${COLORS.violet}">CODE</p>
          <p style="margin:0;font:800 34px/1.1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:12px;color:${COLORS.ink}">${digits}</p>
        </td>
      </tr>
    </table>
  `
}

export function featureCard(title, subtitle = '') {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 8px">
      <tr>
        <td style="background:${COLORS.violetSoft};border-radius:16px;padding:16px 18px">
          <p style="margin:0 0 4px;font:700 11px/1 system-ui,sans-serif;letter-spacing:0.12em;text-transform:uppercase;color:${COLORS.violet}">Academy</p>
          <p style="margin:0;font:700 16px/1.35 system-ui,-apple-system,sans-serif;color:${COLORS.ink}">${escapeHtml(title)}</p>
          ${subtitle ? `<p style="margin:6px 0 0;font:14px/1.45 system-ui,sans-serif;color:${COLORS.muted}">${escapeHtml(subtitle)}</p>` : ''}
        </td>
      </tr>
    </table>
  `
}

function brandHeader(siteUrl) {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.header}">
      <tr>
        <td style="padding:22px 28px 18px">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td width="36" height="36" align="center" valign="middle" bgcolor="${COLORS.violet}" style="width:36px;height:36px;border-radius:10px;background:${COLORS.violet};color:#ffffff;font:800 15px/36px system-ui,sans-serif">A</td>
              <td style="padding-left:12px">
                <p style="margin:0;font:800 13px/1.2 system-ui,sans-serif;letter-spacing:0.14em;text-transform:uppercase;color:#ffffff">AI Insider</p>
                <p style="margin:3px 0 0;font:12px/1 system-ui,sans-serif;color:#c4b5fd">Academy</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="height:5px;background:${COLORS.violet};background:linear-gradient(90deg,${COLORS.violet},${COLORS.orange});font-size:0;line-height:0">&nbsp;</td>
      </tr>
    </table>
  `
}

export function emailLayout({
  title,
  kicker = '',
  preheader = '',
  bodyHtml,
  footerNote,
  locale = 'ru',
  unsubscribeUrl = '',
  brand = 'AI Insider Academy',
  siteUrl = 'https://myinsideracademy.com',
  unsubscribeLabel = '',
}) {
  const safeTitle = escapeHtml(title)
  const safeKicker = escapeHtml(kicker)
  const safeBrand = escapeHtml(brand)
  const safeNote = escapeHtml(footerNote || '')
  const safePreheader = escapeHtml(preheader)
  const safeSite = escapeHtml(siteUrl)
  const year = new Date().getFullYear()

  return `<!DOCTYPE html>
<html lang="${escapeHtml(locale)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${safeTitle}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.canvas}">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${safePreheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.canvas};padding:32px 12px">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:20px;overflow:hidden">
          <tr>
            <td>
              ${brandHeader(safeSite)}
            </td>
          </tr>
          <tr>
            <td style="background:${COLORS.card};padding:32px 32px 36px">
              ${safeKicker ? `<p style="margin:0 0 10px;font:700 11px/1.2 system-ui,sans-serif;letter-spacing:0.16em;text-transform:uppercase;color:${COLORS.violet}">${safeKicker}</p>` : ''}
              <h1 style="margin:0 0 16px;font:800 26px/1.25 system-ui,-apple-system,sans-serif;color:${COLORS.ink}">${safeTitle}</h1>
              ${bodyHtml}
              ${safeNote ? `<p style="margin:28px 0 0;font:13px/1.5 system-ui,-apple-system,sans-serif;color:${COLORS.faint}">${safeNote}</p>` : ''}
            </td>
          </tr>
          <tr>
            <td style="background:${COLORS.header};padding:18px 28px">
              <p style="margin:0;font:12px/1.5 system-ui,sans-serif;color:#9b93b5">
                ${safeBrand} · ${year}<br>
                <a href="${safeSite}" style="color:#ddd6fe;text-decoration:none">${safeSite.replace(/^https?:\/\//, '')}</a>
                ${unsubscribeUrl ? `<br><a href="${escapeHtml(unsubscribeUrl)}" style="color:#7c7593">${escapeHtml(unsubscribeLabel)}</a>` : ''}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function unsubscribePageHtml({ title, lead, siteUrl }) {
  return emailLayout({
    title,
    kicker: 'Academy',
    bodyHtml: `<p style="margin:0;font:16px/1.6 system-ui,-apple-system,sans-serif;color:#3d3850">${escapeHtml(lead)}</p>${primaryButton(siteUrl, 'AI Insider Academy')}`,
    footerNote: '',
    siteUrl,
  })
}
