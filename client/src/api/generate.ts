import type { DiagramData, GenerateRequest } from '../types/diagram'
import { requestJson } from './request.ts'

const API_BASE = 'http://localhost:8000/api'

export async function generateDiagram(request: GenerateRequest): Promise<DiagramData> {
  return requestJson<DiagramData>(`${API_BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
}

export async function checkOllamaHealth(): Promise<{ status: 'online' | 'offline'; models?: string[] }> {
  try {
    return await requestJson<{ status: 'online' | 'offline'; models?: string[] }>(
      `${API_BASE}/health/ollama`,
    )
  } catch {
    return { status: 'offline' }
  }
}
