/** HTTP client: base `/api`, Bearer from localStorage. */

export const AUTH_TOKEN_KEY = 'alfa_auth_token'

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token)
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY)
  }
}

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type ApiFetchOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
  auth?: boolean
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { body, auth = true, headers: initHeaders, ...rest } = options
  const headers = new Headers(initHeaders)

  if (body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (auth) {
    const token = getAuthToken()
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  }

  const response = await fetch(`/api${path}`, {
    ...rest,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text) as unknown
    } catch {
      data = text
    }
  }

  if (!response.ok) {
    const detail =
      typeof data === 'object' &&
      data !== null &&
      'detail' in data &&
      typeof (data as { detail: unknown }).detail === 'string'
        ? (data as { detail: string }).detail
        : response.statusText || 'Request failed'
    throw new ApiError(response.status, detail)
  }

  return data as T
}
