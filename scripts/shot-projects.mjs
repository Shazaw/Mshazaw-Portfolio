import { chromium } from 'playwright'

const out = process.env.OUT
const targets = JSON.parse(process.env.TARGETS)

const browser = await chromium.launch()
for (const t of targets) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  })
  const page = await ctx.newPage()
  try {
    await page.goto(t.url, { waitUntil: t.wait ?? 'networkidle', timeout: 45000 })
    await page.waitForTimeout(t.settle ?? 2500)
    if (t.dismiss) {
      for (const sel of t.dismiss) {
        await page.click(sel, { timeout: 2000 }).catch(() => {})
      }
      await page.waitForTimeout(600)
    }
    if (t.scroll) {
      await page.evaluate((n) => window.scrollTo(0, n), t.scroll)
      await page.waitForTimeout(1200)
    }
    await page.screenshot({ path: `${out}/${t.name}.png` })
    console.log(`✓ ${t.name}  ${await page.title()}`)
  } catch (e) {
    console.log(`✗ ${t.name}  ${String(e).split('\n')[0]}`)
  }
  await ctx.close()
}
await browser.close()
