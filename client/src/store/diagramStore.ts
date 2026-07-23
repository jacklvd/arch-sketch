import { create } from 'zustand'
import type { Node, Edge } from '@xyflow/react'
import type { DiagramData, DiagramType, GenerateRequest } from '../types/diagram'
import {
  emptyDiagrams,
  loadSystemCache,
  saveSystemCache,
  systemSignature,
  upsertSystem,
  type DiagramMap,
  type SystemEntry,
} from '../lib/diagramPersistence'

interface DiagramStore {
  systems: SystemEntry[]
  activeSignature: string
  nodes: Node[]
  edges: Edge[]
  activeDiagramType: DiagramType
  isLoading: boolean
  error: string | null
  diagramKey: number

  setActiveDiagramType: (type: DiagramType) => void
  setDiagram: (type: DiagramType, data: DiagramData) => void
  startSystem: (req: GenerateRequest) => void
  selectSystem: (signature: string) => void
  setNodes: (nodes: Node[]) => void
  setEdges: (edges: Edge[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  bumpKey: () => void
}

const restored = loadSystemCache()

// Must be a stable reference: as a selector result a fresh object every call
// fails useSyncExternalStore's getSnapshot caching and re-renders forever.
const NO_DIAGRAMS: DiagramMap = emptyDiagrams()

/** Diagrams of the active system, or an empty set while composing a new one. */
export function activeDiagrams(state: DiagramStore): DiagramMap {
  return state.systems.find((s) => s.signature === state.activeSignature)?.diagrams ?? NO_DIAGRAMS
}

export function activeSystem(state: DiagramStore): SystemEntry | undefined {
  return state.systems.find((s) => s.signature === state.activeSignature)
}

export const useDiagramStore = create<DiagramStore>((set, get) => {
  const persist = () => {
    const { activeSignature, systems } = get()
    saveSystemCache({ activeSignature, systems })
  }

  return {
    systems: restored.systems,
    activeSignature: restored.activeSignature,
    nodes: [],
    edges: [],
    activeDiagramType: 'high_level',
    isLoading: false,
    error: null,
    diagramKey: 0,

    setActiveDiagramType: (activeDiagramType) => set({ activeDiagramType }),

    setDiagram: (type, data) => {
      set((state) => ({
        systems: state.systems.map((system) => (
          system.signature === state.activeSignature
            ? { ...system, diagrams: { ...system.diagrams, [type]: data } }
            : system
        )),
        activeDiagramType: type,
        diagramKey: state.diagramKey + 1,
      }))
      persist()
    },

    // Called before generating: same requirements rejoin the existing system,
    // edited ones open a new entry alongside it rather than replacing it.
    startSystem: (req) => {
      set((state) => ({
        systems: upsertSystem(state.systems, req),
        activeSignature: systemSignature(req),
      }))
      persist()
    },

    selectSystem: (activeSignature) => {
      set({ activeSignature })
      persist()
    },

    setNodes: (nodes) => set({ nodes }),
    setEdges: (edges) => set({ edges }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    bumpKey: () => set((state) => ({ diagramKey: state.diagramKey + 1 })),
  }
})
