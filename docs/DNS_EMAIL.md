# Email DNS — myinsideracademy.com

Mailbox: **info@myinsideracademy.com**  
Render env: `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`

## GoDaddy / Microsoft 365 (smtpout.secureserver.net)

| Render env | Value |
|------------|-------|
| `SMTP_HOST` | `smtpout.secureserver.net` |
| `SMTP_PORT` | `465` |
| `SMTP_SECURE` | `true` |
| `SMTP_USER` | `info@myinsideracademy.com` |

Enable **SMTP AUTH** for the mailbox in admin panel.

## DNS records (typical)

Add at your DNS host (GoDaddy, Cloudflare, etc.):

### SPF (TXT on root `@` or `myinsideracademy.com`)

```
v=spf1 include:secureserver.net ~all
```

If using Brevo instead:

```
v=spf1 include:spf.brevo.com ~all
```

### DKIM

Copy **exact** TXT records from your provider (GoDaddy Email, Microsoft 365, or Brevo).  
Usually named `selector._domainkey.myinsideracademy.com`.

### DMARC (recommended)

```
_dmarc.myinsideracademy.com  TXT  "v=DMARC1; p=none; rua=mailto:info@myinsideracademy.com"
```

After deliverability is stable, change `p=none` → `p=quarantine`.

## Verification

1. [https://www.mail-tester.com](https://www.mail-tester.com) — send test from admin panel  
2. Render logs — no `SMTP` errors on register / reset  
3. `APP_URL=https://myinsideracademy.com` so reset links use production domain
