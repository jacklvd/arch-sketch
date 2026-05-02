export type DiagramType = 'high_level' | 'database' | 'api' | 'low_level'

export interface NodePosition {
  x: number
  y: number
}

export interface DbColumn {
  name: string
  type: string
  pk?: boolean
  fk?: boolean
}

export interface ApiEndpoint {
  method: string
  path: string
  response: string
}

export interface ClassAttribute {
  visibility: '+' | '-' | '#'
  name: string
  type: string
}

export interface ClassMethod {
  visibility: '+' | '-' | '#'
  name: string
  params?: string
  returnType?: string
}

export interface NodeMetadata {
  tech?: string[]
  columns?: DbColumn[]
  endpoints?: ApiEndpoint[]
  attributes?: ClassAttribute[]
  methods?: ClassMethod[]
  pattern?: string
  stereotype?: string
}

export interface DiagramNode {
  id: string
  label: string
  icon: string
  group?: string
  type?: string
  position: NodePosition
  metadata?: NodeMetadata
}

export interface DiagramEdge {
  id: string
  source: string
  target: string
  label?: string
  style?: 'solid' | 'dashed' | 'animated'
  labelPosition?: string
}

export interface DiagramGroup {
  id: string
  label: string
  nodeIds: string[]
  style?: string
}

export interface DiagramData {
  diagramType: DiagramType
  title: string
  nodes: DiagramNode[]
  edges: DiagramEdge[]
  groups?: DiagramGroup[]
}

export interface GenerateRequest {
  quest: string
  functional_reqs: string
  non_functional_reqs: string
  design_description: string
  diagram_type: DiagramType
}
