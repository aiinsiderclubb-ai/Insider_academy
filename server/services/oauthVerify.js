import { createRemoteJWKSet, jwtVerify } from 'jose'
import { OAuth2Client } from 'google-auth-library'
import { config, isGoogleOAuthEnabled, isAppleOAuthEnabled } from '../config.js'

const appleJwks = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'))

let googleClient = null

function getGoogleClient() {
  if (!googleClient) {
    googleClient = new OAuth2Client(config.oauth.google.clientId)
  }
  return googleClient
}

/**
 * @returns {Promise<{ email: string, name: string, sub: string, emailVerified: boolean }>}
 */
export async function verifyGoogleIdToken(idToken) {
  if (!isGoogleOAuthEnabled()) {
    throw Object.assign(new Error('Google OAuth is not configured'), { status: 503 })
  }
  const ticket = await getGoogleClient().verifyIdToken({
    idToken,
    audience: config.oauth.google.clientId,
  })
  const payload = ticket.getPayload()
  if (!payload?.email) {
    throw Object.assign(new Error('Google token missing email'), { status: 400 })
  }
  return {
    email: String(payload.email).trim().toLowerCase(),
    name: String(payload.name || payload.given_name || payload.email.split('@')[0]).trim(),
    sub: String(payload.sub),
    emailVerified: Boolean(payload.email_verified),
  }
}

/**
 * @returns {Promise<{ email: string, name: string, sub: string, emailVerified: boolean }>}
 */
export async function verifyAppleIdToken(idToken, fullName) {
  if (!isAppleOAuthEnabled()) {
    throw Object.assign(new Error('Apple OAuth is not configured'), { status: 503 })
  }
  const audience = config.oauth.apple.clientId
  const { payload } = await jwtVerify(idToken, appleJwks, {
    issuer: 'https://appleid.apple.com',
    audience,
  })
  const email = payload.email ? String(payload.email).trim().toLowerCase() : ''
  if (!email) {
    throw Object.assign(new Error('Apple token missing email'), {
      status: 400,
      errorRu: 'Apple не передал email. Разрешите доступ к email при входе или войдите другим способом.',
    })
  }
  const nameFromApple = [fullName?.firstName, fullName?.lastName].filter(Boolean).join(' ').trim()
  return {
    email,
    name: nameFromApple || email.split('@')[0],
    sub: String(payload.sub),
    emailVerified: payload.email_verified === true || payload.email_verified === 'true',
  }
}

export async function verifyOAuthIdToken(provider, idToken, fullName) {
  if (provider === 'google') return verifyGoogleIdToken(idToken)
  if (provider === 'apple') return verifyAppleIdToken(idToken, fullName)
  throw Object.assign(new Error('Unsupported OAuth provider'), { status: 400 })
}
