interface ErrorPayload {
  detail?: string
  message?: string
}

export async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init)
  const raw = await response.text()
  let payload: unknown = null

  if (raw) {
    try {
      payload = JSON.parse(raw)
    } catch {
      throw new Error(
        response.ok
          ? 'The server returned invalid JSON.'
          : `Request failed with HTTP ${response.status}.`,
      )
    }
  }

  if (!response.ok) {
    const error = payload as ErrorPayload | null
    throw new Error(
      error?.detail || error?.message || `Request failed with HTTP ${response.status}.`,
    )
  }

  return payload as T
}
