import type {
  ApplicationStatus,
  FactorValue,
  RiskLevel,
} from '../../api/applications'

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: 'Черновик',
  manual_review: 'На рассмотрении',
  clarification_requested: 'Нужны уточнения',
  offer_ready: 'Предложение готово',
  offer_accepted: 'Условия приняты',
  offer_declined: 'Отказ от предложения',
  declined: 'Отказ банка',
}

/** Soft pastel badge classes for client application statuses. */
export const STATUS_BADGE_CLASS: Record<ApplicationStatus, string> = {
  draft: 'bg-[rgba(38,55,88,0.10)] text-[rgba(38,55,88,0.78)]',
  manual_review: 'bg-[rgba(196,146,42,0.14)] text-[rgba(120,88,20,0.88)]',
  clarification_requested: 'bg-[rgba(200,110,40,0.14)] text-[rgba(130,70,20,0.88)]',
  offer_ready: 'bg-[rgba(40,140,90,0.12)] text-[rgba(30,100,65,0.88)]',
  offer_accepted: 'bg-[rgba(40,140,90,0.18)] text-[rgba(25,90,55,0.90)]',
  offer_declined: 'bg-[rgba(160,70,70,0.10)] text-[rgba(120,50,50,0.82)]',
  declined: 'bg-[rgba(160,70,70,0.10)] text-[rgba(120,50,50,0.82)]',
}

export const PURPOSE_LABELS: Record<string, string> = {
  goods: 'Закупка товаров',
  materials: 'Закупка материалов',
  opex: 'Текущие расходы',
  equipment: 'Оборудование',
  vehicles: 'Транспорт и спецтехника',
  real_estate: 'Недвижимость',
  refinancing: 'Рефинансирование',
  tender_guarantee: 'Обеспечение заявки / контракта',
  receivables: 'Финансирование дебиторской задолженности',
  business_development: 'Развитие бизнеса',
}

export function purposeLabel(purpose: string | null | undefined): string {
  if (!purpose) return '—'
  return PURPOSE_LABELS[purpose] ?? purpose
}

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
}

export const FACTOR_VALUE_LABELS: Record<FactorValue, string> = {
  good: 'Хорошо',
  medium: 'Средне',
  bad: 'Плохо',
  unknown: 'Неизвестно',
}

export const FACTOR_NAME_LABELS: Record<string, string> = {
  payment_discipline: 'Платёжная дисциплина',
  financial_stability: 'Финансовая устойчивость',
  current_load: 'Текущая нагрузка',
  new_request: 'Новый запрос',
}

export const SOURCE_NAME_LABELS: Record<string, string> = {
  registry: 'Реестр компаний',
  finance: 'Финансовый профиль',
  bki: 'БКИ',
  product: 'Продукт',
}

export const REASON_CODE_LABELS: Record<string, string> = {
  auto_approve: 'Автоматическое одобрение',
  company_inactive: 'Компания не действует',
  overdue_over_60: 'Просрочка более 60 дней',
  source_unavailable: 'Источник данных недоступен',
  data_incomplete: 'Недостаточно данных',
  coverage_insufficient: 'Недостаточное покрытие платежа',
  alternative_amount: 'Есть альтернативная сумма',
  risk_medium: 'Средний риск',
  risk_high: 'Высокий риск',
  manager_approve: 'Одобрение менеджера',
  manager_decline: 'Отказ менеджера',
  manager_reduced_offer: 'Сниженное предложение менеджера',
}

export function formatMoney(value: number | null | undefined): string {
  if (value == null) return '—'
  return `${value.toLocaleString('ru-RU')} ₽`
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function nextStepHint(status: ApplicationStatus): string {
  switch (status) {
    case 'draft':
      return 'Продолжите заполнение и отправьте заявку'
    case 'manual_review':
      return 'Заявку проверяет менеджер'
    case 'clarification_requested':
      return 'Ответьте на уточнение менеджера'
    case 'offer_ready':
      return 'Ознакомьтесь с предложением и примите или отклоните условия'
    case 'offer_accepted':
      return 'Демонстрационный сценарий завершён'
    case 'offer_declined':
      return 'Вы отказались от предложения'
    case 'declined':
      return 'Банк отклонил заявку'
    default:
      return ''
  }
}

/** Annuity payment for UI preview (19% annual). */
export function estimateAnnuityPayment(
  amount: number,
  termMonths: number,
  annualRate = 0.19,
): number {
  if (amount <= 0 || termMonths <= 0) return 0
  const monthlyRate = annualRate / 12
  if (monthlyRate === 0) return Math.round(amount / termMonths)
  const factor = (1 + monthlyRate) ** termMonths
  return Math.round((amount * monthlyRate * factor) / (factor - 1))
}
