/** Manager applications API: queue, detail, approve, decline, clarifications. */

import { apiFetch } from './client'
import type { Application, ApplicationStatus, DraftStep } from './applications'

export type ManagerApplicationListItem = {
  id: string
  product_code: string
  product_name: string
  status: ApplicationStatus
  current_step: DraftStep
  amount: number | null
  term_months: number | null
  purpose: string | null
  company_name: string | null
  client_display_name: string
  created_at: string
  updated_at: string
  submitted_at: string | null
}

export type ManagerApplication = Application & {
  client_user_id: number
  client_display_name: string
  company_name: string | null
  company_inn: string | null
}

export function listManagerApplications(
  attention = true,
): Promise<ManagerApplicationListItem[]> {
  const query = attention ? '?attention=true' : '?attention=false'
  return apiFetch<ManagerApplicationListItem[]>(`/manager/applications${query}`)
}

export function getManagerApplication(id: string): Promise<ManagerApplication> {
  return apiFetch<ManagerApplication>(`/manager/applications/${id}`)
}

export function approveApplication(id: string): Promise<ManagerApplication> {
  return apiFetch<ManagerApplication>(`/manager/applications/${id}/approve`, {
    method: 'POST',
  })
}

export function declineApplication(
  id: string,
  reason: string,
): Promise<ManagerApplication> {
  return apiFetch<ManagerApplication>(`/manager/applications/${id}/decline`, {
    method: 'POST',
    body: { reason },
  })
}

export function requestClarification(
  id: string,
  question: string,
): Promise<ManagerApplication> {
  return apiFetch<ManagerApplication>(
    `/manager/applications/${id}/request-clarification`,
    {
      method: 'POST',
      body: { question },
    },
  )
}

export function offerReducedApplication(
  id: string,
  amount: number,
  termMonths?: number | null,
): Promise<ManagerApplication> {
  return apiFetch<ManagerApplication>(
    `/manager/applications/${id}/offer-reduced`,
    {
      method: 'POST',
      body: {
        amount,
        ...(termMonths != null ? { term_months: termMonths } : {}),
      },
    },
  )
}

export function recheckApplication(id: string): Promise<ManagerApplication> {
  return apiFetch<ManagerApplication>(`/manager/applications/${id}/recheck`, {
    method: 'POST',
  })
}
