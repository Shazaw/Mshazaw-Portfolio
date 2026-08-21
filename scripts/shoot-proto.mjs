import { chromium } from 'playwright'
const out = process.env.OUT
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto('file://' + process.cwd() + '/docs/portfolio-prototype-v3.html', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
await page.evaluate(() => window.openChamber())
await page.waitForTimeout(4000)
await page.screenshot({ path: `${out}/proto-chamber.png` })
await page.evaluate(() => window.setMode('cards'))
await page.waitForTimeout(1200)
await page.screenshot({ path: `${out}/proto-cards.png` })
await browser.close()
console.log('done')
