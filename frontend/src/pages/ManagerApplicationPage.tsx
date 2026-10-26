import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import {
  approveApplication,
  declineApplication,
  getManagerApplication,
  offerReducedApplication,
  recheckApplication,
  requestClarification,
  type ManagerApplication,
} from '../api/manager'
import { useAuth } from '../auth/AuthContext'
import {
  formatDateTime,
  formatMoney,
  purposeLabel,
  STATUS_LABELS,
} from '../components/app/applicationLabels'
import { ApplicationAssessmentPanel } from '../components/app/ApplicationAssessmentPanel'
import { ClarificationsPanel } from '../components/app/ClarificationsPanel'
import {
  primaryBtn,
  secondaryBtn,
  surfaceCard,
  textareaClass,
  fieldWrapClass,
  labelClass,
  fieldClass,
} from '../components/app/uiClasses'
import { ManagerHeader } from '../components/manager/ManagerHeader'

function actorLabel(role: string | null | undefined): string {
  if (role === 'manager') return 'Менеджер'
  if (role === 'client') return 'Клиент'
  if (role === 'system') return 'Система'
  return 'Система'
}

export function ManagerApplicationPage() {
  const { id } = useParams<{ id: string }>()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [application, setApplication] = useState<ManagerApplication | null>(
    null,
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [declineReason, setDeclineReason] = useState('')
  const [showDecline, setShowDecline] = useState(false)
  const [showClarify, setShowClarify] = useState(false)
  const [clarifyQuestion, setClarifyQuestion] = useState('')
  const [showReduced, setShowReduced] = useState(false)
  const [reducedAmount, setReducedAmount] = useState('')

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const data = await getManagerApplication(id)
      setApplication(data)
      if (data.decision?.alternative_amount != null) {
        setReducedAmount(String(data.decision.alternative_amount))
      } else if (data.amount != null) {
        setReducedAmount('')
      }
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Не удалось загрузить заявку'
      setError(message)
      setApplication(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  async function handleApprove() {
    if (!id) return
    setBusy(true)
    setActionError(null)
    try {
      const data = await approveApplication(id)
      setApplication(data)
      setShowDecline(false)
      setShowClarify(false)
      setShowReduced(false)
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : 'Не удалось одобрить заявку',
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleDecline() {
    if (!id) return
    const reason = declineReason.trim()
    if (reason.length < 3) {
      setActionError('Укажите причину отказа (не менее 3 символов)')
      return
    }
    setBusy(true)
    setActionError(null)
    try {
      const data = await declineApplication(id, reason)
      setApplication(data)
      setShowDecline(false)
      setDeclineReason('')
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : 'Не удалось отклонить заявку',
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleClarify() {
    if (!id) return
    const question = clarifyQuestion.trim()
    if (question.length < 3) {
      setActionError('Укажите вопрос (не менее 3 символов)')
      return
    }
    setBusy(true)
    setActionError(null)
    try {
      const data = await requestClarification(id, question)
      setApplication(data)
      setShowClarify(false)
      setClarifyQuestion('')
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? err.message
          : 'Не удалось запросить уточнение',
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleReduced() {
    if (!id) return
    const amount = Number(reducedAmount.replace(/\s/g, ''))
    if (!Number.isFinite(amount) || amount <= 0) {
      setActionError('Укажите корректную сумму')
      return
    }
    setBusy(true)
    setActionError(null)
    try {
      const data = await offerReducedApplication(id, amount)
      setApplication(data)
      setShowReduced(false)
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? err.message
          : 'Не удалось предложить меньшую сумму',
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleRecheck() {
    if (!id) return
    setBusy(true)
    setActionError(null)
    try {
      const data = await recheckApplication(id)
      setApplication(data)
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? err.message
          : 'Не удалось повторить проверку',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f2f3f5]">
      <ManagerHeader onLogout={() => void handleLogout()} />
      <main className="mx-auto flex w-full max-w-[720px] flex-1 flex-col px-8 py-10">
        <Link
          to="/manager"
          className="mb-6 text-[14px] text-[#ef3124] no-underline hover:underline"
        >
          ← К очереди
        </Link>

        {loading ? (
          <p className="m-0 text-[16px] text-[rgba(3,3,6,0.62)]">
            Загрузка заявки…
          </p>
        ) : null}

        {error || (!loading && !application) ? (
          <div className={`${surfaceCard} px-8 py-8 text-center`}>
            <p className="m-0 text-[16px] text-[rgba(3,3,6,0.88)]">
              {error ?? 'Заявка не найдена'}
            </p>
            <button
              type="button"
              className={`${primaryBtn} mx-auto mt-6 w-full max-w-[240px] flex-none`}
              onClick={() => void load()}
            >
              Повторить
            </button>
          </div>
        ) : null}

        {application ? (
          <div className="flex flex-col gap-4">
            <div className={`${surfaceCard} px-8 py-6`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="m-0 text-[22px] font-bold leading-[26px] text-[rgba(3,3,6,0.88)]">
                    {STATUS_LABELS[application.status]}
                  </p>
                  <p className="mt-2 m-0 text-[15px] text-[rgba(3,3,6,0.62)]">
                    {application.product.name}
                  </p>
                </div>
                <span className="text-[13px] text-[rgba(3,3,6,0.55)]">
                  ID {application.id.slice(0, 8)}…
                </span>
              </div>
            </div>

            <article className={`${surfaceCard} px-8 py-8`}>
              <h2 className="m-0 text-[18px] font-bold leading-6 text-[rgba(3,3,6,0.88)]">
                Клиент и компания
              </h2>
              <dl className="mt-5 m-0 grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="m-0 text-[13px] text-[rgba(3,3,6,0.55)]">Клиент</dt>
                  <dd className="mt-1 m-0 text-[15px] text-[rgba(3,3,6,0.88)]">
                    {application.client_display_name}
                  </dd>
                </div>
                <div>
                  <dt className="m-0 text-[13px] text-[rgba(3,3,6,0.55)]">Компания</dt>
                  <dd className="mt-1 m-0 text-[15px] text-[rgba(3,3,6,0.88)]">
                    {application.company_name ??
                      application.snapshot?.company_name ??
                      '—'}
                  </dd>
                </div>
                <div>
                  <dt className="m-0 text-[13px] text-[rgba(3,3,6,0.55)]">ИНН</dt>
                  <dd className="mt-1 m-0 text-[15px] text-[rgba(3,3,6,0.88)]">
                    {application.company_inn ?? application.snapshot?.inn ?? '—'}
                  </dd>
                </div>
                <div>
                  <dt className="m-0 text-[13px] text-[rgba(3,3,6,0.55)]">Контакт</dt>
                  <dd className="mt-1 m-0 text-[15px] text-[rgba(3,3,6,0.88)]">
                    {application.snapshot?.contact_person ?? '—'}
                  </dd>
                </div>
              </dl>
            </article>

            <article className={`${surfaceCard} px-8 py-8`}>
              <h2 className="m-0 text-[18px] font-bold leading-6 text-[rgba(3,3,6,0.88)]">
                Запрос
              </h2>
              <dl className="mt-5 m-0 grid gap-4 sm:grid-cols-2">
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
                  <dt className="m-0 text-[13px] text-[rgba(3,3,6,0.55)]">
                    Назначение
                  </dt>
                  <dd className="mt-1 m-0 text-[15px] text-[rgba(3,3,6,0.88)]">
                    {purposeLabel(application.purpose)}
                  </dd>
                </div>
                <div>
                  <dt className="m-0 text-[13px] text-[rgba(3,3,6,0.55)]">
                    Ориентировочный платёж
                  </dt>
                  <dd className="mt-1 m-0 text-[15px] text-[rgba(3,3,6,0.88)]">
                    {application.estimated_payment != null
                      ? `${formatMoney(application.estimated_payment)} / мес.`
                      : '—'}
                  </dd>
                </div>
              </dl>
            </article>

            <ApplicationAssessmentPanel application={application} />

            <ClarificationsPanel application={application} />

            {application.active_offer ? (
              <article className={`${surfaceCard} px-8 py-8`}>
                <h2 className="m-0 text-[18px] font-bold leading-6 text-[rgba(3,3,6,0.88)]">
                  Предложение
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
              </article>
            ) : null}

            {application.status === 'declined' &&
            application.decision?.comment ? (
              <article className={`${surfaceCard} px-8 py-8`}>
                <h2 className="m-0 text-[18px] font-bold leading-6 text-[rgba(3,3,6,0.88)]">
                  Причина отказа
                </h2>
                <p className="mt-4 m-0 text-[15px] leading-6 text-[rgba(3,3,6,0.88)]">
                  {application.decision.comment}
                </p>
              </article>
            ) : null}

            {application.status === 'manual_review' ? (
              <article className={`${surfaceCard} px-8 py-8`}>
                <h2 className="m-0 text-[18px] font-bold leading-6 text-[rgba(3,3,6,0.88)]">
                  Действия
                </h2>
                <div className="mt-6 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={`${primaryBtn} flex-none min-w-[200px]`}
                    disabled={busy}
                    onClick={() => void handleApprove()}
                  >
                    Одобрить на запрошенных условиях
                  </button>
                  <button
                    type="button"
                    className={`${secondaryBtn} flex-none min-w-[140px]`}
                    disabled={busy}
                    onClick={() => {
                      setShowDecline((value) => !value)
                      setShowClarify(false)
                      setShowReduced(false)
                      setActionError(null)
                    }}
                  >
                    Отказать
                  </button>
                  <button
                    type="button"
                    className={`${secondaryBtn} flex-none min-w-[160px]`}
                    disabled={busy}
                    onClick={() => {
                      setShowClarify((value) => !value)
                      setShowDecline(false)
                      setShowReduced(false)
                      setActionError(null)
                    }}
                  >
                    Запросить уточнение
                  </button>
                  <button
                    type="button"
                    className={`${secondaryBtn} flex-none min-w-[180px]`}
                    disabled={busy}
                    onClick={() => {
                      setShowReduced((value) => !value)
                      setShowDecline(false)
                      setShowClarify(false)
                      setActionError(null)
                      if (
                        !reducedAmount &&
                        application.decision?.alternative_amount != null
                      ) {
                        setReducedAmount(
                          String(application.decision.alternative_amount),
                        )
                      }
                    }}
                  >
                    Предложить меньшую сумму
                  </button>
                  <button
                    type="button"
                    className={`${secondaryBtn} flex-none min-w-[160px]`}
                    disabled={busy}
                    onClick={() => void handleRecheck()}
                  >
                    Повторить проверку
                  </button>
                </div>

                {showDecline ? (
                  <div className="mt-6">
                    <div className={fieldWrapClass}>
                      <label className={labelClass} htmlFor="decline-reason">
                        Причина отказа
                      </label>
                      <textarea
                        id="decline-reason"
                        className={textareaClass}
                        value={declineReason}
                        onChange={(event) => setDeclineReason(event.target.value)}
                        rows={3}
                        disabled={busy}
                      />
                    </div>
                    <button
                      type="button"
                      className={`${primaryBtn} mt-4 w-full max-w-[240px] flex-none`}
                      disabled={busy}
                      onClick={() => void handleDecline()}
                    >
                      Подтвердить отказ
                    </button>
                  </div>
                ) : null}

                {showClarify ? (
                  <div className="mt-6">
                    <div className={fieldWrapClass}>
                      <label className={labelClass} htmlFor="clarify-question">
                        Вопрос клиенту
                      </label>
                      <textarea
                        id="clarify-question"
                        className={textareaClass}
                        value={clarifyQuestion}
                        onChange={(event) =>
                          setClarifyQuestion(event.target.value)
                        }
                        rows={3}
                        disabled={busy}
                      />
                    </div>
                    <button
                      type="button"
                      className={`${primaryBtn} mt-4 w-full max-w-[280px] flex-none`}
                      disabled={busy}
                      onClick={() => void handleClarify()}
                    >
                      Отправить запрос
                    </button>
                  </div>
                ) : null}

                {showReduced ? (
                  <div className="mt-6">
                    <p className="m-0 text-[13px] text-[rgba(3,3,6,0.55)]">
                      Сумма меньше запрошенной, не ниже{' '}
                      {application.product.amount_min.toLocaleString('ru-RU')} ₽,
                      кратна{' '}
                      {application.product.alternative_step.toLocaleString(
                        'ru-RU',
                      )}{' '}
                      ₽
                    </p>
                    {application.decision?.alternative_amount != null ? (
                      <p className="mt-1 m-0 text-[13px] text-[rgba(3,3,6,0.55)]">
                        Расчётная альтернатива:{' '}
                        {formatMoney(application.decision.alternative_amount)}
                      </p>
                    ) : null}
                    <div className={fieldWrapClass}>
                      <label className={labelClass} htmlFor="reduced-amount">
                        Сумма предложения
                      </label>
                      <input
                        id="reduced-amount"
                        className={fieldClass}
                        value={reducedAmount}
                        onChange={(event) => setReducedAmount(event.target.value)}
                        disabled={busy}
                        inputMode="numeric"
                      />
                    </div>
                    <button
                      type="button"
                      className={`${primaryBtn} mt-4 w-full max-w-[280px] flex-none`}
                      disabled={busy}
                      onClick={() => void handleReduced()}
                    >
                      Создать предложение
                    </button>
                  </div>
                ) : null}

                {actionError ? (
                  <p className="mt-4 m-0 text-[14px] text-[#ef3124]">{actionError}</p>
                ) : null}
              </article>
            ) : null}

            {actionError && application.status !== 'manual_review' ? (
              <p className="m-0 text-[14px] text-[#ef3124]">{actionError}</p>
            ) : null}

            <article className={`${surfaceCard} px-8 py-8`}>
              <h2 className="m-0 text-[18px] font-bold leading-6 text-[rgba(3,3,6,0.88)]">
                История
              </h2>
              <ul className="mt-5 m-0 flex list-none flex-col gap-3 p-0">
                {application.events.length === 0 ? (
                  <li className="text-[14px] text-[rgba(3,3,6,0.55)]">
                    Событий пока нет
                  </li>
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
          </div>
        ) : null}
      </main>
    </div>
  )
}
