import { apiFetch, setAuthToken } from './client'

export type AuthUser = {
  id: number
  login: string
  role: 'client' | 'manager' | string
  display_name: string
  company_inn: string | null
  company_name: string | null
}

export type LoginResult = {
  token: string
  role: string
  display_name: string
  company_name: string | null
  company_inn: string | null
}

export async function loginRequest(
  login: string,
  password: string,
): Promise<LoginResult> {
  const result = await apiFetch<LoginResult>('/auth/login', {
    method: 'POST',
    body: { login, password },
    auth: false,
  })
  setAuthToken(result.token)
  return result
}

export async function logoutRequest(): Promise<void> {
  try {
    await apiFetch<void>('/auth/logout', { method: 'POST' })
  } finally {
    setAuthToken(null)
  }
}

export async function meRequest(): Promise<AuthUser> {
  return apiFetch<AuthUser>('/auth/me')
}

export const DEMO_ACCOUNTS = [
  { login: 'client1', label: 'client1 — ООО «Стабильный поток»', role: 'client' },
  { login: 'client2', label: 'client2 — ООО «Большой запрос»', role: 'client' },
  { login: 'client3', label: 'client3 — ООО «Средний риск»', role: 'client' },
  { login: 'client4', label: 'client4 — ООО «Не действует»', role: 'client' },
  { login: 'client5', label: 'client5 — ООО «БКИ пауза»', role: 'client' },
  { login: 'manager', label: 'manager — менеджер', role: 'manager' },
] as const

export const DEMO_CLIENT_ACCOUNTS = DEMO_ACCOUNTS.filter(
  (account) => account.role === 'client',
)

export const DEMO_PASSWORD = 'demo'

export const LAST_CLIENT_LOGIN_KEY = 'alfa_last_client_login'

export function rememberClientLogin(login: string): void {
  localStorage.setItem(LAST_CLIENT_LOGIN_KEY, login)
}

export function getLastClientLogin(): string {
  return localStorage.getItem(LAST_CLIENT_LOGIN_KEY) || 'client1'
}
