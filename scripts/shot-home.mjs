import { chromium } from 'playwright'
const base = process.env.BASE || 'http://localhost:3112'
const out = process.env.OUT
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
const page = await ctx.newPage()
await page.goto(base + '/', { waitUntil: 'networkidle' })
await page.waitForTimeout(2200)
await page.screenshot({ path: `${out}/h1-hero.png` })
for (const [name, sel] of [['h2-about', '#about'], ['h3-experience', '#experience'], ['h4-toolkit', '#toolkit']]) {
  await page.evaluate((s) => {
    const el = document.querySelector(s)
    window.scrollTo(0, window.scrollY + el.getBoundingClientRect().top - 30)
  }, sel)
  await page.waitForTimeout(2200)
  await page.screenshot({ path: `${out}/${name}.png` })
  console.log(name)
}
await browser.close()
