import styles from './Footer.module.css'
import type { Profile } from '@/payload-types'

export const Footer = ({ profile }: { profile: Profile }) => {
  const socials = (profile.socials ?? []).filter((s) => s?.label && s?.url)
  const year = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <span>
        © {year} {profile.name}
      </span>
      {profile.coordinates ? <span>{profile.coordinates}</span> : null}
      <div className={styles.socials}>
        {socials.map((social) => (
          <a key={social.id ?? social.url} href={social.url} target="_blank" rel="noreferrer noopener me">
            {social.label}
          </a>
        ))}
        {profile.email ? <a href={`mailto:${profile.email}`}>Mail</a> : null}
      </div>
    </footer>
  )
}
