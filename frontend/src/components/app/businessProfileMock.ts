export const activityOptions = [
  'Производство продуктов питания',
  'Розничная торговля',
  'Оптовые поставки',
  'Услуги для бизнеса',
  'IT и цифровые сервисы',
] as const

export type ActivityOption = (typeof activityOptions)[number]

export type DemoDocument = {
  id: string
  name: string
  category: string
}
