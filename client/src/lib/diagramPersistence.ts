import type { DiagramData, DiagramType, GenerateRequest } from '../types/diagram'

const STORAGE_KEY = 'archsketch.systems.v1'

export const DIAGRAM_TYPES: DiagramType[] = ['high_level', 'database', 'api', 'low_level']

// Bounded so a long session cannot fill the session quota. Oldest-used falls off.
const MAX_SYSTEMS = 8

export type DiagramMap = Record<DiagramType, DiagramData | null>

export interface SystemEntry {
  /** Identity of the system — see systemSignature. */
  signature: string
  /** Last request used, so revisiting can refill the composer and regenerate. */
  request: GenerateRequest
  diagrams: DiagramMap
}

export interface SystemCache {
  activeSignature: string
  /** Most recently used first; index 0 is what a fresh tab opens on. */
  systems: SystemEntry[]
}

export function emptyDiagrams(): DiagramMap {
  return { high_level: null, database: null, api: null, low_level: null }
}

export function emptyCache(): SystemCache {
  return { activeSignature: '', systems: [] }
}

/** All four views describe one system, so everything *except* diagram_type
 *  identifies it. Same requirements → the views join one entry; edit any of
 *  them and the next generate starts a separate entry instead of overwriting. */
export function systemSignature(request: GenerateRequest): string {
  return JSON.stringify([
    request.quest.trim(),
    request.functional_reqs.trim(),
    request.non_functional_reqs.trim(),
    request.design_description.trim(),
  ])
}

/** Prefer a generated diagram's title — it is a cleaner name than the raw
 *  prompt — and fall back to the quest before anything has been generated. */
export function systemLabel(entry: SystemEntry): string {
  for (const type of DIAGRAM_TYPES) {
    const title = entry.diagrams[type]?.title
    if (title) return title
  }
  return entry.request.quest.trim() || 'Untitled system'
}

export function generatedTypes(entry: SystemEntry): DiagramType[] {
  return DIAGRAM_TYPES.filter((type) => entry.diagrams[type])
}

/** Move `request`'s system to the front, creating it if new, and make it active.
 *  Returns a fresh array — callers hand this straight to the store. */
export function upsertSystem(systems: SystemEntry[], request: GenerateRequest): SystemEntry[] {
  const signature = systemSignature(request)
  const existing = systems.find((system) => system.signature === signature)
  const entry: SystemEntry = existing
    ? { ...existing, request }
    : { signature, request, diagrams: emptyDiagrams() }
  return [entry, ...systems.filter((system) => system.signature !== signature)].slice(0, MAX_SYSTEMS)
}

// sessionStorage, not localStorage: history should survive a refresh but die
// with the tab, and never leak one tab's systems into another.
function defaultStorage(): Storage | undefined {
  return typeof window === 'undefined' ? undefined : window.sessionStorage
}

function isDiagram(value: unknown): value is DiagramData {
  if (!value || typeof value !== 'object') return false
  const diagram = value as Partial<DiagramData>
  return Array.isArray(diagram.nodes) && Array.isArray(diagram.edges) && typeof diagram.title === 'string'
}

function isRequest(value: unknown): value is GenerateRequest {
  if (!value || typeof value !== 'object') return false
  const request = value as Partial<GenerateRequest>
  return typeof request.quest === 'string' && typeof request.diagram_type === 'string'
}

function reviveEntry(value: unknown): SystemEntry | null {
  if (!value || typeof value !== 'object') return null
  const entry = value as Partial<SystemEntry>
  if (typeof entry.signature !== 'string' || !isRequest(entry.request)) return null

  const diagrams = emptyDiagrams()
  for (const type of DIAGRAM_TYPES) {
    const diagram = entry.diagrams?.[type]
    if (isDiagram(diagram)) diagrams[type] = diagram
  }
  return { signature: entry.signature, request: entry.request, diagrams }
}

export function loadSystemCache(storage = defaultStorage()): SystemCache {
  if (!storage) return emptyCache()

  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return emptyCache()
    const parsed = JSON.parse(raw) as Partial<SystemCache>
    if (!Array.isArray(parsed.systems)) return emptyCache()

    const systems = parsed.systems
      .map(reviveEntry)
      .filter((entry): entry is SystemEntry => entry !== null)
      .slice(0, MAX_SYSTEMS)

    // Never point at a system that failed to revive.
    const activeSignature = systems.some((system) => system.signature === parsed.activeSignature)
      ? (parsed.activeSignature as string)
      : (systems[0]?.signature ?? '')

    return { activeSignature, systems }
  } catch {
    return emptyCache()
  }
}

export function saveSystemCache(cache: SystemCache, storage = defaultStorage()) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(cache))
  } catch {
    // Quota exceeded or storage disabled (Safari private mode). History is an
    // optimisation, so degrade to in-memory rather than breaking generation.
  }
}
