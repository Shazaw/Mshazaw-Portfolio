import { Chapter, chapterStyles as styles } from '@/components/journey/Chapter'
import { HomeScene } from '@/components/journey/HomeScene'
import { SmoothScroll } from '@/components/journey/SmoothScroll'
import { Reveal } from '@/components/journey/Reveal'
import { CardStrip } from '@/components/strips/CardStrip'
import { EnterButton } from '@/components/ui/EnterButton'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { getCtfStats, getFeaturedItems, getProfile, getSectionItems } from '@/lib/data'
import { SECTIONS } from '@/lib/sections'
import type { SectionKey } from '@/lib/types'

/** Chapters 02, 03, 04 and 06 each present their top items as a card strip. */
const STRIP_SECTIONS: SectionKey[] = ['projects', 'experience', 'organizations', 'awards']

/**
 * Splits a hero line so the accent word can be drawn as an outlined stroke
 * wherever it happens to sit, rather than assuming it is a whole line.
 */
const heroLine = (line: string, accent: string | null | undefined, strokeClass: string) => {
  if (!accent) return line
  const index = line.toUpperCase().indexOf(accent.toUpperCase())
  if (index < 0) return line
  return (
    <>
      {line.slice(0, index)}
      <span className={strokeClass}>{line.slice(index, index + accent.length)}</span>
      {line.slice(index + accent.length)}
    </>
  )
}

const Home = async () => {
  const [profile, ctf] = await Promise.all([getProfile(), getCtfStats()])

  const strips = await Promise.all(
    STRIP_SECTIONS.map(async (key) => ({
      key,
      section: SECTIONS[key],
      items: await getFeaturedItems(key, 3),
      total: (await getSectionItems(key)).length,
    })),
  )

  const byKey = Object.fromEntries(strips.map((strip) => [strip.key, strip])) as Record<
    SectionKey,
    (typeof strips)[number]
  >

  const stripChapter = (key: SectionKey) => {
    const { section, items, total } = byKey[key]
    if (total === 0) return null
    return (
      <Chapter
        key={key}
        id={key}
        eyebrow={`${section.num} · ${section.label} · Selected`}
        heading={section.heading}
        blurb={section.blurb}
      >
        <CardStrip items={items} route={section.route} />
        <Reveal>
          <EnterButton href={section.route} label={`Enter ${section.label} grid`} />
        </Reveal>
      </Chapter>
    )
  }

  const focusAreas = profile.focusAreas ?? []
  const skills = profile.skills ?? []
  const education = profile.education ?? []

  return (
    <>
      <SmoothScroll />
      <HomeScene />

      <main id="main" className={styles.main}>
        {/* 00 — HELLO */}
        <section className={`${styles.chapter} ${styles.hero}`}>
          <Eyebrow>00 · Hello · {profile.location ?? 'Yogyakarta, ID'}</Eyebrow>
          <h1 className={styles.title}>
            {heroLine(profile.heroLineOne, profile.heroAccentWord, styles.stroke)}
            <br />
            {heroLine(profile.heroLineTwo, profile.heroAccentWord, styles.stroke)}
          </h1>
          <p className={`${styles.sub} ${styles.heroSub}`}>{profile.tagline}</p>
          <div className={styles.scrollcue}>
            <span className={styles.cueBar} aria-hidden="true" />
            Scroll to survey
          </div>
        </section>

        {/* 01 — ABOUT. The whole of it: there is no separate page. */}
        <Chapter id="about" eyebrow="01 · About" heading="Who is surveying">
          {profile.aboutIntro ? <p className={styles.aboutLead}>{profile.aboutIntro}</p> : null}
          {profile.about ? (
            <div className={styles.aboutProse}>
              <RichText data={profile.about} />
            </div>
          ) : null}

          {focusAreas.length > 0 ? (
            <Reveal>
              <div className={styles.focusStrip}>
                {focusAreas.map((area) => (
                  <article key={area.id ?? area.title} className={styles.focusCell}>
                    {area.tag ? <span className={styles.focusTag}>{area.tag}</span> : null}
                    <h3 className={styles.focusTitle}>{area.title}</h3>
                    <p className={styles.focusBody}>{area.body}</p>
                  </article>
                ))}
              </div>
            </Reveal>
          ) : null}

          {education.length > 0 ? (
            <Reveal>
              <ul className={styles.eduRows}>
                {education.map((entry) => (
                  <li key={entry.id ?? entry.institution} className={styles.eduRow}>
                    <span className={styles.eduPeriod}>{entry.period}</span>
                    <span className={styles.eduMain}>
                      <strong>{entry.program}</strong>
                      <span className={styles.eduSub}>{entry.institution}</span>
                    </span>
                    {entry.detail ? <span className={styles.eduDetail}>{entry.detail}</span> : null}
                  </li>
                ))}
              </ul>
            </Reveal>
          ) : null}
        </Chapter>

        {stripChapter('projects')}
        {stripChapter('experience')}
        {stripChapter('organizations')}

        {/* 05 — CTF */}
        <Chapter
          id="ctf"
          eyebrow="05 · CTF · Capture the flag"
          heading="Flags, both sides of the board"
          blurb="Solved as a player, authored as an organiser. Both are logged."
        >
          <Reveal>
            <div className={styles.statrow}>
              <div>
                <div className={styles.statNum}>{ctf.solved}</div>
                <div className={styles.statLabel}>Challenges solved</div>
              </div>
              <div>
                <div className={`${styles.statNum} ${styles.statNumOutlined}`}>{ctf.authored}</div>
                <div className={styles.statLabel}>Challenges authored</div>
              </div>
              <div>
                <div className={styles.statNum}>{ctf.podiums}</div>
                <div className={styles.statLabel}>Podiums &amp; finals</div>
              </div>
            </div>
            <EnterButton href="/ctf" label="Enter CTF grid" />
          </Reveal>
        </Chapter>

        {stripChapter('awards')}

        {/* 07 — TOOLKIT, the last thing before the footer. */}
        {skills.length > 0 ? (
          <Chapter id="toolkit" eyebrow="07 · Toolkit · What it is built with">
            <Reveal>
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
            </Reveal>
          </Chapter>
        ) : null}
      </main>
    </>
  )
}

export default Home
