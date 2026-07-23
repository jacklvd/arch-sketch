import { expect, test, type Page } from '@playwright/test'

const tallClass = {
  attributes: Array.from({ length: 6 }, (_, index) => ({ visibility: '-', name: `field${index}`, type: 'string' })),
  methods: Array.from({ length: 6 }, (_, index) => ({ visibility: '+', name: `method${index}`, returnType: 'void' })),
  stereotype: '<<controller>>',
  pattern: 'Facade',
}

const highLevel = {
  diagramType: 'high_level',
  title: 'Video platform architecture',
  groups: [
    { id: 'edge', label: 'Edge', nodeIds: ['client', 'gateway'] },
    { id: 'services', label: 'Application services', nodeIds: ['video', 'auth', 'catalog'] },
  ],
  nodes: [
    { id: 'client', label: 'Web and mobile clients', icon: 'client', position: { x: 0, y: 0 } },
    { id: 'gateway', label: 'API Gateway', icon: 'aws_api_gateway', position: { x: 0, y: 0 } },
    { id: 'video', label: 'Video Service', icon: 'aws_lambda', position: { x: 0, y: 0 }, metadata: { tech: ['TypeScript'] } },
    { id: 'auth', label: 'Auth Service', icon: 'aws_cognito', position: { x: 0, y: 0 } },
    { id: 'catalog', label: 'Catalog Service', icon: 'aws_opensearch', position: { x: 0, y: 0 } },
    { id: 'storage', label: 'Object Storage', icon: 'aws_s3', position: { x: 0, y: 0 } },
  ],
  edges: [
    { id: 'e1', source: 'client', target: 'gateway', label: 'HTTPS' },
    { id: 'e2', source: 'gateway', target: 'video', label: 'routes' },
    { id: 'e3', source: 'gateway', target: 'auth', label: 'authenticates' },
    { id: 'e4', source: 'gateway', target: 'catalog', label: 'queries' },
    { id: 'e5', source: 'video', target: 'storage', label: 'stores' },
  ],
}

const lowLevel = {
  diagramType: 'low_level',
  title: 'Video upload pipeline',
  groups: [
    { id: 'application', label: 'Application', nodeIds: ['controller', 'validator', 'service'] },
    { id: 'data', label: 'Data and events', nodeIds: ['repository', 'events'] },
  ],
  nodes: [
    { id: 'controller', label: 'VideoUploadController', icon: 'api_service', type: 'class_node', position: { x: 0, y: 0 }, metadata: tallClass },
    { id: 'validator', label: 'UploadPolicyValidator', icon: 'firewall', type: 'class_node', position: { x: 0, y: 0 }, metadata: { ...tallClass, pattern: 'Strategy' } },
    { id: 'service', label: 'MultipartUploadService', icon: 'aws_s3', type: 'component_node', position: { x: 0, y: 0 }, metadata: { tech: ['TypeScript'], pattern: 'Builder' } },
    { id: 'repository', label: 'UploadSessionRepository', icon: 'postgres', type: 'component_node', position: { x: 0, y: 0 }, metadata: { tech: ['PostgreSQL'], pattern: 'Repository' } },
    { id: 'events', label: 'VideoProcessingEventBus', icon: 'kafka', type: 'component_node', position: { x: 0, y: 0 }, metadata: { tech: ['Kafka'], pattern: 'Observer' } },
  ],
  edges: [
    { id: 'e1', source: 'controller', target: 'validator', label: 'validates with' },
    { id: 'e2', source: 'controller', target: 'service', label: 'starts upload' },
    { id: 'e3', source: 'validator', target: 'service', label: 'permits' },
    { id: 'e4', source: 'service', target: 'repository', label: 'persists session' },
    { id: 'e5', source: 'service', target: 'events', label: 'publishes completion' },
  ],
}

async function installApi(page: Page) {
  await page.route('http://localhost:8000/api/health/ollama', (route) => route.fulfill({ json: { status: 'online' } }))
  await page.route('http://localhost:8000/api/generate', async (route) => {
    const request = route.request().postDataJSON() as { diagram_type: string }
    await route.fulfill({ json: request.diagram_type === 'low_level' ? lowLevel : highLevel })
  })
}

async function overlappingElements(page: Page, selector: string) {
  return page.locator(selector).evaluateAll((elements) => {
    const nodes = elements.map((element) => ({ id: element.getAttribute('data-id'), rect: element.getBoundingClientRect() }))
    const overlaps: string[] = []
    for (let left = 0; left < nodes.length; left += 1) {
      for (let right = left + 1; right < nodes.length; right += 1) {
        const a = nodes[left]
        const b = nodes[right]
        const x = Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left)
        const y = Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top)
        if (x > 0.5 && y > 0.5) overlaps.push(`${a.id}:${b.id}`)
      }
    }
    return overlaps
  })
}

test('desktop creates a dense diagram without node or group collisions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await installApi(page)
  await page.goto('/')

  await expect(page).toHaveTitle('ArchSketch')
  await page.getByLabel('What are you designing?').fill('Design a video platform')
  await page.getByRole('button', { name: 'Generate diagram' }).click()
  await expect(page.locator('details.constraints-disclosure')).toHaveAttribute('open', '')
  await expect(page.getByRole('alert')).toContainText('Complete all three constraints')
  await expect(page.getByLabel('Functional requirements')).toBeFocused()

  await page.getByRole('button', { name: 'Generate a video platform' }).click()
  await expect(page.locator('.react-flow__node').first()).toBeVisible()
  expect(new URL(page.url()).searchParams.get('view')).toBe('high_level')

  await page.getByRole('button', { name: 'Video platform', exact: true }).click()
  await page.getByRole('button', { name: /^Low-level/ }).click()
  await page.getByRole('button', { name: 'Generate diagram' }).click()
  await expect(page.locator('.react-flow__node').first()).toBeVisible()

  expect(await overlappingElements(page, '.react-flow__node:not(.react-flow__node-groupNode)')).toEqual([])
  expect(await overlappingElements(page, '.react-flow__node-groupNode')).toEqual([])
  await expect(page.getByRole('button', { name: 'Layout', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Fit', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Export', exact: true })).toBeVisible()
  await expect(page.locator('[aria-live="polite"]')).toContainText('VideoUploadController')
  expect(new URL(page.url()).searchParams.get('view')).toBe('low_level')
})

test('mobile prompt traps focus, persists its draft, and restores the URL view', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await installApi(page)
  await page.goto('/?view=api')

  await expect(page.getByRole('button', { name: /^API design/ })).toHaveAttribute('aria-current', 'page')
  await page.getByRole('button', { name: 'Describe', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Describe your system' })
  await expect(dialog).toBeVisible()
  expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true)
  await page.keyboard.press('Shift+Tab')
  await expect(dialog.getByRole('button', { name: 'Generate diagram' })).toBeFocused()

  await dialog.getByRole('button', { name: 'Video platform' }).click()
  await page.reload()
  await page.getByRole('button', { name: 'Describe', exact: true }).click()
  const restoredDialog = page.getByRole('dialog', { name: 'Describe your system' })
  await expect(restoredDialog.getByLabel('What are you designing?')).toHaveValue(/video streaming/i)
  await restoredDialog.getByRole('button', { name: 'Generate diagram' }).click()
  await expect(page.locator('.react-flow__node').first()).toBeVisible()

  await expect(page.getByRole('dialog', { name: 'Describe your system' })).toHaveCount(0)
  expect(await overlappingElements(page, '.react-flow__node:not(.react-flow__node-groupNode)')).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390)
  expect(new URL(page.url()).searchParams.get('view')).toBe('high_level')
})
