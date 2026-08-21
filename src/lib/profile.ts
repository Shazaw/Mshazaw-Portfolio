import type { Media, Profile } from '@/payload-types'

/** The navbar's `[CV]` prefers an explicit URL and falls back to the upload. */
export const cvHref = (profile: Profile): string | null => {
  if (profile.cvUrl) return profile.cvUrl
  const file = profile.cvFile as Media | string | null | undefined
  if (file && typeof file === 'object' && file.url) return file.url
  return null
}

export const mediaUrl = (value: unknown): string | null => {
  if (value && typeof value === 'object' && 'url' in value) {
    const url = (value as Media).url
    return typeof url === 'string' ? url : null
  }
  return null
}
