'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { SurveyLabel } from '@/components/ui/SurveyLabel'
import { Mosaic } from '@/components/mosaic/Mosaic'
import { PopupCard, type PopupTarget } from '@/components/cards/PopupCard'
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion'
import { hasWebGL, isSmallViewport } from '@/lib/webgl'
import { MAX_TOWERS } from '@/lib/chamberConstants'
import type { ChamberNode, SectionMeta, SurveyItem } from '@/lib/types'
import type { ChamberHandle } from './engine'
import { ChamberLoader } from './Loader'
import styles from './Chamber.module.css'

type Mode = 'grid' | 'cards'

const LOADER_MIN_MS = 650
const LOADER_TIMEOUT_MS = 4000

/**
 * A section page. The mosaic is the server-rendered default; the chamber
 * hydrates over it when the device can carry one (spec §1, §8).
 */
export const SectionView = ({
  section,
  items,
  nodes,
  surveyLabel,
}: {
  section: SectionMeta
  items: SurveyItem[]
  nodes: ChamberNode[]
  surveyLabel: string
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chipRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<ChamberHandle | null>(null)
  const bootedRef = useRef(false)
  // `?focus=<slug>` is read on the client so section pages stay fully static.
  const pendingFocus = useRef<string | null>(null)
  const loadingRef = useRef(false)

  const reducedMotion = usePrefersReducedMotion()
  /**
   * `pending` until the capability probe has run. The distinction matters:
   * the flat fallback must not claim a `?focus=` request that the chamber is
   * about to answer.
   */
  const [support, setSupport] = useState<'pending' | 'chamber' | 'flat'>('pending')
  const capable = support === 'chamber'
  const [mode, setMode] = useState<Mode>('cards')
  const [loading, setLoading] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const [selected, setSelected] = useState<PopupTarget | null>(null)
  // CARDS mode opens a record inline instead of over the block.
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null)
  // The record panel only fits above this width; below it the chamber recentres.
  const [wideEnough, setWideEnough] = useState(false)
  const [chip, setChip] = useState<string>('')

  const storageKey = `holo:mode:${section.key}`

  /* ------------------------------------------------------- capability ---- */

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('focus')
    if (requested) pendingFocus.current = requested

    // Runs after the reduced-motion probe has settled on its real value.
    const supported = hasWebGL() && !isSmallViewport() && !reducedMotion
    setSupport(supported ? 'chamber' : 'flat')
    if (!supported) {
      setMode('cards')
      return
    }

    let stored: string | null = null
    try {
      stored = window.localStorage.getItem(storageKey)
    } catch {
      /* private mode — fall back to the default */
    }
    setMode(stored === 'cards' ? 'cards' : 'grid')
  }, [reducedMotion, storageKey])

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1181px)')
    const update = () => setWideEnough(mql.matches)
    update()
    mql.addEventListener('change', update)
    return () => mql.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!capable) return
    try {
      window.localStorage.setItem(storageKey, mode)
    } catch {
      /* nothing to persist to */
    }
  }, [capable, mode, storageKey])

  /* ------------------------------------------------------------ boot ---- */

  const openIndex = useCallback(
    (index: number | null) => {
      if (index === null || !items[index]) {
        setSelected(null)
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href)
          url.searchParams.delete('focus')
          window.history.replaceState(null, '', url.toString())
        }
        return
      }
      setSelected({ item: items[index], index })
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href)
        url.searchParams.set('focus', items[index].slug)
        window.history.replaceState(null, '', url.toString())
      }
    },
    [items],
  )

  useEffect(() => {
    if (!capable || bootedRef.current || mode !== 'grid') return
    const canvas = canvasRef.current
    const chipEl = chipRef.current
    const popupEl = popupRef.current
    if (!canvas || !chipEl || !popupEl) return

    bootedRef.current = true
    setLoading(true)

    let cancelled = false
    const bootStart = performance.now()

    const timeout = window.setTimeout(() => {
      if (cancelled || !loadingRef.current) return
      // Hard timeout: hand the visitor the mosaic rather than a black screen.
      setTimedOut(true)
      setLoading(false)
      setMode('cards')
    }, LOADER_TIMEOUT_MS)

    const finish = () => {
      const elapsed = performance.now() - bootStart
      const wait = Math.max(0, LOADER_MIN_MS - elapsed)
      window.setTimeout(() => {
        if (cancelled) return
        window.clearTimeout(timeout)
        setLoading(false)
        const slug = pendingFocus.current
        if (slug) {
          pendingFocus.current = null
          const index = items.findIndex((item) => item.slug === slug)
          if (index >= 0) window.setTimeout(() => engineRef.current?.select(index), 350)
        }
      }, wait)
    }

    void import('./engine')
      .then(({ createChamber }) => {
        if (cancelled) return
        engineRef.current = createChamber({
          canvas,
          chipEl,
          popupEl,
          nodes,
          reducedMotion,
          onHoverChange: (index) => {
            const node = index === null ? null : nodes[index]
            setChip(node ? `${node.label} · ${node.year}` : '')
          },
          onSelectChange: openIndex,
          onReady: finish,
        })
      })
      .catch(() => {
        if (cancelled) return
        window.clearTimeout(timeout)
        setTimedOut(true)
        setLoading(false)
        setMode('cards')
      })

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [capable, mode, nodes, items, reducedMotion, openIndex])

  // `loading` is read inside the boot timeout without re-arming that effect.
  useEffect(() => {
    loadingRef.current = loading
  }, [loading])

  useEffect(
    () => () => {
      engineRef.current?.dispose()
      engineRef.current = null
      bootedRef.current = false
    },
    [],
  )

  /* ------------------------------------------------- grid ⇄ cards ---- */

  useEffect(() => {
    engineRef.current?.setLowFps(mode === 'cards')
    if (mode === 'cards') engineRef.current?.deselect()
    else setExpandedSlug(null)
  }, [mode])

  // Push the cluster clear of the record panel, and tell the popup where the
  // panel's right edge is so it never lands underneath it.
  useEffect(() => {
    const engine = engineRef.current
    if (!engine) return
    if (mode === 'cards' || !wideEnough) {
      engine.setComposition(0, 0)
      return
    }
    const panel = panelRef.current
    const inset = panel ? panel.getBoundingClientRect().right + 28 : 0
    engine.setComposition(0.13, inset)
  }, [mode, wideEnough, loading])

  /**
   * CARDS opens the record inline: the block re-orders around it and the full
   * write-up, stack and links come with it. The chamber's anchored popup stays
   * deliberately short, so the two views answer different questions.
   */
  const onMosaicSelect = useCallback(
    (slug: string) => {
      setExpandedSlug((current) => (current === slug ? null : slug))
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href)
        url.searchParams.set('focus', slug)
        window.history.replaceState(null, '', url.toString())
      }
    },
    [],
  )

  const selectFromPanel = useCallback((index: number) => {
    engineRef.current?.select(index)
  }, [])

  const highlightFromPanel = useCallback((index: number | null) => {
    engineRef.current?.highlight(index)
  }, [])

  const closeExpanded = useCallback(() => {
    setExpandedSlug(null)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.delete('focus')
      window.history.replaceState(null, '', url.toString())
    }
  }, [])

  const closePopup = useCallback(() => {
    if (engineRef.current) engineRef.current.deselect()
    else openIndex(null)
  }, [openIndex])

  // Standalone popup (no chamber) still answers to Escape.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (expandedSlug) closeExpanded()
      else if (!capable) closePopup()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [capable, closePopup, expandedSlug, closeExpanded])

  // With no chamber to fly to, a ?focus= slug expands that record inline.
  useEffect(() => {
    if (support !== 'flat') return
    const slug = pendingFocus.current
    if (!slug) return
    pendingFocus.current = null
    if (items.some((item) => item.slug === slug)) setExpandedSlug(slug)
  }, [support, items])

  const showCards = mode === 'cards'
  const showPanel = capable && !showCards && wideEnough
  const overflow = Math.max(0, nodes.length - MAX_TOWERS)

  return (
    <div className={styles.chamber}>
      {capable ? (
        <canvas
          ref={canvasRef}
          className={[styles.canvas, showCards ? styles.blurred : ''].filter(Boolean).join(' ')}
          aria-hidden="true"
        />
      ) : (
        <div className={styles.staticBackdrop} aria-hidden="true" />
      )}

      {showCards ? <div className={styles.topScrim} aria-hidden="true" /> : null}

      {capable ? (
        <div className={[styles.ui, styles.toggle].join(' ')} role="group" aria-label="View mode">
          <button type="button" aria-pressed={mode === 'grid'} onClick={() => setMode('grid')}>
            ◫ Grid
          </button>
          <button type="button" aria-pressed={mode === 'cards'} onClick={() => setMode('cards')}>
            ▣ Cards
          </button>
        </div>
      ) : null}

      {!showPanel ? (
        <SurveyLabel onDark className={[styles.ui, styles.survey].join(' ')}>
          {surveyLabel}
        </SurveyLabel>
      ) : (
        <SurveyLabel onDark className={[styles.ui, styles.survey].join(' ')}>
          Upd {surveyLabel.split('UPD ')[1] ?? ''}
        </SurveyLabel>
      )}

      {capable && !showCards ? (
        <div className={[styles.ui, styles.hint].join(' ')}>Drag to orbit · Scroll to zoom · Click a block</div>
      ) : null}

      <div ref={chipRef} className={styles.chip} aria-hidden="true">
        {chip}
      </div>

      <h1 className="srOnly">{section.label}</h1>

      {showPanel ? (
        <div className={styles.panel} ref={panelRef}>
          <div className={styles.panelHead}>
            <Eyebrow onDark>
              {section.num} · {section.label} · N={items.length}
            </Eyebrow>
            <p className={styles.panelTitle}>{section.heading}</p>
            <p className={styles.panelBlurb}>{section.blurb}</p>
            <div className={styles.panelRule} />
          </div>
          <ul className={styles.records}>
            {items.map((item, index) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={styles.record}
                  data-active={selected?.item.slug === item.slug ? 'true' : undefined}
                  onClick={() => selectFromPanel(index)}
                  onMouseEnter={() => highlightFromPanel(index)}
                  onMouseLeave={() => highlightFromPanel(null)}
                  onFocus={() => highlightFromPanel(index)}
                  onBlur={() => highlightFromPanel(null)}
                >
                  <span className={styles.recordNum}>{String(index + 1).padStart(2, '0')}</span>
                  <span className={styles.recordTitle}>{item.title}</span>
                  <span className={styles.recordWeight}>W{item.weight}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Crawlers and screen readers still get the list when the panel is not shown. */}
      {!showCards && !showPanel ? (
        <ul className="srOnly">
          {items.map((item) => (
            <li key={item.id}>
              {item.title} — {item.summary} ({item.year})
            </li>
          ))}
        </ul>
      ) : null}

      <div className={styles.cards} style={{ display: showCards ? 'block' : 'none' }}>
        <div className={styles.cardsHeader}>
          <Eyebrow onDark>
            Sec {section.num} · {section.label} · Card view
          </Eyebrow>
          {timedOut ? (
            <p className={styles.notice}>Grid unavailable on this device — showing cards.</p>
          ) : null}
        </div>
        <Mosaic
          items={items}
          collection={section.collection}
          expandedSlug={expandedSlug}
          onSelect={onMosaicSelect}
          onClose={closeExpanded}
          emptyMessage={`NO ${section.label} LOGGED YET.`}
        />
        <div className={styles.cardsFoot}>
          {items.length} record{items.length === 1 ? '' : 's'}
          {overflow > 0 ? ` · ${overflow} beyond the cluster budget shown here only` : ''}
        </div>
      </div>

      <PopupCard
        target={selected}
        collection={section.collection}
        singular={section.singular}
        anchored={capable && !showCards}
        compact
        onClose={closePopup}
        containerRef={popupRef}
      />

      {capable ? <ChamberLoader hidden={!loading} /> : null}
    </div>
  )
}
