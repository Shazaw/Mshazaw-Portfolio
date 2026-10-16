/** Prefer an explicit custom domain; otherwise Vercel supplies the production domain. */
const domain = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL

export const siteURL = (process.env.NEXT_PUBLIC_SERVER_URL || (domain ? `https://${domain}` : 'http://localhost:3000')).replace(/\/$/, '')
