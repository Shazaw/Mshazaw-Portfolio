/**
 * Performance budgets from spec §10, measured against a running production
 * build rather than guessed from the build manifest.
 *
 *   route JS      <= 180 KB gz   (excluding the lazily-loaded 3D chunk)
 *   Three chunk   <= 200 KB gz   (lazy)
 *   first visit   <= 1.2 MB total
 *
 * Usage: BASE=http://localhost:3111 npx tsx scripts/check-budgets.ts
 */
import { chromium, type Page } from 'playwright'

const BASE = process.env.BASE || 'http://localhost:3111'
const KB = 1024

interface Measurement {
  route: string
  routeJs: number
  threeJs: number
  total: number
}

/** Three.js is the only dependency big enough to need its own budget. */
const isThreeChunk = (size: number, lazy: boolean) => lazy && size > 100 * KB

const measure = async (page: Page, route: string, settleMs: number): Promise<Measurement> => {
  await page.goto(`${BASE}${route}`, { waitUntil: 'load' })
  await page.waitForTimeout(settleMs)

  /*
   * A chunk counts as lazy when it was requested after the load event — which
   * is exactly what a dynamic import does. Snapshotting the resource list at
   * `load` instead races the import: on the homepage the 3D chunk starts a few
   * milliseconds before the snapshot and gets billed to the route.
   */
  const entries = (await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    return performance.getEntriesByType('resource').map((entry) => {
      const resource = entry as PerformanceResourceTiming
      return {
        name: resource.name,
        size: resource.encodedBodySize || resource.transferSize || 0,
        type: resource.initiatorType,
        lazy: resource.startTime > (nav?.loadEventEnd ?? 0),
      }
    })
  })) as { name: string; size: number; type: string; lazy: boolean }[]

  let routeJs = 0
  let threeJs = 0
  let total = 0

  for (const entry of entries) {
    total += entry.size
    if (!/\.js(\?|$)/.test(entry.name)) continue
    if (isThreeChunk(entry.size, entry.lazy)) threeJs += entry.size
    else routeJs += entry.size
  }

  const html = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    return nav?.encodedBodySize ?? 0
  })

  return { route, routeJs, threeJs, total: total + html }
}

const run = async () => {
  const browser = await chromium.launch()
  const results: Measurement[] = []

  for (const [route, settle] of [
    ['/', 3000],
    ['/projects', 4000],
    ['/experience', 4000],
    ['/awards', 4000],
  ] as [string, number][]) {
    const context = await browser.newContext()
    const page = await context.newPage()
    results.push(await measure(page, route, settle))
    await context.close()
  }

  await browser.close()

  const fmt = (bytes: number) => `${(bytes / KB).toFixed(1)} KB`
  let failed = 0

  console.log('\nPerformance budgets (spec §10) — transferred, compressed\n')
  console.log('route'.padEnd(30) + 'route JS'.padStart(12) + '3D chunk'.padStart(12) + 'page total'.padStart(13))
  console.log('─'.repeat(67))

  for (const result of results) {
    console.log(
      result.route.padEnd(30) +
        fmt(result.routeJs).padStart(12) +
        (result.threeJs ? fmt(result.threeJs) : '—').padStart(12) +
        fmt(result.total).padStart(13),
    )

    if (result.routeJs > 180 * KB) {
      console.error(`  ✗ ${result.route}: route JS ${fmt(result.routeJs)} exceeds 180 KB`)
      failed++
    }
    if (result.threeJs > 200 * KB) {
      console.error(`  ✗ ${result.route}: 3D chunk ${fmt(result.threeJs)} exceeds 200 KB`)
      failed++
    }
    if (result.total > 1.2 * 1024 * KB) {
      console.error(`  ✗ ${result.route}: page total ${fmt(result.total)} exceeds 1.2 MB`)
      failed++
    }
  }

  console.log('─'.repeat(67))
  console.log(failed === 0 ? 'all budgets met ✓\n' : `${failed} budget breach(es)\n`)
  process.exit(failed === 0 ? 0 : 1)
}

void run()
