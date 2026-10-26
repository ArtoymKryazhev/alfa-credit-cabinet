import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { ApiError } from '../../api/client'
import {
  getProfile,
  lookupRegistry,
  saveProfile,
  type BusinessProfile,
  type RegistryCompany,
} from '../../api/profile'
import {
  activityOptions,
  type ActivityOption,
  type DemoDocument,
} from './businessProfileMock'
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

type WizardStep = 1 | 2 | 3
type ViewMode = 'wizard' | 'partial-home' | 'done' | 'profile'

type FormFields = {
  inn: string
  activityDirection: ActivityOption | ''
  description: string
  contactPerson: string
  phone: string
  email: string
}

type CompanyCardData = {
  companyName: string
  inn: string
  registrationDate: string
  address: string
  activities: string
  source: string
  asOf: string
}

const emptyForm: FormFields = {
  inn: '',
  activityDirection: '',
  description: '',
  contactPerson: '',
  phone: '',
  email: '',
}

const stepLabels = [
  { title: 'Данные компании', subtitle: 'Укажите сведения о бизнесе' },
  { title: 'Дополнительные сведения', subtitle: 'Контакты и описание' },
  { title: 'Документы', subtitle: 'Материалы о деятельности' },
] as const

const documentCategories = [
  'Презентация компании',
  'Описание бизнеса',
  'Примеры работ',
] as const

function isActivityOption(value: string | null | undefined): value is ActivityOption {
  return (
    !!value &&
    (activityOptions as readonly string[]).includes(value)
  )
}

function formFromProfile(profile: BusinessProfile): FormFields {
  return {
    inn: profile.inn ?? '',
    activityDirection: isActivityOption(profile.activity_direction)
      ? profile.activity_direction
      : '',
    description: profile.description ?? '',
    contactPerson: profile.contact_person ?? '',
    phone: profile.contact_phone ?? '',
    email: profile.contact_email ?? '',
  }
}

function companyFromProfile(profile: BusinessProfile): CompanyCardData | null {
  if (!profile.inn || !profile.company_name) return null
  return {
    companyName: profile.company_name,
    inn: profile.inn,
    registrationDate: profile.registration_date ?? '',
    address: profile.address ?? '',
    activities: profile.activities ?? '',
    source: profile.registry_source ?? '',
    asOf: profile.registry_as_of ?? '',
  }
}

function companyFromRegistry(company: RegistryCompany): CompanyCardData {
  return {
    companyName: company.name,
    inn: company.inn,
    registrationDate: company.registration_date,
    address: company.address,
    activities: company.activities,
    source: company.source,
    asOf: company.as_of,
  }
}

function CompanySummaryCard({
  company,
  compact = false,
}: {
  company: CompanyCardData
  compact?: boolean
}) {
  return (
    <div
      className={`rounded-[16px] bg-[rgba(38,55,88,0.04)] ${
        compact ? 'px-4 py-4' : 'px-5 py-5'
      }`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="m-0 text-[18px] font-bold leading-6 tracking-[0.1px] text-[rgba(3,3,6,0.88)]">
          {company.companyName}
        </h3>
        <span className="text-[12px] leading-4 tracking-[0.06px] text-[rgba(3,3,6,0.55)]">
          Источник: {company.source}
          {company.asOf ? `, данные на ${company.asOf}` : ''}
        </span>
      </div>
      <dl className="mt-4 m-0 grid gap-3 text-[14px] leading-5">
        <div className="flex flex-wrap gap-x-2">
          <dt className="m-0 text-[rgba(3,3,6,0.55)]">ИНН</dt>
          <dd className="m-0 text-[rgba(3,3,6,0.88)]">{company.inn}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="m-0 text-[rgba(3,3,6,0.55)]">Дата регистрации</dt>
          <dd className="m-0 text-[rgba(3,3,6,0.88)]">{company.registrationDate}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="m-0 text-[rgba(3,3,6,0.55)]">Адрес регистрации</dt>
          <dd className="m-0 text-[rgba(3,3,6,0.88)]">{company.address}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="m-0 text-[rgba(3,3,6,0.55)]">Виды деятельности</dt>
          <dd className="m-0 text-[rgba(3,3,6,0.88)]">{company.activities}</dd>
        </div>
      </dl>
    </div>
  )
}

function StepIndicator({ activeStep }: { activeStep: WizardStep }) {
  return (
    <div className="relative mx-auto mt-12 flex w-full items-start justify-between">
      {stepLabels.map((step, index) => {
        const number = (index + 1) as WizardStep
        const isActive = number === activeStep
        const isDone = number < activeStep
        const lineFilled = activeStep > number
        return (
          <div key={step.title} className="relative flex w-[364px] max-w-[33%] flex-col items-center">
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
                isActive
                  ? 'is-active bg-[#ef3124] text-white'
                  : isDone
                    ? 'bg-[#ef3124] text-white'
                    : 'bg-[#e7e8eb] text-[rgba(3,3,6,0.55)]'
              }`}
            >
              {number}
            </div>
            <div className="mt-4 w-full px-2 text-center">
              <p
                className={`mb-step-title m-0 text-[22px] font-bold leading-[26px] tracking-[0.2px] ${
                  isActive
                    ? 'text-[rgba(3,3,6,0.88)]'
                    : 'text-[rgba(3,3,6,0.62)]'
                }`}
              >
                {step.title}
              </p>
              <p
                className={`mb-step-subtitle mt-1 m-0 text-[16px] leading-6 tracking-[-0.24px] ${
                  isActive
                    ? 'text-[rgba(3,3,6,0.62)]'
                    : 'text-[rgba(3,3,6,0.55)]'
                }`}
              >
                {step.subtitle}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="m-0 text-[13px] leading-4 text-[rgba(3,3,6,0.55)]">{label}</dt>
      <dd className="mt-1 m-0 text-[15px] leading-5 text-[rgba(3,3,6,0.88)]">{value}</dd>
    </div>
  )
}

export function MyBusinessSection() {
  const fileInputId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [profile, setProfile] = useState<BusinessProfile | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('wizard')
  const [step, setStep] = useState<WizardStep>(1)
  const [companyFound, setCompanyFound] = useState(false)
  const [companyCard, setCompanyCard] = useState<CompanyCardData | null>(null)
  const [form, setForm] = useState<FormFields>(emptyForm)
  const [documents, setDocuments] = useState<DemoDocument[]>([])
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)

  const applyLoadedProfile = useCallback((data: BusinessProfile) => {
    setProfile(data)
    setForm(formFromProfile(data))
    setLookupError(null)
    setSaveError(null)
    setSelectedFileName(null)

    const card = companyFromProfile(data)
    setCompanyCard(card)

    if (data.completeness === 'filled') {
      setViewMode('profile')
      setCompanyFound(true)
      setStep(1)
      return
    }
    if (data.completeness === 'partial') {
      setViewMode('partial-home')
      setCompanyFound(true)
      setStep(2)
      return
    }
    setViewMode('wizard')
    setCompanyFound(false)
    setStep(1)
  }, [])

  const reloadProfile = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await getProfile()
      applyLoadedProfile(data)
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Не удалось загрузить профиль'
      setLoadError(message)
    } finally {
      setLoading(false)
    }
  }, [applyLoadedProfile])

  useEffect(() => {
    void reloadProfile()
  }, [reloadProfile])

  function updateField<K extends keyof FormFields>(key: K, value: FormFields[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function openEditCompany() {
    if (!profile) return
    setForm(formFromProfile(profile))
    setCompanyCard(companyFromProfile(profile))
    setCompanyFound(true)
    setStep(1)
    setViewMode('wizard')
    setLookupError(null)
    setSaveError(null)
  }

  function openEditContacts() {
    if (!profile) return
    setForm(formFromProfile(profile))
    setCompanyCard(companyFromProfile(profile))
    setCompanyFound(true)
    setStep(2)
    setViewMode('wizard')
    setSaveError(null)
  }

  function openEditDocuments() {
    if (!profile) return
    setForm(formFromProfile(profile))
    setCompanyCard(companyFromProfile(profile))
    setCompanyFound(true)
    setStep(3)
    setViewMode('wizard')
  }

  async function handleLookup() {
    setLookupError(null)
    setSaving(true)
    try {
      const company = await lookupRegistry(form.inn.trim())
      setCompanyCard(companyFromRegistry(company))
      updateField('inn', company.inn)
      setCompanyFound(true)
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Не удалось найти компанию'
      setLookupError(message)
      setCompanyFound(false)
      setCompanyCard(null)
    } finally {
      setSaving(false)
    }
  }

  async function handleConfirmCompany() {
    if (!form.inn) return
    setSaveError(null)
    setSaving(true)
    try {
      const saved = await saveProfile({ inn: form.inn.trim() })
      setProfile(saved)
      setForm(formFromProfile(saved))
      setCompanyCard(companyFromProfile(saved))
      setStep(2)
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Не удалось сохранить профиль'
      setSaveError(message)
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveStep2AndContinue() {
    if (!form.inn) return
    setSaveError(null)
    setSaving(true)
    try {
      const saved = await saveProfile({
        inn: form.inn.trim(),
        activity_direction: form.activityDirection || null,
        description: form.description || null,
        contact_person: form.contactPerson || null,
        contact_phone: form.phone || null,
        contact_email: form.email || null,
      })
      setProfile(saved)
      setForm(formFromProfile(saved))
      setCompanyCard(companyFromProfile(saved))
      setStep(3)
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Не удалось сохранить профиль'
      setSaveError(message)
    } finally {
      setSaving(false)
    }
  }

  async function handleFinishWizard() {
    // Materials are local-only; profile already saved on step 2 / confirm.
    setViewMode('done')
  }

  async function handleViewFilledProfile() {
    setLoading(true)
    try {
      const data = await getProfile()
      applyLoadedProfile(data)
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Не удалось загрузить профиль'
      setLoadError(message)
    } finally {
      setLoading(false)
    }
  }

  function handleFilePick(fileList: FileList | null) {
    const file = fileList?.[0]
    if (!file) return
    setSelectedFileName(file.name)
    setDocuments((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        name: file.name,
        category: 'Примеры работ',
      },
    ])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removeDocument(id: string) {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id))
    setSelectedFileName((name) => {
      const removed = documents.find((doc) => doc.id === id)
      return removed?.name === name ? null : name
    })
  }

  function addLocalDocument() {
    const nextIndex = documents.length + 1
    setDocuments((prev) => [
      ...prev,
      {
        id: `added-${Date.now()}`,
        name: `material-local-${nextIndex}.pdf`,
        category: 'Примеры работ',
      },
    ])
  }

  const showStepper = viewMode === 'wizard'

  if (loading) {
    return (
      <section className="relative z-10 mx-auto w-[1140px] max-w-full pb-16 pt-[66px]">
        <h1 className="m-0 text-center text-[40px] font-bold leading-[48px] tracking-[0.1px] text-[rgba(3,3,6,0.88)]">
          Мой бизнес
        </h1>
        <p className="mx-auto mt-8 mb-0 max-w-[640px] text-center text-[16px] leading-6 text-[rgba(3,3,6,0.62)]">
          Загрузка профиля…
        </p>
      </section>
    )
  }

  if (loadError) {
    return (
      <section className="relative z-10 mx-auto w-[1140px] max-w-full pb-16 pt-[66px]">
        <h1 className="m-0 text-center text-[40px] font-bold leading-[48px] tracking-[0.1px] text-[rgba(3,3,6,0.88)]">
          Мой бизнес
        </h1>
        <div className={`mx-auto mt-12 w-full max-w-[655px] ${surfaceCard} px-10 py-10 text-center`}>
          <p className="m-0 text-[16px] leading-6 text-[rgba(3,3,6,0.88)]">{loadError}</p>
          <button
            type="button"
            className={`${primaryBtn} mx-auto mt-6 w-full max-w-[240px] flex-none`}
            onClick={() => void reloadProfile()}
          >
            Повторить
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="relative z-10 mx-auto w-[1140px] max-w-full pb-16 pt-[66px]">
      <h1 className="m-0 text-center text-[40px] font-bold leading-[48px] tracking-[0.1px] text-[rgba(3,3,6,0.88)]">
        Мой бизнес
      </h1>
      <p className="mx-auto mt-3 mb-0 max-w-[640px] text-center text-[16px] leading-6 tracking-[-0.24px] text-[rgba(3,3,6,0.62)]">
        Заполните сведения о компании, чтобы использовать их при оформлении заявок
      </p>

      {showStepper ? <StepIndicator activeStep={step} /> : null}

      {viewMode === 'partial-home' ? (
        <div className="mx-auto mt-12 w-full max-w-[720px]">
          <div className={`${surfaceCard} px-8 py-8`}>
            <p className="m-0 text-[22px] font-bold leading-[26px] tracking-[0.2px] text-[rgba(3,3,6,0.88)]">
              Заполнение не завершено
            </p>
            <p className="mt-2 m-0 text-[16px] leading-6 tracking-[-0.24px] text-[rgba(3,3,6,0.62)]">
              Данные компании указаны. Осталось дополнить контакты и материалы
            </p>
            <button
              type="button"
              className={`${primaryBtn} mt-6 w-full max-w-[280px] flex-none`}
              onClick={() => {
                setStep(2)
                setViewMode('wizard')
              }}
            >
              Продолжить заполнение
            </button>
          </div>
          {companyCard ? (
            <div className="mt-6">
              <CompanySummaryCard company={companyCard} compact />
            </div>
          ) : null}
        </div>
      ) : null}

      {viewMode === 'done' ? (
        <div className={`mx-auto mt-12 w-full max-w-[655px] ${surfaceCard} px-10 py-14 text-center`}>
          <p className="m-0 text-[30px] font-bold leading-9 tracking-[0.1px] text-[rgba(3,3,6,0.88)]">
            Заполнение завершено
          </p>
          <p className="mt-3 m-0 text-[16px] leading-6 tracking-[-0.24px] text-[rgba(3,3,6,0.62)]">
            Сведения о компании сохранены. Материалы профиля в MVP остаются только в
            этом сеансе
          </p>
          <button
            type="button"
            className={`${primaryBtn} mx-auto mt-8 w-full max-w-[320px] flex-none`}
            onClick={() => void handleViewFilledProfile()}
          >
            Посмотреть заполненный профиль
          </button>
        </div>
      ) : null}

      {viewMode === 'profile' && profile ? (
        <div className="mx-auto mt-12 flex w-full flex-col gap-4">
          <div className={`${surfaceCard} px-8 py-6`}>
            <p className="m-0 text-[22px] font-bold leading-[26px] tracking-[0.2px] text-[rgba(3,3,6,0.88)]">
              Сведения о бизнесе заполнены
            </p>
            <p className="mt-1 m-0 text-[14px] leading-5 text-[rgba(3,3,6,0.55)]">
              {profile.registry_source
                ? `Источник: ${profile.registry_source}${
                    profile.registry_as_of
                      ? `, данные на ${profile.registry_as_of}`
                      : ''
                  }`
                : 'Профиль сохранён на сервере'}
            </p>
          </div>

          <article className={`${surfaceCard} px-8 py-8`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="m-0 text-[22px] font-bold leading-[26px] tracking-[0.2px] text-[rgba(3,3,6,0.88)]">
                Компания
              </h2>
              <button type="button" className={ghostLink} onClick={openEditCompany}>
                Изменить
              </button>
            </div>
            <dl className="mt-5 m-0 grid gap-4 sm:grid-cols-2">
              <ProfileField label="Название" value={profile.company_name ?? '—'} />
              <ProfileField label="ИНН" value={profile.inn ?? '—'} />
              <ProfileField
                label="Дата регистрации"
                value={profile.registration_date ?? '—'}
              />
              <ProfileField label="Адрес" value={profile.address ?? '—'} />
              <div className="sm:col-span-2">
                <ProfileField
                  label="Виды деятельности"
                  value={profile.activities ?? '—'}
                />
              </div>
            </dl>
          </article>

          <article className={`${surfaceCard} px-8 py-8`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="m-0 text-[22px] font-bold leading-[26px] tracking-[0.2px] text-[rgba(3,3,6,0.88)]">
                О бизнесе и контакты
              </h2>
              <button type="button" className={ghostLink} onClick={openEditContacts}>
                Изменить
              </button>
            </div>
            <dl className="mt-5 m-0 grid gap-4 sm:grid-cols-2">
              <ProfileField
                label="Основное направление"
                value={profile.activity_direction ?? '—'}
              />
              <div className="sm:col-span-2">
                <ProfileField
                  label="Описание бизнеса"
                  value={profile.description ?? '—'}
                />
              </div>
              <ProfileField
                label="Контактное лицо"
                value={profile.contact_person ?? '—'}
              />
              <ProfileField label="Телефон" value={profile.contact_phone ?? '—'} />
              <ProfileField label="Email" value={profile.contact_email ?? '—'} />
            </dl>
          </article>

          <article className={`${surfaceCard} px-8 py-8`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="m-0 text-[22px] font-bold leading-[26px] tracking-[0.2px] text-[rgba(3,3,6,0.88)]">
                Материалы
              </h2>
              <div className="flex flex-wrap gap-3">
                <button type="button" className={ghostLink} onClick={addLocalDocument}>
                  Добавить
                </button>
                <button
                  type="button"
                  className={ghostLink}
                  onClick={openEditDocuments}
                >
                  Изменить
                </button>
              </div>
            </div>
            <p className="mt-2 m-0 text-[13px] leading-4 text-[rgba(3,3,6,0.55)]">
              В MVP материалы профиля не уходят на сервер
            </p>
            <ul className="mt-5 m-0 flex list-none flex-col gap-2 p-0">
              {documents.length === 0 ? (
                <li className="rounded-[12px] bg-[rgba(38,55,88,0.04)] px-4 py-3 text-[14px] text-[rgba(3,3,6,0.55)]">
                  Материалы не добавлены
                </li>
              ) : (
                documents.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] bg-[rgba(38,55,88,0.04)] px-4 py-3"
                  >
                    <div>
                      <p className="m-0 text-[15px] font-medium leading-5 text-[rgba(3,3,6,0.88)]">
                        {doc.name}
                      </p>
                      <p className="mt-0.5 m-0 text-[13px] leading-4 text-[rgba(3,3,6,0.55)]">
                        {doc.category}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={ghostLink}
                      onClick={() => removeDocument(doc.id)}
                    >
                      Удалить
                    </button>
                  </li>
                ))
              )}
            </ul>
          </article>
        </div>
      ) : null}

      {viewMode === 'wizard' ? (
        <div className={`mx-auto mt-10 w-full ${surfaceCard} px-12 py-[72px]`}>
          <div className="mx-auto w-full max-w-[655px]">
            {step === 1 ? (
              <>
                <h2 className="m-0 text-[30px] font-bold leading-9 tracking-[0.1px] text-[rgba(3,3,6,0.88)]">
                  Данные вашего бизнеса
                </h2>
                <p className="mt-2 m-0 text-[16px] leading-6 tracking-[-0.24px] text-[rgba(3,3,6,0.62)]">
                  Укажите ИНН, чтобы найти сведения о компании
                </p>

                {!companyFound ? (
                  <>
                    <label className={fieldWrapClass}>
                      <span className={labelClass}>ИНН компании или ИП</span>
                      <input
                        type="text"
                        className={fieldClass}
                        value={form.inn}
                        onChange={(e) => {
                          updateField('inn', e.target.value)
                          setLookupError(null)
                        }}
                        placeholder="XXXXXXXXXX"
                        autoComplete="off"
                      />
                    </label>
                    {lookupError ? (
                      <p className="mt-2 m-0 text-[14px] leading-5 text-[#ef3124]">
                        {lookupError}
                      </p>
                    ) : null}
                    <div className={buttonRow}>
                      <button
                        type="button"
                        className={primaryBtn}
                        disabled={saving || !form.inn.trim()}
                        onClick={() => void handleLookup()}
                      >
                        {saving ? 'Поиск…' : 'Найти компанию'}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {companyCard ? (
                      <div className="mt-8">
                        <CompanySummaryCard company={companyCard} />
                      </div>
                    ) : null}
                    <p className="mt-6 m-0 text-[16px] font-medium leading-5 text-[rgba(3,3,6,0.88)]">
                      Это ваша компания?
                    </p>
                    {saveError ? (
                      <p className="mt-2 m-0 text-[14px] leading-5 text-[#ef3124]">
                        {saveError}
                      </p>
                    ) : null}
                    <div className={buttonRow}>
                      <button
                        type="button"
                        className={primaryBtn}
                        disabled={saving}
                        onClick={() => void handleConfirmCompany()}
                      >
                        {saving ? 'Сохранение…' : 'Да, продолжить'}
                      </button>
                      <button
                        type="button"
                        className={secondaryBtn}
                        disabled={saving}
                        onClick={() => {
                          setCompanyFound(false)
                          setCompanyCard(null)
                          updateField('inn', '')
                          setLookupError(null)
                          setSaveError(null)
                        }}
                      >
                        Изменить ИНН
                      </button>
                    </div>
                  </>
                )}
              </>
            ) : null}

            {step === 2 ? (
              <>
                <h2 className="m-0 text-[30px] font-bold leading-9 tracking-[0.1px] text-[rgba(3,3,6,0.88)]">
                  Дополнительные сведения
                </h2>
                <p className="mt-2 m-0 text-[16px] leading-6 tracking-[-0.24px] text-[rgba(3,3,6,0.62)]">
                  Расскажите о направлении бизнеса и контактах
                </p>

                <div className="mt-3 flex flex-col">
                  <label className={fieldWrapClass}>
                    <span className={labelClass}>Основное направление деятельности</span>
                    <select
                      className={selectClass}
                      value={form.activityDirection}
                      onChange={(e) =>
                        updateField(
                          'activityDirection',
                          e.target.value as ActivityOption | '',
                        )
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
                    <span className={labelClass}>Краткое описание бизнеса</span>
                    <textarea
                      className={textareaClass}
                      value={form.description}
                      onChange={(e) => updateField('description', e.target.value)}
                      placeholder="Например: производим выпечку, продаём в собственной пекарне и поставляем в кофейни"
                      rows={4}
                    />
                    <span className="mt-1.5 block text-[13px] leading-4 text-[rgba(3,3,6,0.55)]">
                      Расскажите, что вы продаёте или какие услуги оказываете и кто
                      ваши покупатели
                    </span>
                  </label>

                  <label className={fieldWrapClass}>
                    <span className={labelClass}>Контактное лицо</span>
                    <input
                      type="text"
                      className={fieldClass}
                      value={form.contactPerson}
                      onChange={(e) => updateField('contactPerson', e.target.value)}
                      autoComplete="off"
                    />
                  </label>

                  <label className={fieldWrapClass}>
                    <span className={labelClass}>Телефон</span>
                    <input
                      type="tel"
                      className={fieldClass}
                      value={form.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      autoComplete="off"
                    />
                  </label>

                  <label className={fieldWrapClass}>
                    <span className={labelClass}>Электронная почта</span>
                    <input
                      type="email"
                      className={fieldClass}
                      value={form.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      autoComplete="off"
                    />
                  </label>
                </div>

                {saveError ? (
                  <p className="mt-4 m-0 text-[14px] leading-5 text-[#ef3124]">
                    {saveError}
                  </p>
                ) : null}

                <div className={buttonRow}>
                  <button
                    type="button"
                    className={secondaryBtn}
                    disabled={saving}
                    onClick={() => setStep(1)}
                  >
                    Назад
                  </button>
                  <button
                    type="button"
                    className={primaryBtn}
                    disabled={saving}
                    onClick={() => void handleSaveStep2AndContinue()}
                  >
                    {saving ? 'Сохранение…' : 'Продолжить'}
                  </button>
                </div>
              </>
            ) : null}

            {step === 3 ? (
              <>
                <h2 className="m-0 text-[30px] font-bold leading-9 tracking-[0.1px] text-[rgba(3,3,6,0.88)]">
                  Дополнительные материалы
                </h2>
                <p className="mt-2 m-0 text-[16px] leading-6 tracking-[-0.24px] text-[rgba(3,3,6,0.62)]">
                  Можно приложить материалы, которые помогают понять деятельность
                  бизнеса. Для демонстрации загрузка необязательна
                </p>

                <div className="mt-8 rounded-[16px] border border-dashed border-[rgba(3,3,6,0.18)] bg-[rgba(38,55,88,0.04)] px-5 py-8 text-center">
                  <div
                    className="mx-auto flex size-12 items-center justify-center rounded-full bg-[rgba(15,25,55,0.08)] text-[22px] text-[rgba(3,3,6,0.55)]"
                    aria-hidden
                  >
                    ↑
                  </div>
                  <p className="mt-3 m-0 text-[15px] leading-5 text-[rgba(3,3,6,0.88)]">
                    Перетащите файл или выберите на устройстве
                  </p>
                  <input
                    ref={fileInputRef}
                    id={fileInputId}
                    type="file"
                    className="sr-only"
                    onChange={(e) => handleFilePick(e.target.files)}
                  />
                  <button
                    type="button"
                    className={`${secondaryBtn} mt-4 inline-flex w-auto flex-none px-5`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Выбрать файл
                  </button>
                  {selectedFileName ? (
                    <p className="mt-3 m-0 text-[13px] leading-4 text-[rgba(3,3,6,0.55)]">
                      Выбран: {selectedFileName}
                    </p>
                  ) : null}
                </div>

                <div className="mt-6">
                  <p className="m-0 text-[14px] font-medium leading-5 text-[rgba(3,3,6,0.88)]">
                    Категории материалов
                  </p>
                  <ul className="mt-2 m-0 flex list-none flex-wrap gap-2 p-0">
                    {documentCategories.map((category) => (
                      <li
                        key={category}
                        className="rounded-full bg-[rgba(15,25,55,0.08)] px-3 py-1.5 text-[13px] leading-4 text-[rgba(3,3,6,0.62)]"
                      >
                        {category}
                      </li>
                    ))}
                  </ul>
                </div>

                <ul className="mt-5 m-0 flex list-none flex-col gap-2 p-0">
                  {documents.length === 0 ? (
                    <li className="rounded-[12px] bg-[rgba(38,55,88,0.04)] px-4 py-3 text-[14px] text-[rgba(3,3,6,0.55)]">
                      Файлы не выбраны
                    </li>
                  ) : (
                    documents.map((doc) => (
                      <li
                        key={doc.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] bg-[rgba(38,55,88,0.04)] px-4 py-3"
                      >
                        <div>
                          <p className="m-0 text-[15px] font-medium leading-5 text-[rgba(3,3,6,0.88)]">
                            {doc.name}
                          </p>
                          <p className="mt-0.5 m-0 text-[13px] leading-4 text-[rgba(3,3,6,0.55)]">
                            Только в этом сеансе
                          </p>
                        </div>
                        <button
                          type="button"
                          className={ghostLink}
                          onClick={() => removeDocument(doc.id)}
                        >
                          Удалить
                        </button>
                      </li>
                    ))
                  )}
                </ul>

                <div className={buttonRow}>
                  <button
                    type="button"
                    className={secondaryBtn}
                    onClick={() => setStep(2)}
                  >
                    Назад
                  </button>
                  <button
                    type="button"
                    className={primaryBtn}
                    onClick={() => void handleFinishWizard()}
                  >
                    Завершить заполнение
                  </button>
                </div>
                <p className="mt-4 m-0 text-[13px] leading-4 text-[rgba(3,3,6,0.55)]">
                  В MVP материалы профиля не уходят на сервер
                </p>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  )
}
