/** Personalized news feed API. */

import { apiFetch } from './client'

export type NewsItem = {
  id: string
  title: string
  summary: string
  published_at: string
  industries: string[]
  regions: string[]
  source: string
  as_of: string
}

export type NewsFeed = {
  personalized: boolean
  industry: string | null
  region: string | null
  items: NewsItem[]
}

export function getNews(): Promise<NewsFeed> {
  return apiFetch<NewsFeed>('/news')
}
