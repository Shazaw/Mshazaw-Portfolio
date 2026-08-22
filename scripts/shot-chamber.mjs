import { chromium } from 'playwright'
const base = process.env.BASE || 'http://localhost:3112'
const out = process.env.OUT
const tag = process.env.TAG || 'x'
const browser = await chromium.launch()
for (const [name, path, wait] of [
  [`${tag}-projects`, '/projects', 5000],
  [`${tag}-awards`, '/awards', 5000],
]) {
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 980 } })
  const page = await ctx.newPage()
  await page.goto(base + path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(wait)
  await page.screenshot({ path: `${out}/${name}.png` })
  console.log(name)
  await ctx.close()
}
await browser.close()
