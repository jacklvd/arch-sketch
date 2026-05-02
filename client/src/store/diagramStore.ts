import { create } from 'zustand'
import type { Node, Edge } from '@xyflow/react'
import type { DiagramData, DiagramType, GenerateRequest } from '../types/diagram'

interface DiagramStore {
  diagrams: Record<DiagramType, DiagramData | null>
  lastRequests: Partial<Record<DiagramType, GenerateRequest>>
  nodes: Node[]
  edges: Edge[]
  activeDiagramType: DiagramType
  isLoading: boolean
  error: string | null
  diagramKey: number

  setActiveDiagramType: (type: DiagramType) => void
  setDiagram: (type: DiagramType, data: DiagramData) => void
  setLastRequest: (type: DiagramType, req: GenerateRequest) => void
  setNodes: (nodes: Node[]) => void
  setEdges: (edges: Edge[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  bumpKey: () => void
}

export const useDiagramStore = create<DiagramStore>((set) => ({
  diagrams: { high_level: null, database: null, api: null, low_level: null },
  lastRequests: {},
  nodes: [],
  edges: [],
  activeDiagramType: 'high_level',
  isLoading: false,
  error: null,
  diagramKey: 0,

  setActiveDiagramType: (activeDiagramType) => set({ activeDiagramType }),
  setDiagram: (type, data) =>
    set((state) => ({
      diagrams: { ...state.diagrams, [type]: data },
      activeDiagramType: type,
      diagramKey: state.diagramKey + 1,
    })),
  setLastRequest: (type, req) =>
    set((state) => ({ lastRequests: { ...state.lastRequests, [type]: req } })),
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  bumpKey: () => set((state) => ({ diagramKey: state.diagramKey + 1 })),
}))
