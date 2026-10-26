import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  acceptOffer,
  declineOffer,
  type Application,
} from '../../api/applications'
import { ApiError } from '../../api/client'
import {
  formatDateTime,
  formatMoney,
  nextStepHint,
  purposeLabel,
  STATUS_BADGE_CLASS,
  STATUS_LABELS,
} from './applicationLabels'
import { ApplicationAssessmentPanel } from './ApplicationAssessmentPanel'
import { ClarificationsPanel } from './ClarificationsPanel'
import { primaryBtn, secondaryBtn, surfaceCard } from './uiClasses'

function actorLabel(role: string | null | undefined): string {
  if (role === 'manager') return 'Менеджер'
  if (role === 'client') return 'Клиент'
  if (role === 'system') return 'Система'
  return 'Система'
}

type ApplicationStatusCardProps = {
  application: Application
  onUpdated?: (application: Application) => void
}

export function ApplicationStatusCard({
  application,
  onUpdated,
}: ApplicationStatusCardProps) {
  const snapshotName =
    application.snapshot?.company_name ?? application.snapshot?.inn ?? '—'
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleAccept() {
    if (!application.active_offer) return
    setBusy(true)
    setActionError(null)
    try {
      const updated = await acceptOffer(
        application.id,
        application.active_offer.id,
      )
      onUpdated?.(updated)
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : 'Не удалось принять предложение',
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleDecline() {
    if (!application.active_offer) return
    setBusy(true)
    setActionError(null)
    try {
      const updated = await declineOffer(
        application.id,
        application.active_offer.id,
      )
      onUpdated?.(updated)
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? err.message
          : 'Не удалось отклонить предложение',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="relative z-10 mx-auto w-[1140px] max-w-full pb-16 pt-[66px]">
      <h1 className="m-0 text-center text-[40px] font-bold leading-[48px] tracking-[0.1px] text-[rgba(3,3,6,0.88)]">
        Заявка
      </h1>
      <p className="mx-auto mt-3 mb-0 max-w-[640px] text-center text-[16px] leading-6 tracking-[-0.24px] text-[rgba(3,3,6,0.62)]">
        {application.product.name}
      </p>

      <div className="mx-auto mt-12 flex w-full max-w-[720px] flex-col gap-4">
        <div className={`${surfaceCard} px-8 py-6`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <p className="m-0 text-[22px] font-bold leading-[26px] text-[rgba(3,3,6,0.88)]">
                Статус
              </p>
              <span
                className={`rounded-full px-3 py-1 text-[13px] font-medium ${STATUS_BADGE_CLASS[application.status]}`}
              >
                {STATUS_LABELS[application.status]}
              </span>
            </div>
            <span className="text-[13px] text-[rgba(3,3,6,0.55)]">
              ID {application.id.slice(0, 8)}…
            </span>
          </div>
          <p className="mt-3 m-0 text-[16px] leading-6 text-[rgba(3,3,6,0.62)]">
            {nextStepHint(application.status)}
          </p>
        </div>

        <article className={`${surfaceCard} px-8 py-8`}>
          <h2 className="m-0 text-[18px] font-bold leading-6 text-[rgba(3,3,6,0.88)]">
            Параметры
          </h2>
          <dl className="mt-5 m-0 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="m-0 text-[13px] text-[rgba(3,3,6,0.55)]">Компания</dt>
              <dd className="mt-1 m-0 text-[15px] text-[rgba(3,3,6,0.88)]">
                {snapshotName}
              </dd>
            </div>
            <div>
              <dt className="m-0 text-[13px] text-[rgba(3,3,6,0.55)]">Сумма</dt>
              <dd className="mt-1 m-0 text-[15px] text-[rgba(3,3,6,0.88)]">
                {formatMoney(application.amount)}
              </dd>
            </div>
            <div>
              <dt className="m-0 text-[13px] text-[rgba(3,3,6,0.55)]">Срок</dt>
              <dd className="mt-1 m-0 text-[15px] text-[rgba(3,3,6,0.88)]">
                {application.term_months != null
                  ? `${application.term_months} мес.`
                  : '—'}
              </dd>
            </div>
            <div>
              <dt className="m-0 text-[13px] text-[rgba(3,3,6,0.55)]">Назначение</dt>
              <dd className="mt-1 m-0 text-[15px] text-[rgba(3,3,6,0.88)]">
                {purposeLabel(application.purpose)}
              </dd>
            </div>
            <div>
              <dt className="m-0 text-[13px] text-[rgba(3,3,6,0.55)]">Отправлена</dt>
              <dd className="mt-1 m-0 text-[15px] text-[rgba(3,3,6,0.88)]">
                {formatDateTime(application.submitted_at)}
              </dd>
            </div>
            {application.estimated_payment != null ? (
              <div>
                <dt className="m-0 text-[13px] text-[rgba(3,3,6,0.55)]">
                  Ориентировочный платёж
                </dt>
                <dd className="mt-1 m-0 text-[15px] text-[rgba(3,3,6,0.88)]">
                  {formatMoney(application.estimated_payment)} / мес.
                </dd>
              </div>
            ) : null}
          </dl>
        </article>

        <ApplicationAssessmentPanel application={application} />

        <ClarificationsPanel
          application={application}
          allowAnswer
          onUpdated={onUpdated}
        />

        {application.active_offer ? (
          <article className={`${surfaceCard} px-8 py-8`}>
            <h2 className="m-0 text-[18px] font-bold leading-6 text-[rgba(3,3,6,0.88)]">
              Предложение банка
            </h2>
            {application.active_offer.version > 1 ||
            application.decision?.reason_codes.includes(
              'manager_reduced_offer',
            ) ? (
              <p className="mt-2 m-0 text-[14px] text-[rgba(3,3,6,0.62)]">
                Сниженное предложение
              </p>
            ) : null}
            <dl className="mt-5 m-0 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="m-0 text-[13px] text-[rgba(3,3,6,0.55)]">Сумма</dt>
                <dd className="mt-1 m-0 text-[15px] text-[rgba(3,3,6,0.88)]">
                  {formatMoney(application.active_offer.amount)}
                </dd>
              </div>
              <div>
                <dt className="m-0 text-[13px] text-[rgba(3,3,6,0.55)]">Срок</dt>
                <dd className="mt-1 m-0 text-[15px] text-[rgba(3,3,6,0.88)]">
                  {application.active_offer.term_months} мес.
                </dd>
              </div>
              <div>
                <dt className="m-0 text-[13px] text-[rgba(3,3,6,0.55)]">Ставка</dt>
                <dd className="mt-1 m-0 text-[15px] text-[rgba(3,3,6,0.88)]">
                  {(application.active_offer.rate * 100).toFixed(0)} % годовых
                </dd>
              </div>
              <div>
                <dt className="m-0 text-[13px] text-[rgba(3,3,6,0.55)]">Платёж</dt>
                <dd className="mt-1 m-0 text-[15px] text-[rgba(3,3,6,0.88)]">
                  {formatMoney(application.active_offer.payment)} / мес.
                </dd>
              </div>
            </dl>

            {application.status === 'offer_ready' ? (
              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={`${primaryBtn} flex-none min-w-[160px]`}
                  disabled={busy}
                  onClick={() => void handleAccept()}
                >
                  Принять
                </button>
                <button
                  type="button"
                  className={`${secondaryBtn} flex-none min-w-[160px]`}
                  disabled={busy}
                  onClick={() => void handleDecline()}
                >
                  Отклонить
                </button>
              </div>
            ) : null}

            {actionError ? (
              <p className="mt-4 m-0 text-[14px] text-[#ef3124]">{actionError}</p>
            ) : null}
          </article>
        ) : null}

        {application.status === 'declined' && application.decision?.comment ? (
          <article className={`${surfaceCard} px-8 py-8`}>
            <h2 className="m-0 text-[18px] font-bold leading-6 text-[rgba(3,3,6,0.88)]">
              Причина отказа
            </h2>
            <p className="mt-4 m-0 text-[15px] leading-6 text-[rgba(3,3,6,0.88)]">
              {application.decision.comment}
            </p>
          </article>
        ) : null}

        <article className={`${surfaceCard} px-8 py-8`}>
          <h2 className="m-0 text-[18px] font-bold leading-6 text-[rgba(3,3,6,0.88)]">
            История
          </h2>
          <ul className="mt-5 m-0 flex list-none flex-col gap-3 p-0">
            {application.events.length === 0 ? (
              <li className="text-[14px] text-[rgba(3,3,6,0.55)]">Событий пока нет</li>
            ) : (
              application.events.map((event) => (
                <li
                  key={event.id}
                  className="rounded-[12px] bg-[rgba(38,55,88,0.04)] px-4 py-3"
                >
                  <p className="m-0 text-[14px] font-medium text-[rgba(3,3,6,0.88)]">
                    {event.message ||
                      STATUS_LABELS[
                        event.to_status as keyof typeof STATUS_LABELS
                      ] ||
                      event.to_status}
                  </p>
                  <p className="mt-1 m-0 text-[12px] text-[rgba(3,3,6,0.55)]">
                    {actorLabel(event.actor_role)}
                    {' · '}
                    {formatDateTime(event.created_at)}
                    {event.from_status
                      ? ` · ${event.from_status} → ${event.to_status}`
                      : ` · ${event.to_status}`}
                  </p>
                </li>
              ))
            )}
          </ul>
        </article>

        <div className="flex justify-center pt-2">
          <Link
            to="/app/applications"
            className={`${primaryBtn} inline-flex w-full max-w-[280px] flex-none no-underline`}
          >
            К списку заявок
          </Link>
        </div>
      </div>
    </section>
  )
}
