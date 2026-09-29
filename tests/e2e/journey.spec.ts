import { expect, test, type Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const dist = path.resolve('dist')
const file = fs.readdirSync(dist).find((f) => /^JnJ-MedTech-Onboarding-v.+\.html$/.test(f))
const url = 'file://' + path.join(dist, file ?? 'missing.html')

interface Station {
  id: string
  kind: string
  title: string
  checkpoint?: { options: string[]; answer: number }
  questions?: { options: string[]; answer: number }[]
}

/** Blocks every request that doesn't come from the file itself, and records it. */
async function offline(page: Page) {
  const external: string[] = []
  await page.route('**/*', (route) => {
    const requestUrl = route.request().url()
    if (/^(file|data|blob):/.test(requestUrl)) return route.continue()
    external.push(requestUrl)
    return route.abort()
  })
  return external
}

async function readContent(page: Page): Promise<{ stations: Station[] }> {
  return page.evaluate(() => JSON.parse(document.getElementById('onboarding-content')!.textContent!))
}

async function nextUntil(page: Page, predicate: () => Promise<boolean>) {
  for (let i = 0; i < 12 && !(await predicate()); i++) {
    await page.locator('.panel-footer').getByRole('button', { name: /^Next/ }).click()
  }
}

test('a new employee can complete the whole journey offline', async ({ page }) => {
  expect(file, 'run "npm run build" first').toBeTruthy()
  const external = await offline(page)
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))

  await page.goto(url)
  const { stations } = await readContent(page)
  await expect(page.locator('#panel-title')).toHaveText(stations[0].title)
  await expect(page.locator('canvas')).toBeVisible()

  // Welcome: read the cards, then enter a name.
  const nameField = page.getByLabel(/Your name/)
  await nextUntil(page, () => nameField.isVisible())
  await nameField.fill('Alex Tester')
  await page.getByRole('button', { name: /Start my journey/ }).click()

  for (const station of stations.slice(1, -1)) {
    await expect(page.locator('#panel-title')).toHaveText(station.title)
    const check = page.getByRole('button', { name: 'Check answer' })
    await nextUntil(page, () => check.isVisible())
    const correct = station.checkpoint!.options[station.checkpoint!.answer]
    await page.locator('.checkpoint .option', { hasText: correct }).first().click()
    await check.click()
    await expect(page.getByText('Correct!')).toBeVisible()
    await page.getByRole('button', { name: /^Continue to/ }).click()
  }

  // Knowledge check.
  const finish = stations[stations.length - 1]
  await expect(page.locator('#panel-title')).toHaveText(finish.title)
  await nextUntil(page, () => page.locator('.quiz').isVisible())
  const questions = page.locator('.quiz > ol > li')
  for (const [i, q] of finish.questions!.entries()) {
    await questions.nth(i).locator('.option', { hasText: q.options[q.answer] }).first().click()
  }
  await page.getByRole('button', { name: 'Submit answers' }).click()
  await expect(page.locator('.panel .certificate-name')).toHaveText('Alex Tester')
  await expect(page.getByText('100%')).toBeVisible()

  // Progress survives a reload.
  await page.reload()
  await expect(page.locator('#panel-title')).toHaveText(finish.title)
  await expect(page.locator('.journey-dot.done')).toHaveCount(stations.length)

  expect(external).toEqual([])
  expect(errors).toEqual([])
})

test('locked stations cannot be opened early', async ({ page }) => {
  await offline(page)
  await page.goto(url)
  const dots = page.locator('.journey-dot')
  await expect(dots.nth(0)).toBeEnabled()
  await expect(dots.nth(2)).toBeDisabled()
})

test('text-only mode shows the same content without 3D', async ({ page }) => {
  const external = await offline(page)
  await page.goto(url + '?textonly&preview&station=products')
  await expect(page.locator('canvas')).toHaveCount(0)
  await expect(page.locator('#panel-title')).toHaveText('Our Products')
  await nextUntil(page, () => page.locator('.product-list').isVisible())
  await page.getByRole('button', { name: 'CARTO 3 System' }).click()
  await expect(page.getByText('What it does')).toBeVisible()
  expect(external).toEqual([])
})

test('falls back to text-only mode when WebGL is unavailable', async ({ browser }) => {
  const context = await browser.newContext()
  await context.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (type.startsWith('webgl')) return null
      return original.call(this, type as '2d', ...(args as []))
    } as typeof original
  })
  const page = await context.newPage()
  await page.goto(url)
  await expect(page.locator('.notice')).toContainText('text-only')
  await expect(page.locator('#panel-title')).toBeVisible()
  await context.close()
})

test('a broken content block shows a helpful message', async ({ page }) => {
  const html = fs.readFileSync(path.join(dist, file!), 'utf8').replace('"passMark": 0.8', '"passMark": "high"')
  const broken = path.join(dist, 'broken-test.html')
  fs.writeFileSync(broken, html)
  try {
    await page.goto('file://' + broken)
    await expect(page.getByRole('heading', { name: /needs a fix/ })).toBeVisible()
    await expect(page.getByText(/station "finish" › passMark/)).toBeVisible()
  } finally {
    fs.unlinkSync(broken)
  }
})
