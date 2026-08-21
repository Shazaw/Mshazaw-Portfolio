'use client'

import Link from 'next/link'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { buildMosaicLayout, ROW_HEIGHT_MID, ROW_HEIGHT_TALL } from '@/lib/mosaic'
import { categoryShort } from '@/lib/ctf'
import { fullDate, pad2 } from '@/lib/format'
import { useCtfMode } from '@/lib/useCtfMode'
import type { CtfCompetitionItem, CtfStats } from '@/lib/types'
import { ModeToggle } from './ModeToggle'
import styles from './Ctf.module.css'

/**
 * `/ctf` — competition mosaic. Only competitions holding at least one
 * challenge in the active mode appear; each cell carries its own per-category
 * counts for that mode.
 */
export const CtfIndexView = ({
  solved,
  authored,
  stats,
  lede,
}: {
  solved: CtfCompetitionItem[]
  authored: CtfCompetitionItem[]
  stats: CtfStats
  lede: string
}) => {
  const [mode, setMode] = useCtfMode()
  const competitions = mode === 'solved' ? solved : authored
  const layout = buildMosaicLayout(competitions.map(() => 'auto'))

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <Eyebrow onDark>05 · CTF · Capture the flag</Eyebrow>
        <h1 className={styles.title}>Flags, both sides of the board</h1>
        <p className={styles.lede}>{lede}</p>

        <div className={styles.stats}>
          <div>
            <div className={styles.statNum}>{stats.solved}</div>
            <div className={styles.statLabel}>Challenges solved</div>
          </div>
          <div>
            <div className={`${styles.statNum} ${styles.statNumOutlined}`}>{stats.authored}</div>
            <div className={styles.statLabel}>Challenges authored</div>
          </div>
          <div>
            <div className={styles.statNum}>{stats.podiums}</div>
            <div className={styles.statLabel}>Podiums &amp; finals</div>
          </div>
          <div>
            <div className={styles.statNum}>{stats.competitions}</div>
            <div className={styles.statLabel}>Events logged</div>
          </div>
        </div>

        <div className={styles.controls}>
          <ModeToggle mode={mode} onChange={setMode} />
          <span className={styles.statLabel}>
            {competitions.length} event{competitions.length === 1 ? '' : 's'} · {mode}
          </span>
        </div>
      </header>

      <div className={styles.mosaic}>
        {competitions.length === 0 ? (
          <p className={styles.empty}>
            {mode === 'authored'
              ? 'NO AUTHORED CHALLENGES LOGGED YET.'
              : 'NO SOLVED CHALLENGES LOGGED YET.'}
          </p>
        ) : (
          competitions.map((competition, index) => {
            const placement = layout[index] ?? { span: 6, row: 0, tall: true }
            return (
              <article
                key={competition.id}
                className={styles.cell}
                style={{
                  gridColumn: `span ${placement.span}`,
                  minHeight: placement.tall ? ROW_HEIGHT_TALL : ROW_HEIGHT_MID,
                }}
              >
                <span className={styles.ghost} aria-hidden="true">
                  {pad2(index + 1)}
                </span>
                <h2 className={styles.cellTitle}>
                  <Link
                    href={`/ctf/${competition.slug}${mode === 'authored' ? '?mode=authored' : ''}`}
                    className={styles.trigger}
                  >
                    {competition.title}
                  </Link>
                  <em className={styles.cellSub}>{competition.year}</em>
                </h2>
                <p className={styles.cellBody}>{competition.summary}</p>
                <p className={styles.cellMeta}>
                  {competition.categoryCounts.map((entry) => (
                    <span key={entry.category} className={styles.countChip}>
                      {categoryShort(entry.category)}
                      <b>{entry.count}</b>
                    </span>
                  ))}
                  {competition.placement ? (
                    <span className={styles.placement}>{competition.placement}</span>
                  ) : null}
                </p>
              </article>
            )
          })
        )}
      </div>

      <div className={styles.foot}>
        {competitions.reduce((sum, competition) => sum + competition.total, 0)} challenges in view ·{' '}
        {fullDate(competitions[0]?.date) ?? '—'} most recent
      </div>
    </div>
  )
}
