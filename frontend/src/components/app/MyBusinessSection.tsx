import { useId, useRef, useState } from 'react'
import {
  activityOptions,
  businessProfileMock,
  partialFormDefaults,
  type ActivityOption,
  type DemoDocument,
} from './businessProfileMock'

type DemoPreset = 'empty' | 'partial' | 'filled'
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

const emptyForm: FormFields = {
  inn: '',
  activityDirection: '',
  description: '',
  contactPerson: '',
  phone: '',
  email: '',
}

const filledForm: FormFields = {
  inn: businessProfileMock.inn,
  activityDirection: businessProfileMock.activityDirection,
  description: businessProfileMock.description,
  contactPerson: businessProfileMock.contactPerson,
  phone: businessProfileMock.phone,
  email: businessProfileMock.email,
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

const demoBtnBase =
  'rounded-full border bg-transparent px-2.5 py-0.5 text-[12px] leading-4 transition-colors'
const demoBtnActive =
  'border-[#ef3124] text-[#ef3124]'
const demoBtnIdle =
  'border-[rgba(3,3,6,0.18)] text-[rgba(3,3,6,0.55)] hover:border-[rgba(3,3,6,0.35)] hover:text-[rgba(3,3,6,0.88)]'

const fieldClass =
  'mb-field mt-0 box-border h-14 w-full rounded-[10px] border-0 border-b-2 border-[#babbc2] bg-[rgba(38,55,88,0.06)] px-3 pb-2 pt-6 text-[16px] leading-5 tracking-[-0.24px] text-[rgba(3,3,6,0.88)] outline-none transition-[border-color,background-color] duration-200 placeholder:text-[rgba(4,4,19,0.55)] focus:border-[#ef3124]'
const textareaClass =
  'mb-field mt-0 box-border min-h-[120px] w-full resize-y rounded-[10px] border-0 border-b-2 border-[#babbc2] bg-[rgba(38,55,88,0.06)] px-3 pb-3 pt-6 text-[16px] leading-5 tracking-[-0.24px] text-[rgba(3,3,6,0.88)] outline-none transition-[border-color,background-color] duration-200 placeholder:text-[rgba(4,4,19,0.55)] focus:border-[#ef3124]'
const selectClass = `${fieldClass} mb-field-select appearance-none`
const labelClass =
  'pointer-events-none absolute left-3 top-2 text-[14px] leading-[17.5px] tracking-[-0.21px] text-[rgba(4,4,19,0.55)] transition-colors duration-200 group-focus-within:text-[#ef3124]'
const fieldWrapClass = 'group relative mt-5 block'
const primaryBtn =
  'inline-flex h-12 flex-1 items-center justify-center rounded-[10px] border-0 bg-[#ef3124] px-6 text-[16px] leading-5 tracking-[-0.05px] text-[rgba(255,255,255,0.94)] transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ef3124]'
const secondaryBtn =
  'inline-flex h-12 flex-1 items-center justify-center rounded-[10px] border-0 bg-[rgba(15,25,55,0.1)] px-6 text-[16px] leading-5 tracking-[-0.05px] text-[rgba(3,3,6,0.88)] transition-colors hover:bg-[rgba(15,25,55,0.16)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgba(15,25,55,0.4)]'
const ghostLink =
  'border-0 bg-transparent p-0 text-[14px] leading-5 text-[#ef3124] underline-offset-2 hover:underline'
const surfaceCard = 'rounded-[32px] bg-white'
const buttonRow = 'mt-6 flex w-full gap-2'

function CompanySummaryCard({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`rounded-[16px] bg-[rgba(38,55,88,0.04)] ${
        compact ? 'px-4 py-4' : 'px-5 py-5'
      }`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="m-0 text-[18px] font-bold leading-6 tracking-[0.1px] text-[rgba(3,3,6,0.88)]">
          {businessProfileMock.companyName}
        </h3>
        <span className="text-[12px] leading-4 tracking-[0.06px] text-[rgba(3,3,6,0.55)]">
          Демонстрационные данные
        </span>
      </div>
      <dl className="mt-4 m-0 grid gap-3 text-[14px] leading-5">
        <div className="flex flex-wrap gap-x-2">
          <dt className="m-0 text-[rgba(3,3,6,0.55)]">ИНН</dt>
          <dd className="m-0 text-[rgba(3,3,6,0.88)]">{businessProfileMock.inn}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="m-0 text-[rgba(3,3,6,0.55)]">Дата регистрации</dt>
          <dd className="m-0 text-[rgba(3,3,6,0.88)]">
            {businessProfileMock.registrationDate}
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="m-0 text-[rgba(3,3,6,0.55)]">Адрес регистрации</dt>
          <dd className="m-0 text-[rgba(3,3,6,0.88)]">{businessProfileMock.address}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="m-0 text-[rgba(3,3,6,0.55)]">Виды деятельности</dt>
          <dd className="m-0 text-[rgba(3,3,6,0.88)]">
            {businessProfileMock.activities}
          </dd>
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

  const [demoPreset, setDemoPreset] = useState<DemoPreset>('empty')
  const [viewMode, setViewMode] = useState<ViewMode>('wizard')
  const [step, setStep] = useState<WizardStep>(1)
  const [companyFound, setCompanyFound] = useState(false)
  const [form, setForm] = useState<FormFields>(emptyForm)
  const [documents, setDocuments] = useState<DemoDocument[]>([])
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)

  function applyPreset(preset: DemoPreset) {
    setDemoPreset(preset)
    setSelectedFileName(null)

    if (preset === 'empty') {
      setViewMode('wizard')
      setStep(1)
      setCompanyFound(false)
      setForm(emptyForm)
      setDocuments([])
      return
    }

    if (preset === 'partial') {
      setViewMode('partial-home')
      setStep(2)
      setCompanyFound(true)
      setForm({
        ...emptyForm,
        inn: businessProfileMock.inn,
        ...partialFormDefaults,
      })
      setDocuments([])
      return
    }

    setViewMode('profile')
    setStep(1)
    setCompanyFound(true)
    setForm(filledForm)
    setDocuments([...businessProfileMock.documents])
  }

  function updateField<K extends keyof FormFields>(key: K, value: FormFields[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function openEditCompany() {
    setForm(filledForm)
    setCompanyFound(true)
    setDocuments([...businessProfileMock.documents])
    setStep(1)
    setViewMode('wizard')
  }

  function openEditContacts() {
    setForm(filledForm)
    setCompanyFound(true)
    setDocuments([...businessProfileMock.documents])
    setStep(2)
    setViewMode('wizard')
  }

  function openEditDocuments() {
    setForm(filledForm)
    setCompanyFound(true)
    setDocuments((prev) =>
      prev.length > 0 ? prev : [...businessProfileMock.documents],
    )
    setStep(3)
    setViewMode('wizard')
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

  function addDemoDocument() {
    const nextIndex = documents.length + 1
    setDocuments((prev) => [
      ...prev,
      {
        id: `added-${Date.now()}`,
        name: `material-demo-${nextIndex}.pdf`,
        category: 'Примеры работ',
      },
    ])
  }

  const showStepper = viewMode === 'wizard'

  return (
    <section className="relative z-10 mx-auto w-[1140px] max-w-full pb-16 pt-[66px]">
      <div className="absolute left-0 top-4 flex flex-wrap items-center gap-1.5 text-[12px] leading-4 text-[rgba(3,3,6,0.45)]">
        <span className="mr-0.5">Демо-состояние:</span>
        {(
          [
            ['empty', 'Нет данных'],
            ['partial', 'Частично заполнено'],
            ['filled', 'Заполнено'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`${demoBtnBase} ${
              demoPreset === value ? demoBtnActive : demoBtnIdle
            }`}
            onClick={() => applyPreset(value)}
          >
            {label}
          </button>
        ))}
      </div>

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
          <div className="mt-6">
            <CompanySummaryCard compact />
          </div>
        </div>
      ) : null}

      {viewMode === 'done' ? (
        <div className={`mx-auto mt-12 w-full max-w-[655px] ${surfaceCard} px-10 py-14 text-center`}>
          <p className="m-0 text-[30px] font-bold leading-9 tracking-[0.1px] text-[rgba(3,3,6,0.88)]">
            Заполнение завершено
          </p>
          <p className="mt-3 m-0 text-[16px] leading-6 tracking-[-0.24px] text-[rgba(3,3,6,0.62)]">
            В прототипе сведения не сохраняются и заявка не отправляется
          </p>
          <button
            type="button"
            className={`${primaryBtn} mx-auto mt-8 w-full max-w-[320px] flex-none`}
            onClick={() => applyPreset('filled')}
          >
            Посмотреть заполненный профиль
          </button>
        </div>
      ) : null}

      {viewMode === 'profile' ? (
        <div className="mx-auto mt-12 flex w-full flex-col gap-4">
          <div className={`${surfaceCard} px-8 py-6`}>
            <p className="m-0 text-[22px] font-bold leading-[26px] tracking-[0.2px] text-[rgba(3,3,6,0.88)]">
              Сведения о бизнесе заполнены
            </p>
            <p className="mt-1 m-0 text-[14px] leading-5 text-[rgba(3,3,6,0.55)]">
              Демонстрационный профиль
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
              <ProfileField label="Название" value={businessProfileMock.companyName} />
              <ProfileField label="ИНН" value={businessProfileMock.inn} />
              <ProfileField
                label="Дата регистрации"
                value={businessProfileMock.registrationDate}
              />
              <ProfileField label="Адрес" value={businessProfileMock.address} />
              <div className="sm:col-span-2">
                <ProfileField
                  label="Виды деятельности"
                  value={businessProfileMock.activities}
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
                value={businessProfileMock.activityDirection}
              />
              <div className="sm:col-span-2">
                <ProfileField
                  label="Описание бизнеса"
                  value={businessProfileMock.description}
                />
              </div>
              <ProfileField
                label="Контактное лицо"
                value={businessProfileMock.contactPerson}
              />
              <ProfileField label="Телефон" value={businessProfileMock.phone} />
              <ProfileField label="Email" value={businessProfileMock.email} />
            </dl>
          </article>

          <article className={`${surfaceCard} px-8 py-8`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="m-0 text-[22px] font-bold leading-[26px] tracking-[0.2px] text-[rgba(3,3,6,0.88)]">
                Материалы
              </h2>
              <div className="flex flex-wrap gap-3">
                <button type="button" className={ghostLink} onClick={addDemoDocument}>
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
                        onChange={(e) => updateField('inn', e.target.value)}
                        placeholder="XXXXXXXXXX"
                        autoComplete="off"
                      />
                    </label>
                    <div className={buttonRow}>
                      <button
                        type="button"
                        className={primaryBtn}
                        onClick={() => {
                          setCompanyFound(true)
                          updateField('inn', businessProfileMock.inn)
                        }}
                      >
                        Найти компанию
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mt-8">
                      <CompanySummaryCard />
                    </div>
                    <p className="mt-6 m-0 text-[16px] font-medium leading-5 text-[rgba(3,3,6,0.88)]">
                      Это ваша компания?
                    </p>
                    <div className={buttonRow}>
                      <button
                        type="button"
                        className={primaryBtn}
                        onClick={() => setStep(2)}
                      >
                        Да, продолжить
                      </button>
                      <button
                        type="button"
                        className={secondaryBtn}
                        onClick={() => {
                          setCompanyFound(false)
                          updateField('inn', '')
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

                <div className={buttonRow}>
                  <button
                    type="button"
                    className={secondaryBtn}
                    onClick={() => setStep(1)}
                  >
                    Назад
                  </button>
                  <button
                    type="button"
                    className={primaryBtn}
                    onClick={() => {
                      setDocuments((prev) =>
                        prev.length > 0
                          ? prev
                          : [
                              {
                                id: 'demo-example',
                                name: 'presentation-demo.pdf',
                                category: 'Презентация компании',
                              },
                            ],
                      )
                      setStep(3)
                    }}
                  >
                    Продолжить
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
                            Добавлен в демо
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
                    onClick={() => setViewMode('done')}
                  >
                    Завершить заполнение
                  </button>
                </div>
                <p className="mt-4 m-0 text-[13px] leading-4 text-[rgba(3,3,6,0.55)]">
                  Демонстрационный режим: данные и файлы не сохраняются
                </p>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  )
}
