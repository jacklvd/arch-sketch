import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { checkOllamaHealth, generateDiagram } from './generate.ts'
import type { DiagramData, GenerateRequest } from '../types/diagram.ts'

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

const request: GenerateRequest = {
  quest: 'Design a video platform',
  functional_reqs: 'Upload and stream video',
  non_functional_reqs: '99.9% uptime',
  design_description: 'Event-driven processing',
  diagram_type: 'high_level',
}

const diagram: DiagramData = {
  diagramType: 'high_level',
  title: 'Video platform',
  nodes: [],
  edges: [],
}

test('generateDiagram posts the existing request contract with fetch', async () => {
  let capturedUrl = ''
  let capturedInit: RequestInit | undefined

  globalThis.fetch = async (input, init) => {
    capturedUrl = String(input)
    capturedInit = init
    return Response.json(diagram)
  }

  const result = await generateDiagram(request)

  assert.deepEqual(result, diagram)
  // Falls back to localhost when VITE_API_BASE is unset — which it is under the
  // node test runner (import.meta.env only exists in a Vite build).
  assert.equal(capturedUrl, 'http://localhost:8000/api/generate')
  assert.equal(capturedInit?.method, 'POST')
  assert.deepEqual(capturedInit?.headers, { 'Content-Type': 'application/json' })
  assert.deepEqual(JSON.parse(String(capturedInit?.body)), request)
})

test('generateDiagram exposes a structured backend error', async () => {
  globalThis.fetch = async () => Response.json(
    { detail: 'The model returned an invalid diagram' },
    { status: 422 },
  )

  await assert.rejects(
    () => generateDiagram(request),
    /The model returned an invalid diagram/,
  )
})

test('generateDiagram reports invalid success JSON', async () => {
  globalThis.fetch = async () => new Response('not-json', {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })

  await assert.rejects(
    () => generateDiagram(request),
    /invalid JSON/i,
  )
})

test('checkOllamaHealth converts transport failures to offline', async () => {
  globalThis.fetch = async () => {
    throw new TypeError('connection refused')
  }

  assert.deepEqual(await checkOllamaHealth(), { status: 'offline' })
})
