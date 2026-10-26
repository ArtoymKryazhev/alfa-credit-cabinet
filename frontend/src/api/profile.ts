/** Business profile + registry lookup API. */

import { apiFetch } from './client'

export type Completeness = 'empty' | 'partial' | 'filled'

export type BusinessProfile = {
  completeness: Completeness
  inn: string | null
  company_name: string | null
  registration_date: string | null
  address: string | null
  activities: string | null
  region: string | null
  industry: string | null
  company_status: string | null
  registry_source: string | null
  registry_as_of: string | null
  activity_direction: string | null
  description: string | null
  contact_person: string | null
  contact_phone: string | null
  contact_email: string | null
}

export type RegistryCompany = {
  inn: string
  name: string
  ogrn: string | null
  registration_date: string
  address: string
  activities: string
  region: string | null
  industry: string | null
  status: string
  source: string
  as_of: string
}

export type ProfileUpdatePayload = {
  inn: string
  activity_direction?: string | null
  description?: string | null
  contact_person?: string | null
  contact_phone?: string | null
  contact_email?: string | null
}

export function getProfile(): Promise<BusinessProfile> {
  return apiFetch<BusinessProfile>('/profile')
}

export function lookupRegistry(inn: string): Promise<RegistryCompany> {
  return apiFetch<RegistryCompany>('/profile/registry-lookup', {
    method: 'POST',
    body: { inn },
  })
}

export function saveProfile(
  payload: ProfileUpdatePayload,
): Promise<BusinessProfile> {
  return apiFetch<BusinessProfile>('/profile', {
    method: 'PUT',
    body: payload,
  })
}
