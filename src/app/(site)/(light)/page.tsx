import Link from 'next/link'
import { Chapter, chapterStyles as styles } from '@/components/journey/Chapter'
import { HomeScene } from '@/components/journey/HomeScene'
import { SmoothScroll } from '@/components/journey/SmoothScroll'
import { Reveal } from '@/components/journey/Reveal'
import { CardStrip } from '@/components/strips/CardStrip'
import { EnterButton } from '@/components/ui/EnterButton'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { getCtfStats, getFeaturedItems, getProfile, getSectionItems } from '@/lib/data'
import { SECTIONS } from '@/lib/sections'
import type { SectionKey } from '@/lib/types'

/** Chapters 02, 03, 04 and 06 each present their top items as a card strip. */
const STRIP_SECTIONS: SectionKey[] = ['projects', 'experience', 'organizations', 'awards']

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
        eyebrow={`${section.num} · ${section.label} · Selected · N=${total}`}
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

  return (
    <>
      <SmoothScroll />
      <HomeScene />

      <main id="main" className={styles.main}>
        {/* 00 — HELLO */}
        <section className={`${styles.chapter} ${styles.hero}`}>
          <Eyebrow>00 · Hello · {profile.location ?? 'Yogyakarta, ID'}</Eyebrow>
          <h1 className={styles.title}>
            {profile.heroLineOne}
            <br />
            <span className={styles.stroke}>{profile.heroLineTwo}</span>
          </h1>
          <p className={`${styles.sub} ${styles.heroSub}`}>{profile.tagline}</p>
          <div className={styles.scrollcue}>
            <span className={styles.cueBar} aria-hidden="true" />
            Scroll to survey
          </div>
        </section>

        {/* 01 — ABOUT */}
        <Chapter id="about" eyebrow="01 · About · Who is surveying" heading="Short version">
          {profile.aboutIntro ? <p className={styles.aboutBody}>{profile.aboutIntro}</p> : null}
          <Reveal>
            <EnterButton href="/about" label="Read the long version" />
          </Reveal>
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
      </main>
    </>
  )
}

export default Home
