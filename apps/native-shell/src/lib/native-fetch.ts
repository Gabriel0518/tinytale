import { Capacitor, CapacitorHttp } from '@capacitor/core'

function normalizeHeaders(headers?: HeadersInit) {
  const entries = new Headers(headers)
  const normalized: Record<string, string> = {}
  entries.forEach((value, key) => {
    normalized[key] = value
  })
  return normalized
}

function normalizeBody(body: BodyInit | null | undefined) {
  if (!body) return undefined
  if (typeof body !== 'string') return body

  try {
    return JSON.parse(body)
  } catch {
    return body
  }
}

function toResponseBody(data: unknown) {
  if (typeof data === 'string') return data
  if (data === null || data === undefined) return ''
  return JSON.stringify(data)
}

export const nativeShellFetch: typeof fetch = async (input, init) => {
  if (!Capacitor.isNativePlatform()) {
    return fetch(input, init)
  }

  const request = input instanceof Request ? input : undefined
  const url = typeof input === 'string' || input instanceof URL ? input.toString() : request?.url || ''
  const method = init?.method || request?.method || 'GET'
  const headers = normalizeHeaders(init?.headers || request?.headers)
  const body = normalizeBody(init?.body || request?.body)

  try {
    const response = await CapacitorHttp.request({
      url,
      method,
      headers,
      data: body,
      responseType: 'text',
    })

    return new Response(toResponseBody(response.data), {
      status: response.status,
      headers: response.headers,
    })
  } catch (error) {
    console.error('[native-shell] CapacitorHttp request failed, falling back to fetch', {
      url,
      method,
      error,
    })
    return fetch(input, init)
  }
}
