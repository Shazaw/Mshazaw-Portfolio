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
const MODE_SWAP_DELAY_MS = 120

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
    if (mode === 'cards') {
      engineRef.current?.deselect()
    }
  }, [mode])

  const onMosaicSelect = useCallback(
    (slug: string, index: number) => {
      if (!capable) {
        // No chamber to fly into — the popup opens over the mosaic instead.
        openIndex(index)
        return
      }

      if (engineRef.current) {
        setMode('grid')
        window.setTimeout(() => engineRef.current?.select(index), MODE_SWAP_DELAY_MS)
        return
      }

      // Landed straight in CARDS (a persisted preference), so the engine has
      // not booted yet. Hand the selection to the boot sequence, which opens it
      // once the cluster is ready.
      pendingFocus.current = slug
      setMode('grid')
    },
    [capable, openIndex],
  )

  const closePopup = useCallback(() => {
    if (engineRef.current) engineRef.current.deselect()
    else openIndex(null)
  }, [openIndex])

  // Standalone popup (no chamber) still answers to Escape.
  useEffect(() => {
    if (capable) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closePopup()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [capable, closePopup])

  // With no chamber to fly to, a ?focus= slug opens the standalone popup.
  useEffect(() => {
    if (support !== 'flat') return
    const slug = pendingFocus.current
    if (!slug) return
    pendingFocus.current = null
    const index = items.findIndex((item) => item.slug === slug)
    if (index >= 0) setSelected({ item: items[index], index })
  }, [support, items])

  const showCards = mode === 'cards'
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

      <SurveyLabel onDark className={[styles.ui, styles.survey].join(' ')}>
        {surveyLabel}
      </SurveyLabel>

      {capable && !showCards ? (
        <div className={[styles.ui, styles.hint].join(' ')}>Drag to orbit · Scroll to zoom · Click a block</div>
      ) : null}

      <div ref={chipRef} className={styles.chip} aria-hidden="true">
        {chip}
      </div>

      {/* Screen readers and crawlers get the full list regardless of mode. */}
      <h1 className="srOnly">{section.label}</h1>
      {!showCards ? (
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
          selectedSlug={selected?.item.slug ?? null}
          onSelect={onMosaicSelect}
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
        onClose={closePopup}
        containerRef={popupRef}
      />

      {capable ? <ChamberLoader hidden={!loading} /> : null}
    </div>
  )
}
