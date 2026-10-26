/** Client applications API: draft, list, get, patch, submit, offer, answer. */

import { apiFetch, apiFetchBlob } from './client'
import type { BusinessProfile } from './profile'

export type DraftStep = 'business' | 'params' | 'review'
export type Purpose = string
export type ApplicationStatus =
  | 'draft'
  | 'manual_review'
  | 'clarification_requested'
  | 'offer_ready'
  | 'offer_accepted'
  | 'offer_declined'
  | 'declined'

export type ActorRole = 'client' | 'manager' | 'system'
export type RiskLevel = 'low' | 'medium' | 'high'
export type FactorValue = 'good' | 'medium' | 'bad' | 'unknown'

export type ApplicationEvent = {
  id: number
  actor_user_id: number
  actor_role: ActorRole | null
  from_status: string | null
  to_status: string
  message: string
  created_at: string
}

export type Offer = {
  id: string
  application_id: string
  amount: number
  term_months: number
  rate: number
  payment: number
  version: number
  active: boolean
  created_by: number
  created_at: string
}

export type Decision = {
  id: number
  application_id: string
  outcome: 'offer' | 'declined' | 'manual_review'
  reason_codes: string[]
  comment: string | null
  alternative_amount: number | null
  created_by: number
  created_at: string
}

export type RiskFactor = {
  value: FactorValue
  explanation: string
  metrics?: Record<string, unknown> | null
}

export type RiskAssessment = {
  id: number
  level: RiskLevel
  factors: Record<string, RiskFactor>
  data_complete: boolean
  created_at: string
}

export type CheckSource = {
  status: 'ok' | 'unavailable' | 'missing'
  source?: string
  as_of?: string
  reason?: string
  data?: Record<string, unknown>
}

export type CheckRun = {
  id: number
  attempt: number
  sources: Record<string, CheckSource>
  data_complete: boolean
  created_at: string
}

export type ApplicationDraftPayload = {
  amount?: number
  term_months?: number
  purpose?: Purpose | string
  comment?: string
}

export type AttachmentMeta = {
  id: string
  application_id: string
  filename: string
  mime: string
  size: number
  uploaded_by: number
  created_at: string
}

export type Clarification = {
  id: number
  application_id: string
  question: string
  status: 'open' | 'answered'
  answer_text: string | null
  attachment: AttachmentMeta | null
  created_by: number
  created_at: string
  answered_at: string | null
}

export type ProductInfo = {
  code: string
  name: string
  amount_min: number
  amount_max: number
  term_min: number
  term_max: number
  rate_annual: number
  alternative_step: number
  purposes: string[]
}

export type Application = {
  id: string
  product_code: string
  product: ProductInfo
  status: ApplicationStatus
  current_step: DraftStep
  draft_payload: ApplicationDraftPayload
  snapshot: BusinessProfile | null
  amount: number | null
  term_months: number | null
  purpose: string | null
  estimated_payment: number | null
  active_offer: Offer | null
  decision: Decision | null
  checks: CheckRun | null
  risk: RiskAssessment | null
  clarifications: Clarification[]
  created_at: string
  updated_at: string
  submitted_at: string | null
  events: ApplicationEvent[]
}

export type ApplicationListItem = {
  id: string
  product_code: string
  product_name: string
  status: ApplicationStatus
  current_step: DraftStep
  amount: number | null
  term_months: number | null
  purpose: string | null
  created_at: string
  updated_at: string
  submitted_at: string | null
}

export type ApplicationPatchPayload = {
  current_step?: DraftStep
  amount?: number
  term_months?: number
  purpose?: Purpose
  comment?: string
}

export function openApplication(productCode: string): Promise<Application> {
  return apiFetch<Application>('/applications', {
    method: 'POST',
    body: { product_code: productCode },
  })
}

export function listApplications(): Promise<ApplicationListItem[]> {
  return apiFetch<ApplicationListItem[]>('/applications')
}

export function getApplication(id: string): Promise<Application> {
  return apiFetch<Application>(`/applications/${id}`)
}

export function patchApplication(
  id: string,
  payload: ApplicationPatchPayload,
): Promise<Application> {
  return apiFetch<Application>(`/applications/${id}`, {
    method: 'PATCH',
    body: payload,
  })
}

export function submitApplication(id: string): Promise<Application> {
  return apiFetch<Application>(`/applications/${id}/submit`, {
    method: 'POST',
  })
}

export function acceptOffer(id: string, offerId: string): Promise<Application> {
  return apiFetch<Application>(`/applications/${id}/offer/accept`, {
    method: 'POST',
    body: { offer_id: offerId },
  })
}

export function declineOffer(id: string, offerId: string): Promise<Application> {
  return apiFetch<Application>(`/applications/${id}/offer/decline`, {
    method: 'POST',
    body: { offer_id: offerId },
  })
}

export function answerClarification(
  id: string,
  answerText: string,
  file?: File | null,
): Promise<Application> {
  const form = new FormData()
  form.append('answer_text', answerText)
  if (file) {
    form.append('file', file)
  }
  return apiFetch<Application>(`/applications/${id}/answer`, {
    method: 'POST',
    body: form,
  })
}

export async function downloadAttachment(
  attachment: AttachmentMeta,
): Promise<void> {
  const blob = await apiFetchBlob(`/attachments/${attachment.id}`)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = attachment.filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
