import type { Metadata } from 'next'
import { RichText } from '@payloadcms/richtext-lexical/react'
import Image from 'next/image'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { SurveyLabel } from '@/components/ui/SurveyLabel'
import { getProfile } from '@/lib/data'
import { mediaUrl } from '@/lib/profile'
import type { Media } from '@/payload-types'
import styles from './about.module.css'

export const metadata: Metadata = {
  title: 'About',
  description: 'Background, focus areas, education and toolkit.',
}

/** 2D only, no chamber (spec §3). */
const About = async () => {
  const profile = await getProfile()
  const portrait = profile.portrait as Media | null | undefined
  const portraitUrl = mediaUrl(portrait)
  const focusAreas = profile.focusAreas ?? []
  const skills = profile.skills ?? []
  const education = profile.education ?? []

  return (
    <main id="main" className={styles.page}>
      <header className={styles.head}>
        <Eyebrow>01 · About · Long version</Eyebrow>
        <div className={styles.headGrid}>
          <div>
            <h1 className={styles.title}>{profile.name}</h1>
            {profile.role ? <p className={styles.role}>{profile.role}</p> : null}
            {profile.aboutIntro ? <p className={styles.intro}>{profile.aboutIntro}</p> : null}
          </div>
          {portraitUrl ? (
            <div className={styles.portrait}>
              <Image
                src={portraitUrl}
                alt={portrait?.alt ?? profile.name}
                width={portrait?.width ?? 640}
                height={portrait?.height ?? 800}
                sizes="(max-width: 860px) 100vw, 360px"
                priority
              />
            </div>
          ) : null}
        </div>
        <SurveyLabel className={styles.survey}>
          Sec 01 · About · {profile.location ?? ''} {profile.coordinates ? `· ${profile.coordinates}` : ''}
        </SurveyLabel>
      </header>

      {focusAreas.length > 0 ? (
        <section className={styles.focusStrip} aria-label="Focus areas">
          {focusAreas.map((area) => (
            <article key={area.id ?? area.title} className={styles.focusCell}>
              {area.tag ? <span className={styles.focusTag}>{area.tag}</span> : null}
              <h2 className={styles.focusTitle}>{area.title}</h2>
              <p className={styles.focusBody}>{area.body}</p>
            </article>
          ))}
        </section>
      ) : null}

      {profile.about ? (
        <section className={styles.prose}>
          <RichText data={profile.about} />
        </section>
      ) : null}

      {education.length > 0 ? (
        <section className={styles.block}>
          <Eyebrow>Education</Eyebrow>
          <ul className={styles.rows}>
            {education.map((entry) => (
              <li key={entry.id ?? entry.institution} className={styles.row}>
                <span className={styles.rowPeriod}>{entry.period}</span>
                <span className={styles.rowMain}>
                  <strong>{entry.program}</strong>
                  <span className={styles.rowSub}>{entry.institution}</span>
                </span>
                {entry.detail ? <span className={styles.rowDetail}>{entry.detail}</span> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {skills.length > 0 ? (
        <section className={styles.block}>
          <Eyebrow>Toolkit</Eyebrow>
          <div className={styles.skillGrid}>
            {skills.map((group) => (
              <div key={group.id ?? group.group} className={styles.skillGroup}>
                <h3 className={styles.skillTitle}>{group.group}</h3>
                <ul className={styles.skillList}>
                  {(group.items ?? []).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className={styles.contact}>
        <Eyebrow>Contact</Eyebrow>
        <a className={styles.mail} href={`mailto:${profile.email}`}>
          {profile.email}
        </a>
      </section>
    </main>
  )
}

export default About
