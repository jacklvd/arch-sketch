import type { DiagramType, GenerateRequest } from '../types/diagram'

const STORAGE_KEY = 'archsketch.prompt.v1'
const DIAGRAM_TYPES = new Set<DiagramType>(['high_level', 'database', 'api', 'low_level'])

export function createEmptyPrompt(): GenerateRequest {
  return {
    quest: '',
    functional_reqs: '',
    non_functional_reqs: '',
    design_description: '',
    diagram_type: 'high_level',
  }
}

function defaultStorage(): Storage | undefined {
  return typeof window === 'undefined' ? undefined : window.localStorage
}

export function loadPromptDraft(storage = defaultStorage()): GenerateRequest {
  if (!storage) return createEmptyPrompt()

  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return createEmptyPrompt()
    const parsed = JSON.parse(raw) as Partial<Record<keyof GenerateRequest, unknown>>
    const empty = createEmptyPrompt()
    return {
      quest: typeof parsed.quest === 'string' ? parsed.quest : empty.quest,
      functional_reqs: typeof parsed.functional_reqs === 'string' ? parsed.functional_reqs : empty.functional_reqs,
      non_functional_reqs: typeof parsed.non_functional_reqs === 'string' ? parsed.non_functional_reqs : empty.non_functional_reqs,
      design_description: typeof parsed.design_description === 'string' ? parsed.design_description : empty.design_description,
      diagram_type: typeof parsed.diagram_type === 'string' && DIAGRAM_TYPES.has(parsed.diagram_type as DiagramType)
        ? parsed.diagram_type as DiagramType
        : empty.diagram_type,
    }
  } catch {
    return createEmptyPrompt()
  }
}

export function savePromptDraft(
  request: GenerateRequest,
  storage = defaultStorage(),
) {
  storage?.setItem(STORAGE_KEY, JSON.stringify(request))
}
