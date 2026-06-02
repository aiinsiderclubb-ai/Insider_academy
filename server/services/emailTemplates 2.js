/** Общая HTML-обёртка для писем Academy */
export function emailLayout({ title, bodyHtml, footerNote }) {
  return `
  <div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#e8e8f0;background:#0f0f14;border-radius:16px;border:1px solid #2a2a38">
    <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#a78bfa">AI Insider Academy</p>
    <h1 style="margin:0 0 16px;font-size:20px;font-weight:800;color:#fff">${title}</h1>
    ${bodyHtml}
    <p style="margin-top:28px;font-size:12px;color:#888">${footerNote || 'Если вы не запрашивали это письмо — просто проигнорируйте его.'}</p>
    <p style="margin-top:8px;font-size:12px;color:#666"><a href="https://myinsideracademy.com" style="color:#a78bfa">myinsideracademy.com</a></p>
  </div>`
}

export function primaryButton(href, label) {
  return `<p style="margin:24px 0"><a href="${href}" style="display:inline-block;padding:12px 24px;border-radius:999px;font-weight:700;text-decoration:none;color:#fff;background:linear-gradient(135deg,#7c3aed,#f97316)">${label}</a></p>`
}
