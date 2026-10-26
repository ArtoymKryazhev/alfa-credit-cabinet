import type { Application } from '../../api/applications'
import {
  FACTOR_NAME_LABELS,
  FACTOR_VALUE_LABELS,
  REASON_CODE_LABELS,
  RISK_LEVEL_LABELS,
  SOURCE_NAME_LABELS,
  formatMoney,
} from './applicationLabels'
import { surfaceCard } from './uiClasses'

type ApplicationAssessmentPanelProps = {
  application: Application
}

const FACTOR_ORDER = [
  'payment_discipline',
  'financial_stability',
  'current_load',
  'new_request',
] as const

const SOURCE_ORDER = ['registry', 'finance', 'bki', 'product'] as const

function sourceStatusLabel(status: string): string {
  if (status === 'ok') return 'Ок'
  if (status === 'unavailable') return 'Недоступен'
  if (status === 'missing') return 'Нет данных'
  return status
}

export function ApplicationAssessmentPanel({
  application,
}: ApplicationAssessmentPanelProps) {
  const { risk, checks, decision } = application
  if (!risk && !checks && !decision) return null

  return (
    <article className={`${surfaceCard} px-8 py-8`}>
      <h2 className="m-0 text-[18px] font-bold leading-6 text-[rgba(3,3,6,0.88)]">
        Оценка и решение
      </h2>
      <p className="mt-2 m-0 text-[14px] leading-5 text-[rgba(3,3,6,0.55)]">
        Скоринг и кредитное решение разделены: сначала факторы риска, затем
        правила.
      </p>

      {risk ? (
        <div className="mt-6">
          <div className="flex flex-wrap items-center gap-3">
            <p className="m-0 text-[15px] font-medium text-[rgba(3,3,6,0.88)]">
              Уровень риска:{' '}
              <span className="font-bold">
                {RISK_LEVEL_LABELS[risk.level] ?? risk.level}
              </span>
            </p>
            <span className="rounded-full bg-[rgba(38,55,88,0.08)] px-3 py-1 text-[12px] text-[rgba(3,3,6,0.62)]">
              {risk.data_complete ? 'Данные полные' : 'Данные неполные'}
            </span>
          </div>

          <ul className="mt-4 m-0 flex list-none flex-col gap-3 p-0">
            {FACTOR_ORDER.map((key) => {
              const factor = risk.factors[key]
              if (!factor) return null
              return (
                <li
                  key={key}
                  className="rounded-[12px] bg-[rgba(38,55,88,0.04)] px-4 py-3"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="m-0 text-[14px] font-medium text-[rgba(3,3,6,0.88)]">
                      {FACTOR_NAME_LABELS[key] ?? key}
                    </p>
                    <span className="text-[13px] text-[rgba(3,3,6,0.62)]">
                      {FACTOR_VALUE_LABELS[factor.value] ?? factor.value}
                    </span>
                  </div>
                  <p className="mt-1 m-0 text-[13px] leading-5 text-[rgba(3,3,6,0.55)]">
                    {factor.explanation}
                  </p>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}

      {checks ? (
        <div className="mt-6">
          <p className="m-0 text-[15px] font-medium text-[rgba(3,3,6,0.88)]">
            Источники (попытка {checks.attempt})
          </p>
          <ul className="mt-3 m-0 flex list-none flex-col gap-2 p-0">
            {SOURCE_ORDER.map((key) => {
              const source = checks.sources[key]
              if (!source) return null
              return (
                <li
                  key={key}
                  className="flex flex-wrap items-baseline justify-between gap-2 text-[13px]"
                >
                  <span className="text-[rgba(3,3,6,0.88)]">
                    {SOURCE_NAME_LABELS[key] ?? key}
                    {source.source ? ` · ${source.source}` : ''}
                  </span>
                  <span className="text-[rgba(3,3,6,0.55)]">
                    {sourceStatusLabel(source.status)}
                    {source.as_of ? ` · срез ${source.as_of}` : ''}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}

      {decision ? (
        <div className="mt-6 border-t border-[rgba(38,55,88,0.08)] pt-5">
          <p className="m-0 text-[15px] font-medium text-[rgba(3,3,6,0.88)]">
            Решение системы
          </p>
          {decision.comment ? (
            <p className="mt-2 m-0 text-[14px] leading-5 text-[rgba(3,3,6,0.62)]">
              {decision.comment}
            </p>
          ) : null}
          {decision.reason_codes.length > 0 ? (
            <ul className="mt-3 m-0 flex list-none flex-wrap gap-2 p-0">
              {decision.reason_codes.map((code) => (
                <li
                  key={code}
                  className="rounded-full bg-[rgba(38,55,88,0.08)] px-3 py-1 text-[12px] text-[rgba(3,3,6,0.62)]"
                >
                  {REASON_CODE_LABELS[code] ?? code}
                </li>
              ))}
            </ul>
          ) : null}
          {decision.alternative_amount != null ? (
            <p className="mt-3 m-0 text-[14px] font-medium text-[rgba(3,3,6,0.88)]">
              Расчётная альтернатива:{' '}
              {formatMoney(decision.alternative_amount)}
            </p>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}
