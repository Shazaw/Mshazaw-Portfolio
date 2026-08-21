import { chromium } from 'playwright'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } })
await page.goto('file://' + process.env.FILE)
await page.waitForTimeout(400)
await page.screenshot({ path: process.env.OUT, fullPage: true })
await browser.close()
