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
    check('mosaic cells render', (await page.locator('article h3').count()) >= 10)

    const stored = await page.evaluate(() => localStorage.getItem('holo:mode:projects'))
    check('mode persists to localStorage', stored === 'cards', String(stored))

    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForTimeout(1500)
    check(
      'reload restores CARDS',
      await page.locator('button:has-text("Cards")').evaluate((el) => el.getAttribute('aria-pressed') === 'true'),
    )

    /* --------------------------------- mosaic click → grid + popup ---- */
    const firstTitle = await page.locator('article h3 button').first().textContent()
    await page.locator('article h3 button').first().click()
    await page.waitForTimeout(1400)
    const afterClick = await popupState(page)
    check('mosaic click switches to GRID', (await page.locator('button:has-text("Grid")').getAttribute('aria-pressed')) === 'true')
    check('mosaic click opens the popup', afterClick.open, JSON.stringify(afterClick))
    check('popup shows the clicked record', afterClick.title === firstTitle, `${afterClick.title} vs ${firstTitle}`)

    await page.keyboard.press('Escape')
    await page.waitForTimeout(600)
    check('Escape closes the popup', !(await popupState(page)).open)

    await ctx.close()
  }

  /* ------------------------------------------------------ deep linking ---- */
  {
    console.log('\ndeep link — ?focus=')
    const ctx = await browser.newContext({ viewport: DESKTOP })
    const page = await ctx.newPage()
    await page.goto(`${BASE}/projects?focus=optiwealth`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(4000)
    const state = await popupState(page)
    check('?focus opens the right record', state.open && state.title === 'OptiWealth', JSON.stringify(state))

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
      return {
        groupLeft: groupBox ? Math.round(groupBox.left) : -1,
        groupRight: groupBox ? Math.round(groupBox.right) : -1,
        leadRatio: +(media[0].width / media[0].height).toFixed(2),
        leadWider: media[0].width > media[1].width,
        gap: Math.round(media[1].left - media[0].right),
        radius: getComputedStyle(cards[0].querySelector('div')).borderTopLeftRadius,
      }
    })

    // The Still-Gardens group is inset in the page column, not edge to edge.
    check('strip group is inset from the viewport edges', shape.groupLeft > 40 && shape.groupRight < 1400, JSON.stringify(shape))
    check('lead card is wider than the stacked pair', shape.leadWider)
    check('lead media keeps a landscape ratio (1.25–1.7)', shape.leadRatio > 1.25 && shape.leadRatio < 1.7, String(shape.leadRatio))
    check('cards are separated by a real gap', shape.gap >= 16, `${shape.gap}px`)
    check('cards carry a radius', parseFloat(shape.radius) > 0, shape.radius)

    await page.locator('a[href^="/projects?focus="]').first().click()
    await page.waitForTimeout(4200)
    check('strip click lands on the section with focus', page.url().includes('/projects?focus='), page.url())
    check('strip click opens the popup', (await popupState(page)).open)
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
    await page.waitForTimeout(600)
    check('reduced motion: popup opens standalone', (await popupState(page)).open)
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
        left: Math.round(b.left),
        right: Math.round(b.right),
        gap: getComputedStyle(grid).gap,
        radius: getComputedStyle(cells[0]).borderTopLeftRadius,
        seam: Math.round(boxes[1].left - boxes[0].right),
      }
    })
    check('mosaic block is inset from the viewport edges', block.left > 40 && block.right < 1400, JSON.stringify(block))
    check('mosaic stays a connected block (no gap)', block.gap === 'normal' || parseFloat(block.gap) === 0, block.gap)
    check('mosaic cells keep square corners', parseFloat(block.radius) === 0, block.radius)
    check('mosaic cells share their seam', Math.abs(block.seam) <= 1, `${block.seam}px`)
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
