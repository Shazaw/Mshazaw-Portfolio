/**
 * End-to-end behaviour checks against a running production build.
 * Usage: BASE=http://localhost:3111 node scripts/test-interactions.mjs
 */
import { chromium } from 'playwright'

const BASE = process.env.BASE || 'http://localhost:3111'
const DESKTOP = { width: 1440, height: 900 }

let passed = 0
let failed = 0
const failures = []

const check = (name, condition, detail = '') => {
  if (condition) {
    passed++
    console.log(`  ✓ ${name}`)
  } else {
    failed++
    failures.push(`${name}${detail ? ` — ${detail}` : ''}`)
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

const popupState = (page) =>
  page.evaluate(() => {
    const el = document.querySelector('[role="dialog"]')
    if (!el) return { open: false, title: null }
    return {
      open: el.className.includes('open'),
      title: el.querySelector('h3')?.textContent ?? null,
    }
  })

const run = async () => {
  const browser = await chromium.launch()

  /* ---------------------------------------------- chamber & mode toggle ---- */
  {
    console.log('\nchamber — grid ⇄ cards')
    const ctx = await browser.newContext({ viewport: DESKTOP })
    const page = await ctx.newPage()
    await page.goto(`${BASE}/projects`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(3500)

    check('boots into GRID with a canvas', (await page.locator('canvas').count()) === 1)
    check('hint is visible in GRID', await page.locator('text=Drag to orbit').isVisible())

    await page.click('button:has-text("Cards")')
    await page.waitForTimeout(700)

    const blurred = await page.evaluate(() => {
      const canvas = document.querySelector('canvas')
      return canvas ? getComputedStyle(canvas).filter : ''
    })
    check('canvas blurs behind CARDS', blurred.includes('blur'), blurred)

    // A click on a mosaic cell must not also land on the tower behind it.
    const canvasInert = await page.evaluate(
      () => getComputedStyle(document.querySelector('canvas')).pointerEvents === 'none',
    )
    check('canvas stops taking clicks in CARDS', canvasInert === true)
    check('mosaic cells render', (await page.locator('article h3').count()) >= 10)

    const stored = await page.evaluate(() => localStorage.getItem('holo:mode:projects'))
    check('mode persists to localStorage', stored === 'cards', String(stored))

    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForTimeout(1500)
    check(
      'reload restores CARDS',
      await page.locator('button:has-text("Cards")').evaluate((el) => el.getAttribute('aria-pressed') === 'true'),
    )

    /* --------------------------------------------- toggle round trip ---- */
    // The CARDS layer used to cover the mode toggle, so GRID was unreachable.
    await page.click('button:has-text("Grid")')
    await page.waitForTimeout(900)
    check(
      'toggle goes back to GRID',
      (await page.locator('button:has-text("Grid")').getAttribute('aria-pressed')) === 'true',
    )
    const topAtToggle = await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find((b) => /cards/i.test(b.textContent))
      const box = btn.getBoundingClientRect()
      const top = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
      return top === btn || btn.contains(top)
    })
    check('mode toggle is never covered by another layer', topAtToggle === true)

    await page.click('button:has-text("Cards")')
    await page.waitForTimeout(900)
    check(
      'toggle returns to CARDS',
      (await page.locator('button:has-text("Cards")').getAttribute('aria-pressed')) === 'true',
    )

    /* ------------------------------ mosaic click → inline expansion ---- */
    const cellsBefore = await page.locator('article').count()

    // The whole slab must be the hit target, not just the words in the heading.
    const hitTargets = await page.evaluate(() => {
      const cell = document.querySelectorAll('article')[1]
      const b = cell.getBoundingClientRect()
      const points = [
        [b.left + b.width / 2, b.top + b.height / 2],
        [b.right - 30, b.top + 40],
        [b.left + 40, b.bottom - 20],
      ]
      return points.map(([x, y]) => {
        const el = document.elementFromPoint(x, y)
        return Boolean(el && (el.tagName === 'BUTTON' || el.closest('button')))
      })
    })
    check('the whole cell is clickable, not just the title', hitTargets.every(Boolean), JSON.stringify(hitTargets))

    const firstTitle = (await page.locator('article h3 button').first().textContent())?.trim()
    await page.locator('article h3 button').first().click()
    // The write-up is fetched on open, so wait for the content rather than a
    // fixed delay — a fixed one races the request under load.
    await page
      .waitForFunction(
        () => {
          const panel = document.querySelector('article[aria-labelledby^="expanded-"]')
          return Boolean(panel) && !/Loading record/.test(panel.textContent ?? '')
        },
        { timeout: 8000 },
      )
      .catch(() => {})
    await page.waitForTimeout(400)

    const openState = await page.evaluate(() => {
      const panel = document.querySelector('article[aria-labelledby^="expanded-"]')
      if (!panel) return null
      const grid = panel.parentElement
      const box = panel.getBoundingClientRect()
      const gridBox = grid.getBoundingClientRect()
      return {
        title: panel.querySelector('h3')?.textContent?.trim() ?? '',
        position: [...grid.children].indexOf(panel),
        fullWidth: Math.abs(box.width - gridBox.width) <= 2,
        hasImage: Boolean(panel.querySelector('img')),
        chips: panel.querySelectorAll('span').length,
        links: [...panel.querySelectorAll('a')].map((a) => a.textContent.trim()),
        prose: (panel.textContent ?? '').length,
        cells: grid.querySelectorAll('article').length,
      }
    })

    check('clicking a cell expands it inline', openState !== null)
    check('expanded record is the one clicked', openState?.title.startsWith(firstTitle ?? ''), `${openState?.title} vs ${firstTitle}`)
    check('expanded cell opens at the clicked position', openState?.position === 0, String(openState?.position))
    check('expanded cell spans the full block width', openState?.fullWidth === true)
    check('expanded cell shows the screenshot', openState?.hasImage === true)
    check('expanded cell carries a GitHub link', openState?.links.some((l) => /github/i.test(l)) === true, JSON.stringify(openState?.links))
    check('expanded cell carries the long write-up', (openState?.prose ?? 0) > 600, String(openState?.prose))
    check('the block keeps every record', openState?.cells === cellsBefore, `${openState?.cells} vs ${cellsBefore}`)
    check('no popup opens over the mosaic', !(await popupState(page)).open)

    await page.locator('button[aria-label="Close record"]').click()
    await page.waitForTimeout(900)
    const afterClose = await page.evaluate(() => ({
      expanded: Boolean(document.querySelector('article[aria-labelledby^="expanded-"]')),
      cells: document.querySelectorAll('article').length,
    }))
    check('close returns the block to its welded order', !afterClose.expanded && afterClose.cells === cellsBefore, JSON.stringify(afterClose))

    // A record further down must expand where it sits rather than jump to the top.
    await page.locator('article h3 button').nth(4).click()
    await page.waitForTimeout(1600)
    const deep = await page.evaluate(() => {
      const grid = document.querySelector('article').parentElement
      const panel = grid.querySelector('article[aria-labelledby^="expanded-"]')
      const rows = new Map()
      for (const child of grid.children) {
        const box = child.getBoundingClientRect()
        const span = Math.round((box.width / grid.getBoundingClientRect().width) * 6)
        const top = Math.round(box.top)
        rows.set(top, (rows.get(top) ?? 0) + span)
      }
      return {
        position: [...grid.children].indexOf(panel),
        rowsSealed: [...rows.values()].every((v) => v === 6),
      }
    })
    check('a deeper record expands in place, not at the top', deep.position === 4, String(deep.position))
    check('every row still sums to 6 around the expansion', deep.rowsSealed === true)

    await page.keyboard.press('Escape')
    await page.waitForTimeout(700)
    check(
      'Escape closes the expanded record',
      !(await page.evaluate(() => Boolean(document.querySelector('article[aria-labelledby^="expanded-"]')))),
    )

    await ctx.close()
  }

  /* ----------------------------------------------------- record panel ---- */
  {
    console.log('\nchamber record panel')
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 980 } })
    const page = await ctx.newPage()
    await page.goto(`${BASE}/projects`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(4200)

    const rows = await page.locator('button[class*=record]').count()
    check('panel highlights five records', rows === 5, String(rows))
    check(
      'panel says how many more there are',
      await page.locator('text=/\\+9 more/i').isVisible(),
    )
    check('panel carries the section heading', await page.locator('text=Selected work').isVisible())

    const title = (await page.locator('button[class*=record]').nth(3).locator('span').nth(1).textContent())?.trim()
    await page.locator('button[class*=record]').nth(3).click()
    await page.waitForTimeout(2200)

    const state = await page.evaluate(() => {
      const el = document.querySelector('[role="dialog"]')
      const panel = document.querySelector('[class*="panel"]')
      const box = el?.getBoundingClientRect()
      return {
        open: Boolean(el?.className.includes('open')),
        title: el?.querySelector('h3')?.textContent ?? '',
        popupLeft: box ? box.left : -1,
        panelRight: panel ? panel.getBoundingClientRect().right : -1,
        activeRows: document.querySelectorAll('button[data-active="true"]').length,
      }
    })
    check('selecting a record opens its tower', state.open && state.title === title, JSON.stringify(state))
    check('the popup clears the record panel', state.popupLeft > state.panelRight, `${Math.round(state.popupLeft)} vs ${Math.round(state.panelRight)}`)
    check('the chosen row is marked active', state.activeRows === 1, String(state.activeRows))
    await ctx.close()

    // Below the breakpoint the chamber recentres and the hidden list returns.
    const narrow = await browser.newContext({ viewport: { width: 1100, height: 900 } })
    const npage = await narrow.newPage()
    await npage.goto(`${BASE}/projects`, { waitUntil: 'networkidle' })
    await npage.waitForTimeout(3600)
    const narrowState = await npage.evaluate(() => ({
      panelVisible: Boolean(
        [...document.querySelectorAll('[class*="panel"]')].find((el) => el.getBoundingClientRect().width > 0),
      ),
      srList: document.querySelectorAll('ul.srOnly li').length,
    }))
    check('panel hides on a narrow viewport', narrowState.panelVisible === false)
    check('the accessible list returns when the panel is gone', narrowState.srList === 14, String(narrowState.srList))
    await narrow.close()
  }

  /* ------------------------------------------------------ camera moves ---- */
  {
    console.log('\ncamera behaviour')
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 980 } })
    const page = await ctx.newPage()
    await page.goto(`${BASE}/projects`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(4600)

    // The engine reports its orbit distance so this is observable at all.
    const radius = () =>
      page.evaluate(() => Number(document.querySelector('canvas')?.dataset.radius ?? 0))

    const framing = await radius()
    check('chamber reports an orbit distance', framing > 0, String(framing))

    const rows = page.locator('button[class*=record]')
    const settled = []
    for (const n of [0, 1, 2, 3, 4]) {
      await rows.nth(n).click()
      await page.waitForTimeout(2400)
      settled.push(await radius())
    }
    // Focus distance used to be a fraction of wherever the camera already was,
    // so every click zoomed further in until it hit the floor.
    const drift = Math.max(...settled) - Math.min(...settled)
    check('repeated selections do not compound the zoom', drift <= 4, settled.join(', '))
    check('selection zooms in from the framing distance', settled[0] < framing, `${settled[0]} vs ${framing}`)

    // Moving between towers should retreat before closing in again.
    await page.evaluate(() => {
      window.__arc = []
      const canvas = document.querySelector('canvas')
      new MutationObserver(() => window.__arc.push(Number(canvas.dataset.radius))).observe(canvas, {
        attributes: true,
        attributeFilter: ['data-radius'],
      })
    })
    await rows.nth(0).click()
    await page.waitForTimeout(2600)
    await page.evaluate(() => (window.__arc.length = 0))
    const before = await radius()
    await rows.nth(3).click()
    await page.waitForTimeout(2600)
    const arc = await page.evaluate(() => window.__arc)
    const peak = arc.length ? Math.max(...arc) : before
    const end = await radius()
    check('switching towers pulls back before closing in', peak > before + 2, `${before} → ${peak} → ${end}`)
    check('and settles back at the focus distance', Math.abs(end - settled[0]) <= 4, `${end} vs ${settled[0]}`)

    // Clicking chrome must not be read as a click on the scene.
    await rows.nth(2).click()
    await page.waitForTimeout(1800)
    const openBefore = (await popupState(page)).open
    await page.locator('text=Selected work').click()
    await page.waitForTimeout(900)
    check('clicking the panel does not deselect the tower', openBefore && (await popupState(page)).open)
    await ctx.close()
  }

  /* ------------------------------------------------------ deep linking ---- */
  {
    console.log('\ndeep link — ?focus=')
    const ctx = await browser.newContext({ viewport: DESKTOP })
    const page = await ctx.newPage()
    await page.goto(`${BASE}/projects?focus=netguard-pcap-analysis`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(4000)
    const state = await popupState(page)
    check('?focus opens the right record', state.open && state.title === 'NetGuard', JSON.stringify(state))

    const compact = await page.evaluate(() => {
      const el = document.querySelector('[role="dialog"]')
      return {
        text: (el?.textContent ?? '').length,
        links: [...(el?.querySelectorAll('a') ?? [])].map((a) => a.textContent.trim()),
        chips: (el?.textContent ?? '').includes('PYTHON'),
      }
    })
    check('chamber popup stays short', compact.text < 700, `${compact.text} chars`)
    check('chamber popup lists the tech stack', compact.chips === true)
    check('chamber popup carries the GitHub link', compact.links.some((l) => /github/i.test(l)), JSON.stringify(compact.links))

    const positioned = await page.evaluate(() => {
      const el = document.querySelector('[role="dialog"]')
      const box = el?.getBoundingClientRect()
      return box ? { top: box.top, bottom: box.bottom, left: box.left, right: box.right } : null
    })
    check(
      'anchored popup stays inside the viewport',
      positioned !== null && positioned.top >= 0 && positioned.left >= 0 && positioned.right <= 1440,
      JSON.stringify(positioned),
    )
    await ctx.close()
  }

  /* ---------------------------------------------- homepage strip → focus ---- */
  {
    console.log('\nhomepage strip')
    const ctx = await browser.newContext({ viewport: DESKTOP })
    const page = await ctx.newPage()
    await page.goto(BASE, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1200)

    const cells = await page.locator('a[href^="/projects?focus="]').count()
    check('projects strip renders three cards', cells === 3, String(cells))

    const shape = await page.evaluate(() => {
      const group = document.querySelector('#projects article')?.parentElement
      const cards = [...document.querySelectorAll('#projects article')]
      const media = cards.map((c) => c.querySelector('div').getBoundingClientRect())
      const groupBox = (group?.matches('[data-count]') ? group : group?.parentElement)?.getBoundingClientRect()
      const heading = document.querySelector('#projects h2')?.getBoundingClientRect()
      return {
        vw: window.innerWidth,
        insetLeft: groupBox ? Math.round(groupBox.left) : -1,
        insetRight: groupBox ? Math.round(window.innerWidth - groupBox.right) : -1,
        coverage: groupBox ? +(groupBox.width / window.innerWidth).toFixed(3) : 0,
        alignsWithHeading: groupBox && heading ? Math.abs(groupBox.left - heading.left) <= 1 : false,
        leadRatio: +(media[0].width / media[0].height).toFixed(2),
        leadWider: media[0].width > media[1].width,
        gap: Math.round(media[1].left - media[0].right),
        radius: getComputedStyle(cards[0].querySelector('div')).borderTopLeftRadius,
      }
    })

    // Inset from the edges like the reference, but still near-full-width — not
    // flush to the viewport and not a narrow centred measure.
    const insetOk = (m) =>
      m.insetLeft > m.vw * 0.02 && m.insetLeft < m.vw * 0.06 && Math.abs(m.insetLeft - m.insetRight) <= 2
    check('strip group is inset ~3% from both edges', insetOk(shape), JSON.stringify(shape))
    check('strip group stays near full width (>88%)', shape.coverage > 0.88, String(shape.coverage))
    check('strip group shares the heading left edge', shape.alignsWithHeading)
    check('lead card is wider than the stacked pair', shape.leadWider)
    check('lead media keeps a landscape ratio (1.25–1.7)', shape.leadRatio > 1.25 && shape.leadRatio < 1.7, String(shape.leadRatio))
    check('cards are separated by a real gap', shape.gap >= 16, `${shape.gap}px`)
    check('cards carry a radius', parseFloat(shape.radius) > 0, shape.radius)

    const content = await page.evaluate(() => {
      const card = document.querySelector('#projects article')
      return {
        chips: card.querySelectorAll('[aria-label="Tech stack"] span').length,
        links: [...card.querySelectorAll('a')].map((a) => a.textContent.trim()),
        summary: (card.querySelector('p')?.textContent ?? '').length,
        hasImage: Boolean(card.querySelector('img')),
      }
    })
    check('home card lists the full tech stack', content.chips >= 5, String(content.chips))
    check('home card carries an outbound link', content.links.some((l) => /github|live/i.test(l)), JSON.stringify(content.links))
    check('home card shows a description', content.summary > 40, String(content.summary))
    check('home card shows the project screenshot', content.hasImage === true)

    await page.locator('#projects article h3 a').first().click()
    await page.waitForTimeout(4200)
    check('strip click lands on the section with focus', page.url().includes('/projects?focus='), page.url())
    await ctx.close()
  }

  /* ---------------------------------------------------------------- CTF ---- */
  {
    console.log('\nCTF — mode filtering and accordion')
    const ctx = await browser.newContext({ viewport: DESKTOP })
    const page = await ctx.newPage()
    await page.goto(`${BASE}/ctf`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(500)

    const solvedEvents = await page.locator('article h2').count()
    await page.click('button:has-text("Authored")')
    await page.waitForTimeout(400)
    const authoredEvents = await page.locator('article h2').count()

    check('SOLVED and AUTHORED show different event sets', solvedEvents !== authoredEvents, `${solvedEvents} vs ${authoredEvents}`)
    check('mode is written to the URL', page.url().includes('mode=authored'), page.url())

    await page.goto(`${BASE}/ctf/ugm-internal-ctf-2026?mode=authored`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(500)

    const closedRows = await page.locator('#ctf-category-panel button').count()
    await page.locator('article h2 button').first().click()
    await page.waitForTimeout(600)
    const panelHeight = await page.locator('#ctf-category-panel').evaluate((el) => el.getBoundingClientRect().height)
    check('category panel expands', panelHeight > 40, `${Math.round(panelHeight)}px`)

    await page.locator('#ctf-category-panel button').first().click()
    await page.waitForTimeout(500)
    check('challenge row opens the popup', (await popupState(page)).open)
    await ctx.close()
    void closedRows
  }

  /* ----------------------------------------------------- degraded modes ---- */
  {
    console.log('\nfallbacks')
    const reduced = await browser.newContext({ viewport: DESKTOP, reducedMotion: 'reduce' })
    const page = await reduced.newPage()
    await page.goto(`${BASE}/projects`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1200)
    check('reduced motion: no chamber canvas', (await page.locator('canvas').count()) === 0)
    check('reduced motion: no mode toggle', (await page.locator('button:has-text("Cards")').count()) === 0)
    check('reduced motion: mosaic still renders', (await page.locator('article h3').count()) >= 10)

    await page.locator('article h3 button').first().click()
    await page.waitForTimeout(900)
    check(
      'reduced motion: record still expands inline',
      await page.evaluate(() => Boolean(document.querySelector('article[aria-labelledby^="expanded-"]'))),
    )
    await reduced.close()

    const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const mpage = await mobile.newPage()
    await mpage.goto(`${BASE}/projects`, { waitUntil: 'networkidle' })
    await mpage.waitForTimeout(1200)
    check('mobile: no chamber canvas', (await mpage.locator('canvas').count()) === 0)
    const spans = await mpage.locator('article').evaluateAll((els) =>
      els.map((el) => getComputedStyle(el).gridColumnStart),
    )
    check('mobile: every cell spans the full row', spans.every((s) => s.includes('6')), spans.slice(0, 3).join(','))
    await mobile.close()
  }

  /* -------------------------------------------------------------- a11y ---- */
  {
    console.log('\nsemantics')
    const ctx = await browser.newContext({ viewport: DESKTOP })
    const page = await ctx.newPage()
    await page.goto(`${BASE}/projects`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(3200)
    await page.click('button:has-text("Cards")')
    await page.waitForTimeout(500)

    const invalidNesting = await page.evaluate(
      () => document.querySelectorAll('button h1, button h2, button h3, a h1, a h2, a h3, button p, a p').length,
    )
    check('no headings or paragraphs nested inside buttons/links', invalidNesting === 0, String(invalidNesting))

    const h1 = await page.locator('h1').count()
    check('page has exactly one h1', h1 === 1, String(h1))

    const canvasHidden = await page.locator('canvas').getAttribute('aria-hidden')
    check('canvas is aria-hidden', canvasHidden === 'true')

    const block = await page.evaluate(() => {
      const grid = document.querySelector('article')?.parentElement
      const b = grid.getBoundingClientRect()
      const cells = [...grid.querySelectorAll('article')].slice(0, 2)
      const boxes = cells.map((c) => c.getBoundingClientRect())
      return {
        vw: window.innerWidth,
        insetLeft: Math.round(b.left),
        insetRight: Math.round(window.innerWidth - b.right),
        coverage: +(b.width / window.innerWidth).toFixed(3),
        gap: getComputedStyle(grid).gap,
        radius: getComputedStyle(cells[0]).borderTopLeftRadius,
        seam: Math.round(boxes[1].left - boxes[0].right),
      }
    })
    const blockInsetOk =
      block.insetLeft > block.vw * 0.02 &&
      block.insetLeft < block.vw * 0.06 &&
      Math.abs(block.insetLeft - block.insetRight) <= 2
    check('mosaic block is inset ~3% from both edges', blockInsetOk, JSON.stringify(block))
    check('mosaic block stays near full width (>88%)', block.coverage > 0.88, String(block.coverage))
    check('mosaic stays a connected block (no gap)', block.gap === 'normal' || parseFloat(block.gap) === 0, block.gap)
    check('mosaic cells keep square corners', parseFloat(block.radius) === 0, block.radius)
    check('mosaic cells share their seam', Math.abs(block.seam) <= 1, `${block.seam}px`)

    const weightText = await page.evaluate(() => /\bW\s?\d\s?\/\s?5\b/.test(document.body.innerText))
    check('no weight readout is shown to the reader', weightText === false)
    await ctx.close()
  }

  /* ------------------------------------------- dispose across navigation ---- */
  {
    console.log('\nengine lifecycle')
    // Chrome caps live WebGL contexts (~16). If dispose() leaked one per visit,
    // the tenth chamber would fail to acquire a context and render nothing.
    const ctx = await browser.newContext({ viewport: DESKTOP })
    const page = await ctx.newPage()
    const lostContexts = []
    page.on('console', (msg) => {
      if (/context lost|CONTEXT_LOST|Too many active WebGL/i.test(msg.text())) lostContexts.push(msg.text())
    })

    await page.goto(`${BASE}/projects`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(3000)
    const baseline = await page.evaluate(() => performance.memory?.usedJSHeapSize ?? 0)

    // `load` rather than `networkidle`: Next keeps prefetch connections warm
    // across rapid same-origin navigations, so idle never settles.
    for (let i = 0; i < 10; i++) {
      await page.goto(`${BASE}/awards`, { waitUntil: 'load' })
      await page.waitForTimeout(900)
      await page.goto(`${BASE}/projects`, { waitUntil: 'load' })
      await page.waitForTimeout(900)
    }

    check('no WebGL context loss across 10 navigations', lostContexts.length === 0, lostContexts[0] ?? '')

    const stillRendering = await page.evaluate(() => {
      const canvas = document.querySelector('canvas')
      if (!canvas) return false
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
      return Boolean(gl) && !gl.isContextLost()
    })
    check('chamber still has a live context after 10 navigations', stillRendering)

    const after = await page.evaluate(() => performance.memory?.usedJSHeapSize ?? 0)
    if (baseline > 0) {
      const growth = (after - baseline) / baseline
      check('JS heap growth stays bounded (<80%)', growth < 0.8, `${(growth * 100).toFixed(0)}%`)
    } else {
      console.log('  · heap measurement unavailable in this browser')
    }
    await ctx.close()
  }

  await browser.close()

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failures.length) {
    console.log('\nfailures:')
    for (const f of failures) console.log(`  - ${f}`)
  }
  process.exit(failed === 0 ? 0 : 1)
}

void run()
