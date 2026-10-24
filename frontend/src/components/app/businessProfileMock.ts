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

export const businessProfileMock = {
  companyName: 'ООО «Пример»',
  inn: 'XXXXXXXXXX',
  registrationDate: '15.03.2019',
  address: 'г. Пример, ул. Демонстрационная, д. 1',
  activities: 'Производство хлебобулочных изделий; розничная торговля',
  activityDirection: 'Производство продуктов питания' as ActivityOption,
  description:
    'Производим выпечку, продаём в собственной пекарне и поставляем в кофейни',
  contactPerson: 'Иван Демонстрационный',
  phone: '+7 (900) 000-00-00',
  email: 'demo@example.com',
  documents: [
    {
      id: 'doc-presentation',
      name: 'presentation-demo.pdf',
      category: 'Презентация компании',
    },
    {
      id: 'doc-about',
      name: 'about-demo.pdf',
      category: 'Описание бизнеса',
    },
  ] satisfies DemoDocument[],
}

export const partialFormDefaults = {
  activityDirection: 'Производство продуктов питания' as ActivityOption | '',
  description:
    'Производим выпечку, продаём в собственной пекарне и поставляем в кофейни',
  contactPerson: '',
  phone: '',
  email: '',
}
