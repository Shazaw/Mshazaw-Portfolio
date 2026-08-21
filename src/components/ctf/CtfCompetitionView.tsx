'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { DetailPopup } from '@/components/cards/DetailPopup'
import { buildMosaicLayout, ROW_HEIGHT_MID, ROW_HEIGHT_TALL } from '@/lib/mosaic'
import { categoryLabel, categoryShort, CTF_CATEGORY_ORDER } from '@/lib/ctf'
import { fullDate, pad2 } from '@/lib/format'
import { useCtfMode } from '@/lib/useCtfMode'
import type { CtfChallengeItem } from '@/lib/types'
import { ModeToggle } from './ModeToggle'
import styles from './Ctf.module.css'

export interface CompetitionHeader {
  title: string
  organizer: string
  team: string | null
  placement: string | null
  date: string
  format: string
  summary: string
}

const DIFFICULTY_CLASS: Record<string, string> = {
  easy: styles.diffEasy,
  medium: styles.diffMedium,
  hard: styles.diffHard,
  insane: styles.diffInsane,
}

/**
 * `/ctf/[slug]` — category mosaic for the active mode. Exactly the categories
 * with at least one challenge appear; a cell expands in place into a full-width
 * accordion row of challenges.
 */
export const CtfCompetitionView = ({
  header,
  solved,
  authored,
}: {
  header: CompetitionHeader
  solved: CtfChallengeItem[]
  authored: CtfChallengeItem[]
}) => {
  const [mode, setMode] = useCtfMode()
  const [openCategory, setOpenCategory] = useState<string | null>(null)
  // Remembered so the panel stays put while it animates closed.
  const [lastOpened, setLastOpened] = useState<string | null>(null)
  const [selected, setSelected] = useState<{ challenge: CtfChallengeItem; index: number } | null>(null)

  const challenges = mode === 'solved' ? solved : authored

  const grouped = useMemo(() => {
    const map = new Map<string, CtfChallengeItem[]>()
    for (const challenge of challenges) {
      const bucket = map.get(challenge.category) ?? []
      bucket.push(challenge)
      map.set(challenge.category, bucket)
    }
    // Only non-empty categories, ordered by the shared taxonomy.
    return CTF_CATEGORY_ORDER.filter((category) => map.has(category)).map((category) => ({
      category,
      items: map.get(category) as CtfChallengeItem[],
    }))
  }, [challenges])

  const layout = buildMosaicLayout(grouped.map(() => 'auto'))

  const toggleCategory = useCallback((category: string) => {
    setOpenCategory((current) => (current === category ? null : category))
    setLastOpened(category)
  }, [])

  const switchMode = useCallback(
    (next: typeof mode) => {
      setMode(next)
      setOpenCategory(null)
      setLastOpened(null)
      setSelected(null)
    },
    [setMode],
  )

  const closePopup = useCallback(() => setSelected(null), [])

  useEffect(() => {
    if (!selected) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelected(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected])

  /**
   * The accordion is one panel element that moves to sit after the last cell of
   * the row holding the open category. Rendering a panel per cell would put a
   * zero-height, full-width grid item after every cell and break the row
   * packing; keeping a single node with a stable key also lets the open/close
   * transition survive the move.
   */
  const panelCategory = openCategory ?? lastOpened
  const panelGroup = grouped.find((group) => group.category === panelCategory) ?? null
  const panelRow = panelGroup === null ? -1 : (layout[grouped.indexOf(panelGroup)]?.row ?? -1)
  const lastIndexInPanelRow =
    panelRow < 0 ? -1 : layout.reduce((last, place, i) => (place?.row === panelRow ? i : last), -1)

  const cells: React.ReactNode[] = []

  grouped.forEach((group, index) => {
    const placement = layout[index] ?? { span: 6, row: 0, tall: true }
    const isOpen = openCategory === group.category
    const points = group.items.reduce((sum, item) => sum + (item.points ?? 0), 0)

    cells.push(
      <article
        key={group.category}
        className={styles.cell}
        data-open={isOpen ? 'true' : undefined}
        style={{
          gridColumn: `span ${placement.span}`,
          minHeight: placement.tall ? ROW_HEIGHT_TALL : ROW_HEIGHT_MID,
        }}
      >
        <span className={styles.ghost} aria-hidden="true">
          {pad2(index + 1)}
        </span>
        <h2 className={styles.cellTitle}>
          <button
            type="button"
            className={styles.trigger}
            aria-expanded={isOpen}
            aria-controls="ctf-category-panel"
            onClick={() => toggleCategory(group.category)}
          >
            {categoryLabel(group.category)}
          </button>
          <em className={styles.cellSub}>{categoryShort(group.category)}</em>
        </h2>
        <p className={styles.cellBody}>
          {group.items.length} challenge{group.items.length === 1 ? '' : 's'}
          {points > 0 ? ` \u00b7 ${points} points` : ''}
        </p>
        <p className={styles.cellMeta}>
          <span>{isOpen ? 'Collapse \u2191' : 'Expand \u2193'}</span>
        </p>
      </article>,
    )

    if (index === lastIndexInPanelRow && panelGroup) {
      cells.push(
        <div
          key="ctf-category-panel"
          id="ctf-category-panel"
          className={[styles.panel, openCategory ? styles.panelOpen : ''].filter(Boolean).join(' ')}
          role="region"
          aria-label={`${categoryLabel(panelGroup.category)} challenges`}
        >
          <div className={styles.panelInner}>
            <ul className={styles.rows}>
              {panelGroup.items.map((challenge, challengeIndex) => (
                <li key={challenge.id}>
                  <button
                    type="button"
                    className={styles.row}
                    onClick={() => setSelected({ challenge, index: challengeIndex })}
                  >
                    <span className={styles.rowTitle}>
                      {challenge.title}
                      {challenge.summary ? (
                        <span className={styles.rowSummary}>{challenge.summary}</span>
                      ) : null}
                    </span>
                    <span className={`${styles.rowMeta} ${DIFFICULTY_CLASS[challenge.difficulty] ?? ''}`}>
                      {challenge.difficulty}
                    </span>
                    <span className={styles.rowMeta}>
                      {challenge.points !== null ? `${challenge.points} pts` : '\u2014'}
                    </span>
                    <span className={styles.rowMeta}>
                      {challenge.mode === 'authored'
                        ? `${challenge.solves ?? 0} solves`
                        : challenge.hasWriteup || challenge.externalUrl
                          ? 'Write-up'
                          : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>,
      )
    }
  })

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <Link href={`/ctf${mode === 'authored' ? '?mode=authored' : ''}`} className={styles.back}>
          ← All competitions
        </Link>
        <Eyebrow onDark>05 · CTF · {fullDate(header.date) ?? ''}</Eyebrow>
        <h1 className={styles.title}>{header.title}</h1>
        <p className={styles.lede}>{header.summary}</p>
        <div className={styles.headMeta}>
          <span>{header.organizer}</span>
          {header.team ? <span>Team {header.team}</span> : null}
          <span>{header.format}</span>
          {header.placement ? <span className={styles.placement}>{header.placement}</span> : null}
        </div>

        <div className={styles.controls}>
          <ModeToggle mode={mode} onChange={switchMode} />
          <span className={styles.statLabel}>
            {challenges.length} challenge{challenges.length === 1 ? '' : 's'} · {mode}
          </span>
        </div>
      </header>

      <div className={styles.mosaic}>
        {grouped.length === 0 ? (
          <p className={styles.empty}>
            {mode === 'authored'
              ? 'NO AUTHORED CHALLENGES LOGGED FOR THIS EVENT.'
              : 'NO SOLVED CHALLENGES LOGGED FOR THIS EVENT.'}
          </p>
        ) : (
          cells
        )}
      </div>

      <div className={styles.foot}>
        {header.title} · {fullDate(header.date)} · {challenges.length} logged in {mode} mode
      </div>

      <DetailPopup
        open={selected !== null}
        index={(selected?.index ?? 0) + 1}
        singular="Challenge"
        title={selected?.challenge.title ?? ''}
        meta={[
          selected ? categoryLabel(selected.challenge.category) : '',
          selected?.challenge.difficulty ?? '',
          selected?.challenge.points != null ? `${selected.challenge.points} pts` : '',
          selected?.challenge.mode === 'authored' ? `${selected.challenge.solves ?? 0} solves` : '',
        ]
          .filter(Boolean)
          .join(' · ')}
        fallbackBody={
          selected?.challenge.summary ??
          (selected?.challenge.mode === 'authored'
            ? 'No write-up published for this challenge.'
            : 'No write-up published for this solve.')
        }
        tags={selected?.challenge.tags ?? []}
        links={
          selected?.challenge.externalUrl
            ? [{ label: 'WRITE-UP', url: selected.challenge.externalUrl }]
            : []
        }
        collection="ctf-challenges"
        slug={selected?.challenge.slug ?? null}
        anchored={false}
        onClose={closePopup}
      />
    </div>
  )
}
