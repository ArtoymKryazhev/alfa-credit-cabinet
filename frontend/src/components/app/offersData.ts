import bannerAlfaStart from '../../assets/app/banner-alfa-start.png'
import bannerAutoLoan from '../../assets/app/banner-auto-loan.png'
import bannerBankGuarantee from '../../assets/app/banner-bank-guarantee.png'
import bannerBusinessDev from '../../assets/app/banner-business-dev.png'
import bannerBusinessLoan from '../../assets/app/banner-business-loan.png'
import bannerBusinessMortgage from '../../assets/app/banner-business-mortgage.png'
import bannerCreditCard from '../../assets/app/banner-credit-card.png'
import bannerFactoring from '../../assets/app/banner-factoring.png'
import bannerGovProgram from '../../assets/app/banner-gov-program.png'
import bannerLeasing from '../../assets/app/banner-leasing.png'
import bannerOverdraft from '../../assets/app/banner-overdraft.png'
import bannerRefinance from '../../assets/app/banner-refinance.png'
import bannerRevolvingLine from '../../assets/app/banner-revolving-line.png'

export type OfferBadge = {
  label: string
  tone: 'green' | 'orange'
}

export type Offer = {
  id: string
  title: string
  terms: string[]
  description: string
  image: string
  badge?: OfferBadge
}

export const offers: Offer[] = [
  {
    id: 'bank-guarantee',
    title: 'Банковская гарантия',
    terms: ['До 300 млн ₽', 'До 10 лет'],
    description:
      'Гарантии для коммерческих и государственных закупок по 44-ФЗ, 223-ФЗ и 185-ФЗ',
    image: bannerBankGuarantee,
  },
  {
    id: 'factoring',
    title: 'Факторинг',
    terms: ['До 150 млн ₽', 'Без залога'],
    description: 'Финансирование дебиторской задолженности',
    image: bannerFactoring,
  },
  {
    id: 'revolving-line',
    title: 'Возобновляемая кредитная линия',
    terms: ['От 14,5%', 'До 50 млн ₽', 'Без залога', 'Онлайн с ЭП'],
    description:
      'Возможность брать транши на любые суммы в пределах лимита. При погашении транша лимит восстанавливается',
    image: bannerRevolvingLine,
  },
  {
    id: 'alfa-start-fast',
    title: 'Альфа-Старт: быстрый кредит для бизнеса',
    terms: ['До 1 млн ₽', '18 месяцев', 'Без залога'],
    description: 'Без финансовых документов',
    image: bannerAlfaStart,
    badge: { label: 'ОДОБРЕНО', tone: 'green' },
  },
  {
    id: 'business-dev',
    title: 'Деньги на развитие бизнеса',
    terms: ['До 150 млн ₽', 'Любые бизнес-цели'],
    description: 'Получите для вашего дела нужную сумму сразу',
    image: bannerBusinessDev,
  },
  {
    id: 'business-mortgage',
    title: 'Бизнес-ипотека',
    terms: ['до 150 млн ₽', '10 лет', 'Недвижимость в залог'],
    description: 'Покупка жилой или коммерческой недвижимости с аккредитивом',
    image: bannerBusinessMortgage,
  },
  {
    id: 'leasing',
    title: 'Лизинг',
    terms: ['До 500 млн ₽', 'Без залога'],
    description: 'Обновите свой парк техники выгодно',
    image: bannerLeasing,
  },
  {
    id: 'overdraft',
    title: 'Овердрафт',
    terms: ['От 13%', 'До 20 млн ₽', 'Без залога', 'Онлайн с ЭП'],
    description:
      'Возможность уходить в минус по счёту и пользоваться деньгами банка, когда нужно',
    image: bannerOverdraft,
  },
  {
    id: 'business-loan',
    title: 'Кредит для бизнеса',
    terms: ['До 30 млн ₽', 'От 14%', 'Без залога', 'Онлайн с ЭП'],
    description:
      'Кредит одной суммой на пополнение оборотных средств и инвестиционные цели',
    image: bannerBusinessLoan,
  },
  {
    id: 'gov-program',
    title: 'Кредит без залога по госпрограмме',
    terms: ['До 30 млн ₽', 'До 36 мес', 'Онлайн с ЭП'],
    description:
      'Поручительство Корпорации МСП — бесплатно для клиента. Ставка снижена. Любые бизнес-цели. Узнайте, подходит ли вам программа',
    image: bannerGovProgram,
  },
  {
    id: 'auto-loan',
    title: 'Автокредит для бизнеса',
    terms: ['До 50 млн ₽', 'До 120 месяцев'],
    description: 'Под залог приобретаемого транспорта и спецтехники',
    image: bannerAutoLoan,
  },
  {
    id: 'refinance',
    title: 'Снизьте платёж по кредиту для бизнеса',
    terms: ['Ставка от 14%', 'До 150 млн ₽', 'До 10 лет'],
    description:
      'Переведите кредит в Альфа-Банк и платите меньше каждый месяц. Можно объединить кредиты из разных банков и управлять выплатами в одном банке',
    image: bannerRefinance,
  },
  {
    id: 'credit-card',
    title: 'Кредитная карта с тарифом Выгодный',
    terms: ['До 1 млн ₽', 'Без залога', 'Оформление онлайн'],
    description: 'До 120 дней без % и кэшбэк до 10% на выбранные категории',
    image: bannerCreditCard,
    badge: { label: 'РЕКОМЕНДУЕМ', tone: 'green' },
  },
  {
    id: 'alfa-start',
    title: 'Альфа-Старт',
    terms: ['До 1 млн ₽', 'До 18 мес', 'Без залога', 'С 1 дня регистрации'],
    description: 'Быстрый кредит для бизнеса',
    image: bannerAlfaStart,
  },
  {
    id: 'credit-card-alt',
    title: 'Кредитная карта с тарифом Выгодный',
    terms: ['90 тыс ₽', '240 мес.', 'Без залога', 'Онлайн оформление'],
    description: 'До 120 дней без % и кэшбэк до 10% на выбранные категории',
    image: bannerCreditCard,
    badge: { label: 'ОДОБРЕНО', tone: 'orange' },
  },
]
