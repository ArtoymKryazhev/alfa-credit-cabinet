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

function detailFromPayload(data: unknown, fallback: string): string {
  if (
    typeof data === 'object' &&
    data !== null &&
    'detail' in data &&
    typeof (data as { detail: unknown }).detail === 'string'
  ) {
    return (data as { detail: string }).detail
  }
  return fallback
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { body, auth = true, headers: initHeaders, ...rest } = options
  const headers = new Headers(initHeaders)
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData

  if (body !== undefined && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (auth) {
    const token = getAuthToken()
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  }

  let requestBody: BodyInit | undefined
  if (body === undefined) {
    requestBody = undefined
  } else if (isFormData) {
    requestBody = body as FormData
  } else {
    requestBody = JSON.stringify(body)
  }

  const response = await fetch(`/api${path}`, {
    ...rest,
    headers,
    body: requestBody,
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
    throw new ApiError(
      response.status,
      detailFromPayload(data, response.statusText || 'Request failed'),
    )
  }

  return data as T
}

export async function apiFetchBlob(
  path: string,
  options: Omit<ApiFetchOptions, 'body'> = {},
): Promise<Blob> {
  const { auth = true, headers: initHeaders, ...rest } = options
  const headers = new Headers(initHeaders)

  if (auth) {
    const token = getAuthToken()
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  }

  const response = await fetch(`/api${path}`, {
    ...rest,
    headers,
  })

  if (!response.ok) {
    const text = await response.text()
    let data: unknown = null
    if (text) {
      try {
        data = JSON.parse(text) as unknown
      } catch {
        data = text
      }
    }
    throw new ApiError(
      response.status,
      detailFromPayload(data, response.statusText || 'Request failed'),
    )
  }

  return response.blob()
}
