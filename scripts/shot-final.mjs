import { chromium } from 'playwright'
const base = process.env.BASE || 'http://localhost:3112'
const out = process.env.OUT
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
const page = await ctx.newPage()
await page.goto(base + '/', { waitUntil: 'networkidle' })
await page.waitForTimeout(2200)
for (const [name, sel] of [
  ['f1-about', '#about'],
  ['f2-projects', '#projects'],
  ['f3-experience', '#experience'],
  ['f4-organizations', '#organizations'],
  ['f5-awards', '#awards'],
]) {
  await page.evaluate((s) => {
    const el = document.querySelector(s)
    window.scrollTo(0, window.scrollY + el.getBoundingClientRect().top - 30)
  }, sel)
  await page.waitForTimeout(2200)
  await page.screenshot({ path: `${out}/${name}.png` })
  console.log(name)
}
// Motif variety across the three strips that use artwork.
const motifs = await page.evaluate(() =>
  ['#experience', '#organizations', '#awards'].map((s) => {
    const cards = [...document.querySelectorAll(`${s} article`)]
    return { section: s, paths: cards.map((c) => c.querySelector('svg path')?.getAttribute('d')?.slice(0, 26) ?? 'img') }
  }),
)
for (const m of motifs) {
  const unique = new Set(m.paths).size
  console.log(`${m.section}: ${m.paths.length} cards, ${unique} distinct motifs`)
}
await browser.close()
