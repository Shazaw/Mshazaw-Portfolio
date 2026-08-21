import { chromium } from 'playwright'

const base = process.env.BASE || 'http://localhost:3111'
const out = process.env.OUT || './shots'

const shots = [
  { name: '01-home-hero', path: '/', wait: 1800 },
  { name: '02-home-strip', path: '/', scroll: 2.0, wait: 2200 },
  { name: '03-home-ctf', path: '/', scroll: 5.0, wait: 2200 },
  { name: '04-projects-chamber', path: '/projects', wait: 4000 },
  { name: '05-projects-popup', path: '/projects?focus=sanct-e2e-messaging', wait: 5000 },
  { name: '06-projects-cards', path: '/projects', wait: 4000, click: 'button:has-text("Cards")', after: 1200 },
  { name: '07-about', path: '/about', wait: 1500 },
  { name: '08-ctf-index', path: '/ctf', wait: 1200 },
  { name: '09-ctf-comp', path: '/ctf/ugm-internal-ctf-2026?mode=authored', wait: 1200 },
  { name: '09b-ctf-comp-open', path: '/ctf/ugm-internal-ctf-2026?mode=authored', wait: 1200, click: 'button:has-text("Cryptography")', after: 900 },
  { name: '09c-ctf-challenge', path: '/ctf/cyber-jawara-national', wait: 1200, click: 'button:has-text("Cryptography")', after: 900 },
  { name: '10-awards-chamber', path: '/awards', wait: 4000 },
  { name: '11-mobile-home', path: '/', wait: 1500, viewport: { width: 390, height: 844 } },
  { name: '12-mobile-projects', path: '/projects', wait: 2000, viewport: { width: 390, height: 844 } },
  { name: '13-experience-cards', path: '/experience', wait: 4000, click: 'button:has-text("Cards")', after: 1200 },
]

const browser = await chromium.launch()

for (const shot of shots) {
  const context = await browser.newContext({
    viewport: shot.viewport ?? { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()
  const errors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', (err) => errors.push(String(err)))

  await page.goto(base + shot.path, { waitUntil: 'networkidle' })
  if (shot.scroll) {
    await page.evaluate((n) => window.scrollTo(0, window.innerHeight * n), shot.scroll)
  }
  await page.waitForTimeout(shot.wait ?? 1000)
  if (shot.click) {
    await page.click(shot.click).catch(() => {})
    await page.waitForTimeout(shot.after ?? 800)
  }
  await page.screenshot({ path: `${out}/${shot.name}.png` })
  console.log(`${shot.name}${errors.length ? '  ⚠ ' + errors.slice(0, 3).join(' | ') : ''}`)
  await context.close()
}

await browser.close()
