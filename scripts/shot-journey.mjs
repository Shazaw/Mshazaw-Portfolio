import { chromium } from 'playwright'
const base = process.env.BASE || 'http://localhost:3112'
const out = process.env.OUT
const fractions = (process.env.FRACS || '0,0.05,0.1,0.14,0.18,0.22,0.3,0.42,0.54,0.7,0.85').split(',').map(Number)
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
await page.goto(base + '/', { waitUntil: 'networkidle' })
await page.waitForTimeout(2500)
for (const f of fractions) {
  await page.evaluate((frac) => {
    const doc = document.documentElement
    window.scrollTo(0, frac * (doc.scrollHeight - window.innerHeight))
  }, f)
  // Camera damping needs time to settle after a jump.
  await page.waitForTimeout(2600)
  const name = `j-${String(Math.round(f * 100)).padStart(2, '0')}`
  await page.screenshot({ path: `${out}/${name}.png` })
  console.log(name)
}
await browser.close()
