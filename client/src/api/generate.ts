import type { DiagramData, GenerateRequest } from '../types/diagram'
import { requestJson } from './request.ts'

// Vite inlines this at build time, so the deployed bundle carries the Worker URL.
// The optional chain matters: `import.meta.env` only exists under Vite, and the
// node test runner imports this module directly. Default keeps `yarn dev` and
// docker compose working with no .env at all.
const API_BASE = import.meta.env?.VITE_API_BASE ?? 'http://localhost:8000/api'

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
