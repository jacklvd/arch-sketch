import assert from 'node:assert/strict'
import test from 'node:test'
import { createEmptyPrompt, loadPromptDraft, savePromptDraft } from './promptPersistence.ts'
import type { GenerateRequest } from '../types/diagram.ts'

class MemoryStorage implements Storage {
  #items = new Map<string, string>()

  get length() { return this.#items.size }
  clear() { this.#items.clear() }
  getItem(key: string) { return this.#items.get(key) ?? null }
  key(index: number) { return [...this.#items.keys()][index] ?? null }
  removeItem(key: string) { this.#items.delete(key) }
  setItem(key: string, value: string) { this.#items.set(key, value) }
}

const request: GenerateRequest = {
  quest: 'Design a commerce platform',
  functional_reqs: 'Catalog, cart, checkout',
  non_functional_reqs: 'Peak traffic resilience',
  design_description: 'Event-driven services',
  diagram_type: 'database',
}

test('prompt draft round-trips through versioned storage', () => {
  const storage = new MemoryStorage()
  savePromptDraft(request, storage)
  assert.deepEqual(loadPromptDraft(storage), request)
  assert.match(storage.key(0) ?? '', /v1/)
})

test('malformed saved prompt falls back to an empty prompt', () => {
  const storage = new MemoryStorage()
  storage.setItem('archsketch.prompt.v1', '{not json')
  assert.deepEqual(loadPromptDraft(storage), createEmptyPrompt())
})

test('incomplete saved prompt is normalized without losing valid fields', () => {
  const storage = new MemoryStorage()
  storage.setItem('archsketch.prompt.v1', JSON.stringify({
    quest: 'Keep me',
    diagram_type: 'not-a-view',
  }))

  assert.deepEqual(loadPromptDraft(storage), {
    ...createEmptyPrompt(),
    quest: 'Keep me',
  })
})
