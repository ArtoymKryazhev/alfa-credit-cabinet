import { useCallback, useEffect, useRef, useState } from 'react'
import {
  patchApplication,
  submitApplication,
  type Application,
  type DraftStep,
  type Purpose,
} from '../../api/applications'
import { ApiError } from '../../api/client'
import {
  getProfile,
  lookupRegistry,
  saveProfile,
  type BusinessProfile,
} from '../../api/profile'
import {
  estimateAnnuityPayment,
  formatMoney,
  purposeLabel,
  PURPOSE_LABELS,
} from './applicationLabels'
import { activityOptions, type ActivityOption } from './businessProfileMock'
import {
  buttonRow,
  fieldClass,
  fieldWrapClass,
  ghostLink,
  labelClass,
  primaryBtn,
  secondaryBtn,
  selectClass,
  surfaceCard,
  textareaClass,
} from './uiClasses'

const stepLabels = [
  { key: 'business' as const, title: 'Ваш бизнес', subtitle: 'Проверьте сведения' },
  { key: 'params' as const, title: 'Финансирование', subtitle: 'Сумма и срок' },
  { key: 'review' as const, title: 'Проверка', subtitle: 'Отправка заявки' },
] as const

type ParamsForm = {
  amount: string
  termMonths: string
  purpose: Purpose | ''
  comment: string
}

function stepIndex(step: DraftStep): number {
  return stepLabels.findIndex((item) => item.key === step)
}

function isActivityOption(value: string | null | undefined): value is ActivityOption {
  return !!value && (activityOptions as readonly string[]).includes(value)
}

function paramsFromApplication(app: Application): ParamsForm {
  const payload = app.draft_payload ?? {}
  return {
    amount: String(app.amount ?? payload.amount ?? ''),
    termMonths: String(app.term_months ?? payload.term_months ?? ''),
    purpose: (app.purpose ?? payload.purpose ?? '') as Purpose | '',
    comment: String(payload.comment ?? ''),
  }
}

function StepIndicator({ activeStep }: { activeStep: DraftStep }) {
  const active = stepIndex(activeStep) + 1
  return (
    <div className="relative mx-auto mt-12 flex w-full items-start justify-between">
      {stepLabels.map((step, index) => {
        const number = index + 1
        const isActive = number === active
        const isDone = number < active
        const lineFilled = active > number
        return (
          <div key={step.key} className="relative flex w-[364px] max-w-[33%] flex-col items-center">
            {index < stepLabels.length - 1 ? (
              <div
                className="pointer-events-none absolute left-1/2 top-6 z-0 h-0.5 w-full overflow-hidden bg-[#dcdde3]"
                aria-hidden
              >
                <div
                  className="mb-step-line-fill h-full w-full bg-[#ef3124]"
                  style={{ transform: lineFilled ? 'scaleX(1)' : 'scaleX(0)' }}
                />
              </div>
            ) : null}
            <div
              className={`mb-step-circle relative z-10 flex size-12 shrink-0 items-center justify-center rounded-full text-[18px] font-bold leading-none ${
                isActive || isDone
                  ? 'bg-[#ef3124] text-white'
                  : 'bg-[#e7e8eb] text-[rgba(3,3,6,0.55)]'
              }`}
            >
              {number}
            </div>
            <div className="mt-4 w-full px-2 text-center">
              <p
                className={`m-0 text-[22px] font-bold leading-[26px] tracking-[0.2px] ${
                  isActive ? 'text-[rgba(3,3,6,0.88)]' : 'text-[rgba(3,3,6,0.62)]'
                }`}
              >
                {step.title}
              </p>
              <p className="mt-1 m-0 text-[16px] leading-6 text-[rgba(3,3,6,0.55)]">
                {step.subtitle}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

type ApplicationDraftWizardProps = {
  application: Application
  onUpdated: (application: Application) => void
}

export function ApplicationDraftWizard({
  application,
  onUpdated,
}: ApplicationDraftWizardProps) {
  const [step, setStep] = useState<DraftStep>(application.current_step)
  const [params, setParams] = useState<ParamsForm>(() => paramsFromApplication(application))
  const [profile, setProfile] = useState<BusinessProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [editingProfile, setEditingProfile] = useState(false)
  const [innInput, setInnInput] = useState('')
  const [contactForm, setContactForm] = useState({
    activityDirection: '' as ActivityOption | '',
    description: '',
    contactPerson: '',
    phone: '',
    email: '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveHint, setSaveHint] = useState<string | null>(null)
  const debounceRef = useRef<number | null>(null)
  const appId = application.id
  const product = application.product
  const amountMin = product.amount_min
  const amountMax = product.amount_max
  const termMin = product.term_min
  const termMax = product.term_max
  const rateAnnual = product.rate_annual
  const amountStep = product.alternative_step
  const productPurposes = product.purposes
  const ratePercent = Number((rateAnnual * 100).toFixed(2))
    .toString()
    .replace(/\.0+$/, '')
    .replace(/(\.\d*?)0+$/, '$1')

  const loadProfile = useCallback(async () => {
    setProfileLoading(true)
    try {
      const data = await getProfile()
      setProfile(data)
      setInnInput(data.inn ?? '')
      setContactForm({
        activityDirection: isActivityOption(data.activity_direction)
          ? data.activity_direction
          : '',
        description: data.description ?? '',
        contactPerson: data.contact_person ?? '',
        phone: data.contact_phone ?? '',
        email: data.contact_email ?? '',
      })
      if (data.completeness !== 'filled') {
        setEditingProfile(true)
      }
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Не удалось загрузить профиль'
      setError(message)
    } finally {
      setProfileLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  useEffect(() => {
    setStep(application.current_step)
    setParams(paramsFromApplication(application))
  }, [application])

  async function persistPatch(payload: Parameters<typeof patchApplication>[1]) {
    const updated = await patchApplication(appId, payload)
    onUpdated(updated)
    setSaveHint('Сохранено')
    window.setTimeout(() => setSaveHint(null), 1500)
    return updated
  }

  function scheduleParamsSave(next: ParamsForm) {
    if (debounceRef.current != null) {
      window.clearTimeout(debounceRef.current)
    }
    debounceRef.current = window.setTimeout(() => {
      const amount = Number(next.amount)
      const termMonths = Number(next.termMonths)
      const body: Parameters<typeof patchApplication>[1] = {
        comment: next.comment,
      }
      if (Number.isFinite(amount) && amount > 0) body.amount = amount
      if (Number.isFinite(termMonths) && termMonths > 0) body.term_months = termMonths
      if (next.purpose) body.purpose = next.purpose
      void persistPatch(body).catch((err: unknown) => {
        const message =
          err instanceof ApiError ? err.message : 'Не удалось сохранить черновик'
        setError(message)
      })
    }, 600)
  }

  async function goToStep(next: DraftStep) {
    setError(null)
    setBusy(true)
    try {
      if (debounceRef.current != null) {
        window.clearTimeout(debounceRef.current)
        debounceRef.current = null
      }
      const amount = Number(params.amount)
      const termMonths = Number(params.termMonths)
      const body: Parameters<typeof patchApplication>[1] = {
        current_step: next,
        comment: params.comment,
      }
      if (Number.isFinite(amount) && amount > 0) body.amount = amount
      if (Number.isFinite(termMonths) && termMonths > 0) body.term_months = termMonths
      if (params.purpose) body.purpose = params.purpose
      const updated = await persistPatch(body)
      setStep(updated.current_step)
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Не удалось сохранить шаг'
      setError(message)
    } finally {
      setBusy(false)
    }
  }

  async function handleLookup() {
    setError(null)
    setBusy(true)
    try {
      const company = await lookupRegistry(innInput.trim())
      const saved = await saveProfile({ inn: company.inn })
      setProfile(saved)
      setInnInput(saved.inn ?? company.inn)
      setEditingProfile(true)
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Не удалось найти компанию'
      setError(message)
    } finally {
      setBusy(false)
    }
  }

  async function handleSaveProfileContacts() {
    if (!profile?.inn && !innInput.trim()) return
    setError(null)
    setBusy(true)
    try {
      const saved = await saveProfile({
        inn: (profile?.inn ?? innInput).trim(),
        activity_direction: contactForm.activityDirection || null,
        description: contactForm.description || null,
        contact_person: contactForm.contactPerson || null,
        contact_phone: contactForm.phone || null,
        contact_email: contactForm.email || null,
      })
      setProfile(saved)
      if (saved.completeness === 'filled') {
        setEditingProfile(false)
      }
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Не удалось сохранить профиль'
      setError(message)
    } finally {
      setBusy(false)
    }
  }

  function updateParams<K extends keyof ParamsForm>(key: K, value: ParamsForm[K]) {
    setParams((prev) => {
      const next = { ...prev, [key]: value }
      scheduleParamsSave(next)
      return next
    })
  }

  async function handleSubmit() {
    setError(null)
    setBusy(true)
    try {
      if (debounceRef.current != null) {
        window.clearTimeout(debounceRef.current)
        debounceRef.current = null
      }
      const amount = Number(params.amount)
      const termMonths = Number(params.termMonths)
      if (
        !Number.isFinite(amount) ||
        amount < amountMin ||
        amount > amountMax ||
        !Number.isFinite(termMonths) ||
        termMonths < termMin ||
        termMonths > termMax ||
        !params.purpose
      ) {
        setError(
          `Укажите сумму (${amountMin.toLocaleString('ru-RU')}–${amountMax.toLocaleString('ru-RU')} ₽), срок (${termMin}–${termMax} мес.) и назначение`,
        )
        setBusy(false)
        return
      }
      await persistPatch({
        current_step: 'review',
        amount,
        term_months: termMonths,
        purpose: params.purpose,
        comment: params.comment,
      })
      const submitted = await submitApplication(appId)
      onUpdated(submitted)
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Не удалось отправить заявку'
      setError(message)
    } finally {
      setBusy(false)
    }
  }

  const amountNum = Number(params.amount)
  const termNum = Number(params.termMonths)
  const estimated =
    Number.isFinite(amountNum) &&
    amountNum > 0 &&
    Number.isFinite(termNum) &&
    termNum > 0
      ? estimateAnnuityPayment(amountNum, termNum, rateAnnual)
      : null

  const profileFilled = profile?.completeness === 'filled'

  return (
    <section className="relative z-10 mx-auto w-[1140px] max-w-full pb-16 pt-[66px]">
      <h1 className="m-0 text-center text-[40px] font-bold leading-[48px] tracking-[0.1px] text-[rgba(3,3,6,0.88)]">
        Оформление заявки
      </h1>
      <p className="mx-auto mt-3 mb-0 max-w-[640px] text-center text-[16px] leading-6 tracking-[-0.24px] text-[rgba(3,3,6,0.62)]">
        {product.name}
        {saveHint ? ` · ${saveHint}` : ''}
      </p>

      <StepIndicator activeStep={step} />

      <div className={`mx-auto mt-10 w-full ${surfaceCard} px-12 py-[72px]`}>
        <div className="mx-auto w-full max-w-[655px]">
          {error ? (
            <p className="mb-4 m-0 text-[14px] leading-5 text-[#ef3124]">{error}</p>
          ) : null}

          {step === 'business' ? (
            <>
              <h2 className="m-0 text-[30px] font-bold leading-9 tracking-[0.1px] text-[rgba(3,3,6,0.88)]">
                Ваш бизнес
              </h2>
              <p className="mt-2 m-0 text-[16px] leading-6 text-[rgba(3,3,6,0.62)]">
                Данные из профиля. Принудительно во вкладку «Мой бизнес» не
                переходим
              </p>

              {profileLoading ? (
                <p className="mt-8 m-0 text-[16px] text-[rgba(3,3,6,0.62)]">
                  Загрузка профиля…
                </p>
              ) : null}

              {!profileLoading && (!profile?.inn || editingProfile) ? (
                <>
                  {!profile?.inn ? (
                    <>
                      <label className={fieldWrapClass}>
                        <span className={labelClass}>ИНН компании или ИП</span>
                        <input
                          type="text"
                          className={fieldClass}
                          value={innInput}
                          onChange={(e) => setInnInput(e.target.value)}
                          placeholder="XXXXXXXXXX"
                          autoComplete="off"
                        />
                      </label>
                      <div className={buttonRow}>
                        <button
                          type="button"
                          className={primaryBtn}
                          disabled={busy || !innInput.trim()}
                          onClick={() => void handleLookup()}
                        >
                          {busy ? 'Поиск…' : 'Найти компанию'}
                        </button>
                      </div>
                    </>
                  ) : null}

                  {profile?.inn ? (
                    <>
                      <div className="mt-6 rounded-[16px] bg-[rgba(38,55,88,0.04)] px-5 py-5">
                        <p className="m-0 text-[18px] font-bold text-[rgba(3,3,6,0.88)]">
                          {profile.company_name}
                        </p>
                        <p className="mt-2 m-0 text-[14px] text-[rgba(3,3,6,0.62)]">
                          ИНН {profile.inn}
                          {profile.registry_source
                            ? ` · ${profile.registry_source}`
                            : ''}
                        </p>
                      </div>

                      <label className={fieldWrapClass}>
                        <span className={labelClass}>Основное направление</span>
                        <select
                          className={selectClass}
                          value={contactForm.activityDirection}
                          onChange={(e) =>
                            setContactForm((prev) => ({
                              ...prev,
                              activityDirection: e.target.value as ActivityOption | '',
                            }))
                          }
                        >
                          <option value="">Выберите направление</option>
                          {activityOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className={fieldWrapClass}>
                        <span className={labelClass}>Описание бизнеса</span>
                        <textarea
                          className={textareaClass}
                          value={contactForm.description}
                          onChange={(e) =>
                            setContactForm((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          rows={3}
                        />
                      </label>
                      <label className={fieldWrapClass}>
                        <span className={labelClass}>Контактное лицо</span>
                        <input
                          type="text"
                          className={fieldClass}
                          value={contactForm.contactPerson}
                          onChange={(e) =>
                            setContactForm((prev) => ({
                              ...prev,
                              contactPerson: e.target.value,
                            }))
                          }
                        />
                      </label>
                      <label className={fieldWrapClass}>
                        <span className={labelClass}>Телефон</span>
                        <input
                          type="tel"
                          className={fieldClass}
                          value={contactForm.phone}
                          onChange={(e) =>
                            setContactForm((prev) => ({
                              ...prev,
                              phone: e.target.value,
                            }))
                          }
                        />
                      </label>
                      <label className={fieldWrapClass}>
                        <span className={labelClass}>Электронная почта</span>
                        <input
                          type="email"
                          className={fieldClass}
                          value={contactForm.email}
                          onChange={(e) =>
                            setContactForm((prev) => ({
                              ...prev,
                              email: e.target.value,
                            }))
                          }
                        />
                      </label>
                      <div className={buttonRow}>
                        <button
                          type="button"
                          className={primaryBtn}
                          disabled={busy}
                          onClick={() => void handleSaveProfileContacts()}
                        >
                          {busy ? 'Сохранение…' : 'Сохранить сведения'}
                        </button>
                      </div>
                    </>
                  ) : null}
                </>
              ) : null}

              {!profileLoading && profileFilled && !editingProfile && profile ? (
                <>
                  <div className="mt-8 rounded-[16px] bg-[rgba(38,55,88,0.04)] px-5 py-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="m-0 text-[18px] font-bold text-[rgba(3,3,6,0.88)]">
                          {profile.company_name}
                        </p>
                        <p className="mt-2 m-0 text-[14px] text-[rgba(3,3,6,0.62)]">
                          ИНН {profile.inn}
                        </p>
                        <p className="mt-1 m-0 text-[14px] text-[rgba(3,3,6,0.62)]">
                          {profile.activity_direction}
                        </p>
                        <p className="mt-1 m-0 text-[14px] text-[rgba(3,3,6,0.62)]">
                          {profile.contact_person}, {profile.contact_phone}
                        </p>
                      </div>
                      <button
                        type="button"
                        className={ghostLink}
                        onClick={() => setEditingProfile(true)}
                      >
                        Изменить
                      </button>
                    </div>
                  </div>
                  <div className={buttonRow}>
                    <button
                      type="button"
                      className={primaryBtn}
                      disabled={busy}
                      onClick={() => void goToStep('params')}
                    >
                      Продолжить
                    </button>
                  </div>
                </>
              ) : null}

              {!profileLoading && profile?.completeness === 'partial' && !editingProfile ? (
                <div className={buttonRow}>
                  <button
                    type="button"
                    className={primaryBtn}
                    onClick={() => setEditingProfile(true)}
                  >
                    Дополнить сведения
                  </button>
                </div>
              ) : null}
            </>
          ) : null}

          {step === 'params' ? (
            <>
              <h2 className="m-0 text-[30px] font-bold leading-9 tracking-[0.1px] text-[rgba(3,3,6,0.88)]">
                Какое финансирование нужно
              </h2>
              <p className="mt-2 m-0 text-[16px] leading-6 text-[rgba(3,3,6,0.62)]">
                Сумма от {amountMin.toLocaleString('ru-RU')} до{' '}
                {amountMax.toLocaleString('ru-RU')} ₽, срок {termMin}–
                {termMax} месяцев. Ставка в демо — {ratePercent}% годовых
              </p>

              <label className={fieldWrapClass}>
                <span className={labelClass}>Сумма, ₽</span>
                <input
                  type="number"
                  className={fieldClass}
                  value={params.amount}
                  onChange={(e) => updateParams('amount', e.target.value)}
                  min={amountMin}
                  max={amountMax}
                  step={amountStep}
                />
              </label>
              <label className={fieldWrapClass}>
                <span className={labelClass}>Срок, месяцев</span>
                <input
                  type="number"
                  className={fieldClass}
                  value={params.termMonths}
                  onChange={(e) => updateParams('termMonths', e.target.value)}
                  min={termMin}
                  max={termMax}
                />
              </label>
              <label className={fieldWrapClass}>
                <span className={labelClass}>Назначение</span>
                <select
                  className={selectClass}
                  value={params.purpose}
                  onChange={(e) =>
                    updateParams('purpose', e.target.value as Purpose | '')
                  }
                >
                  <option value="">Выберите назначение</option>
                  {productPurposes.map((key) => (
                    <option key={key} value={key}>
                      {PURPOSE_LABELS[key] ?? key}
                    </option>
                  ))}
                </select>
              </label>
              <label className={fieldWrapClass}>
                <span className={labelClass}>Пояснение (необязательно)</span>
                <textarea
                  className={textareaClass}
                  value={params.comment}
                  onChange={(e) => updateParams('comment', e.target.value)}
                  rows={3}
                />
              </label>

              {estimated != null ? (
                <p className="mt-4 m-0 text-[15px] text-[rgba(3,3,6,0.72)]">
                  Ориентировочный платёж: {formatMoney(estimated)} / мес.
                </p>
              ) : null}

              <div className={buttonRow}>
                <button
                  type="button"
                  className={secondaryBtn}
                  disabled={busy}
                  onClick={() => void goToStep('business')}
                >
                  Назад
                </button>
                <button
                  type="button"
                  className={primaryBtn}
                  disabled={busy}
                  onClick={() => void goToStep('review')}
                >
                  Продолжить
                </button>
              </div>
            </>
          ) : null}

          {step === 'review' ? (
            <>
              <h2 className="m-0 text-[30px] font-bold leading-9 tracking-[0.1px] text-[rgba(3,3,6,0.88)]">
                Проверьте заявку
              </h2>
              <p className="mt-2 m-0 text-[16px] leading-6 text-[rgba(3,3,6,0.62)]">
                После отправки заявка поступит на рассмотрение
              </p>

              <dl className="mt-8 m-0 grid gap-4 rounded-[16px] bg-[rgba(38,55,88,0.04)] px-5 py-5">
                <div>
                  <dt className="m-0 text-[13px] text-[rgba(3,3,6,0.55)]">Компания</dt>
                  <dd className="mt-1 m-0 text-[15px] text-[rgba(3,3,6,0.88)]">
                    {profile?.company_name ?? '—'}
                  </dd>
                </div>
                <div>
                  <dt className="m-0 text-[13px] text-[rgba(3,3,6,0.55)]">Сумма</dt>
                  <dd className="mt-1 m-0 text-[15px] text-[rgba(3,3,6,0.88)]">
                    {formatMoney(Number.isFinite(amountNum) ? amountNum : null)}
                  </dd>
                </div>
                <div>
                  <dt className="m-0 text-[13px] text-[rgba(3,3,6,0.55)]">Срок</dt>
                  <dd className="mt-1 m-0 text-[15px] text-[rgba(3,3,6,0.88)]">
                    {Number.isFinite(termNum) ? `${termNum} мес.` : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="m-0 text-[13px] text-[rgba(3,3,6,0.55)]">Назначение</dt>
                  <dd className="mt-1 m-0 text-[15px] text-[rgba(3,3,6,0.88)]">
                    {purposeLabel(params.purpose || null)}
                  </dd>
                </div>
                {params.comment ? (
                  <div>
                    <dt className="m-0 text-[13px] text-[rgba(3,3,6,0.55)]">Пояснение</dt>
                    <dd className="mt-1 m-0 text-[15px] text-[rgba(3,3,6,0.88)]">
                      {params.comment}
                    </dd>
                  </div>
                ) : null}
                {estimated != null ? (
                  <div>
                    <dt className="m-0 text-[13px] text-[rgba(3,3,6,0.55)]">
                      Ориентировочный платёж
                    </dt>
                    <dd className="mt-1 m-0 text-[15px] text-[rgba(3,3,6,0.88)]">
                      {formatMoney(estimated)} / мес.
                    </dd>
                  </div>
                ) : null}
              </dl>

              <div className={buttonRow}>
                <button
                  type="button"
                  className={secondaryBtn}
                  disabled={busy}
                  onClick={() => void goToStep('params')}
                >
                  Назад
                </button>
                <button
                  type="button"
                  className={primaryBtn}
                  disabled={busy || !profileFilled}
                  onClick={() => void handleSubmit()}
                >
                  {busy ? 'Отправка…' : 'Отправить заявку'}
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </section>
  )
}
