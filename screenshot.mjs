import puppeteer from 'puppeteer'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const routes = [
  { name: 'settings-light', url: 'http://localhost:5173/settings', dark: false },
  { name: 'settings-dark', url: 'http://localhost:5173/settings', dark: true },
]

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 900 })

for (const route of routes) {
  await page.goto(route.url, { waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {})
  await page.waitForTimeout(800)

  if (route.dark) {
    // Toggle dark mode via localStorage and reload
    await page.evaluate(() => {
      localStorage.setItem('clubsync-dark', 'true')
    })
    await page.reload({ waitUntil: 'networkidle2' })
    await page.waitForTimeout(800)
  } else {
    await page.evaluate(() => {
      localStorage.setItem('clubsync-dark', 'false')
    })
    await page.reload({ waitUntil: 'networkidle2' })
    await page.waitForTimeout(800)
  }

  const outPath = path.join(__dirname, `screenshot-${route.name}.png`)
  await page.screenshot({ path: outPath, fullPage: false })
  console.log(`Saved: screenshot-${route.name}.png`)
}

await browser.close()
