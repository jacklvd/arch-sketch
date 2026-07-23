import assert from 'node:assert/strict'
import test from 'node:test'
import {
  emptyCache,
  emptyDiagrams,
  generatedTypes,
  loadSystemCache,
  saveSystemCache,
  systemLabel,
  systemSignature,
  upsertSystem,
  type SystemEntry,
} from './diagramPersistence.ts'
import type { DiagramData, GenerateRequest } from '../types/diagram.ts'

class MemoryStorage implements Storage {
  #items = new Map<string, string>()

  get length() { return this.#items.size }
  clear() { this.#items.clear() }
  getItem(key: string) { return this.#items.get(key) ?? null }
  key(index: number) { return [...this.#items.keys()][index] ?? null }
  removeItem(key: string) { this.#items.delete(key) }
  setItem(key: string, value: string) { this.#items.set(key, value) }
}

function request(quest: string): GenerateRequest {
  return {
    quest,
    functional_reqs: 'Catalog, cart, checkout',
    non_functional_reqs: 'Peak traffic resilience',
    design_description: 'Event-driven services',
    diagram_type: 'high_level',
  }
}

function diagram(title: string): DiagramData {
  return {
    diagramType: 'high_level',
    title,
    nodes: [{ id: 'a', label: 'API', icon: 'server', position: { x: 0, y: 0 } }],
    edges: [],
  }
}

const ecommerce = request('Design an ecommerce platform')
const video = request('Design a video platform')

test('the four views share one signature, so they join one system', () => {
  const base = systemSignature(ecommerce)
  for (const diagram_type of ['database', 'api', 'low_level'] as const) {
    assert.equal(systemSignature({ ...ecommerce, diagram_type }), base)
  }

  let systems = upsertSystem([], ecommerce)
  systems = upsertSystem(systems, { ...ecommerce, diagram_type: 'api' })
  assert.equal(systems.length, 1)
})

test('editing any requirement starts a separate system, keeping the old one', () => {
  let systems = upsertSystem([], ecommerce)
  systems = upsertSystem(systems, video)

  assert.equal(systems.length, 2)
  assert.equal(systems[0].request.quest, 'Design a video platform')
  // The earlier system is still reachable — that is the point of the history.
  assert.ok(systems.some((s) => s.signature === systemSignature(ecommerce)))
})

test('revisiting a system moves it back to the front without duplicating it', () => {
  let systems = upsertSystem([], ecommerce)
  systems = upsertSystem(systems, video)
  systems = upsertSystem(systems, ecommerce)

  assert.equal(systems.length, 2)
  assert.equal(systems[0].signature, systemSignature(ecommerce))
})

test('revisiting preserves diagrams already generated for that system', () => {
  let systems = upsertSystem([], ecommerce)
  systems = [{ ...systems[0], diagrams: { ...emptyDiagrams(), high_level: diagram('Ecommerce') } }]
  systems = upsertSystem(systems, video)
  systems = upsertSystem(systems, ecommerce)

  assert.deepEqual(systems[0].diagrams.high_level, diagram('Ecommerce'))
})

test('history is capped so a long session cannot fill the quota', () => {
  let systems: SystemEntry[] = []
  for (let index = 0; index < 12; index += 1) systems = upsertSystem(systems, request(`System ${index}`))

  assert.equal(systems.length, 8)
  assert.equal(systems[0].request.quest, 'System 11')
})

test('whitespace-only edits keep the same system', () => {
  const systems = upsertSystem(upsertSystem([], ecommerce), { ...ecommerce, quest: `  ${ecommerce.quest}  ` })
  assert.equal(systems.length, 1)
})

test('a system is labelled by its diagram title, falling back to the quest', () => {
  const [entry] = upsertSystem([], ecommerce)
  assert.equal(systemLabel(entry), 'Design an ecommerce platform')
  assert.deepEqual(generatedTypes(entry), [])

  const generated = { ...entry, diagrams: { ...emptyDiagrams(), api: diagram('Ecommerce Platform') } }
  assert.equal(systemLabel(generated), 'Ecommerce Platform')
  assert.deepEqual(generatedTypes(generated), ['api'])
})

test('cache round-trips through versioned session storage', () => {
  const storage = new MemoryStorage()
  const cache = { activeSignature: systemSignature(ecommerce), systems: upsertSystem([], ecommerce) }
  saveSystemCache(cache, storage)

  assert.deepEqual(loadSystemCache(storage), cache)
  assert.match(storage.key(0) ?? '', /v1/)
})

test('malformed cache falls back to empty instead of throwing', () => {
  const storage = new MemoryStorage()
  storage.setItem('archsketch.systems.v1', '{not json')
  assert.deepEqual(loadSystemCache(storage), emptyCache())
})

test('unusable entries are dropped and the active pointer never dangles', () => {
  const storage = new MemoryStorage()
  storage.setItem('archsketch.systems.v1', JSON.stringify({
    activeSignature: 'gone',
    systems: [
      { signature: 'kept', request: ecommerce, diagrams: { ...emptyDiagrams(), high_level: diagram('Kept') } },
      { signature: 'no-request' },
    ],
  }))

  const loaded = loadSystemCache(storage)
  assert.equal(loaded.systems.length, 1)
  assert.equal(loaded.activeSignature, 'kept')
})

test('a full storage does not break generation', () => {
  const full = new MemoryStorage()
  full.setItem = () => { throw new DOMException('QuotaExceededError') }
  assert.doesNotThrow(() => saveSystemCache(emptyCache(), full))
})
