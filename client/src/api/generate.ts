import axios from 'axios'
import type { DiagramData, GenerateRequest } from '../types/diagram'

const API_BASE = 'http://localhost:8000/api'

export async function generateDiagram(request: GenerateRequest): Promise<DiagramData> {
  const response = await axios.post<DiagramData>(`${API_BASE}/generate`, request)
  return response.data
}

export async function checkOllamaHealth(): Promise<{ status: 'online' | 'offline'; models?: string[] }> {
  try {
    const response = await axios.get(`${API_BASE}/health/ollama`)
    return response.data
  } catch {
    return { status: 'offline' }
  }
}
