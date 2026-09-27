import crypto from 'crypto'
import net from 'net'

/*
 * The web front end talks to this API from its own servers, so without help
 * `req.ip` is the front end's egress address for every visitor at once — and
 * every IP-keyed limit here (all of /api/auth at 30 per 15 minutes, the Studio
 * login at 5, the global 300 a minute) becomes one shared bucket for the whole
 * site. On a launch day the tenth new sign-up locks registration for everyone.
 *
 * The front end therefore passes the visitor's address in `x-client-ip`,
 * together with a secret only the two servers share. When the secret checks
 * out, that address replaces `req.ip` for the rest of the request, so every
 * existing limiter keys by the real visitor without being touched. Anyone
 * calling the API directly cannot supply the secret, and without it nothing
 * changes — including when WEB_PROXY_SECRET is not configured at all, which
 * makes this safe to deploy before either side has the value.
 */

function sameSecret(given, expected) {
  // Hash first so the comparison is constant-time regardless of length.
  const a = crypto.createHash('sha256').update(String(given)).digest()
  const b = crypto.createHash('sha256').update(String(expected)).digest()
  return crypto.timingSafeEqual(a, b)
}

export function trustWebProxyClientIp(req, _res, next) {
  const secret = process.env.WEB_PROXY_SECRET
  if (!secret) return next()

  const proof = req.get('x-web-proxy-secret')
  const claimed = String(req.get('x-client-ip') || '').trim()
  if (proof && claimed && net.isIP(claimed) && sameSecret(proof, secret)) {
    // `ip` is a getter on the request prototype; an own property shadows it.
    Object.defineProperty(req, 'ip', { value: claimed, configurable: true, enumerable: true })
  }
  next()
}
