import { useState } from 'react'
import {
  answerClarification,
  downloadAttachment,
  type Application,
  type Clarification,
} from '../../api/applications'
import { ApiError } from '../../api/client'
import { formatDateTime } from './applicationLabels'
import {
  fieldWrapClass,
  labelClass,
  primaryBtn,
  secondaryBtn,
  surfaceCard,
  textareaClass,
} from './uiClasses'

const MAX_FILE_BYTES = 5 * 1024 * 1024
const ACCEPT = '.pdf,.png,.jpg,.jpeg'

type ClarificationsPanelProps = {
  application: Application
  /** When true, show answer form for open clarification. */
  allowAnswer?: boolean
  onUpdated?: (application: Application) => void
}

function ClarificationItem({ item }: { item: Clarification }) {
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  async function handleDownload() {
    if (!item.attachment) return
    setDownloading(true)
    setDownloadError(null)
    try {
      await downloadAttachment(item.attachment)
    } catch (err) {
      setDownloadError(
        err instanceof ApiError ? err.message : 'Не удалось скачать файл',
      )
    } finally {
      setDownloading(false)
    }
  }

  return (
    <li className="rounded-[12px] bg-[rgba(38,55,88,0.04)] px-4 py-3">
      <p className="m-0 text-[13px] text-[rgba(3,3,6,0.55)]">Вопрос менеджера</p>
      <p className="mt-1 m-0 text-[15px] text-[rgba(3,3,6,0.88)]">{item.question}</p>
      <p className="mt-1 m-0 text-[12px] text-[rgba(3,3,6,0.55)]">
        {formatDateTime(item.created_at)}
      </p>

      {item.status === 'answered' ? (
        <div className="mt-3 border-t border-[rgba(38,55,88,0.08)] pt-3">
          <p className="m-0 text-[13px] text-[rgba(3,3,6,0.55)]">Ответ клиента</p>
          <p className="mt-1 m-0 text-[15px] text-[rgba(3,3,6,0.88)]">
            {item.answer_text || '—'}
          </p>
          {item.answered_at ? (
            <p className="mt-1 m-0 text-[12px] text-[rgba(3,3,6,0.55)]">
              {formatDateTime(item.answered_at)}
            </p>
          ) : null}
          {item.attachment ? (
            <button
              type="button"
              className={`${secondaryBtn} mt-3 h-10 flex-none px-4 text-[14px]`}
              disabled={downloading}
              onClick={() => void handleDownload()}
            >
              Скачать: {item.attachment.filename}
            </button>
          ) : null}
          {downloadError ? (
            <p className="mt-2 m-0 text-[13px] text-[#ef3124]">{downloadError}</p>
          ) : null}
        </div>
      ) : (
        <p className="mt-3 m-0 text-[13px] text-[rgba(3,3,6,0.55)]">
          Ожидается ответ клиента
        </p>
      )}
    </li>
  )
}

export function ClarificationsPanel({
  application,
  allowAnswer = false,
  onUpdated,
}: ClarificationsPanelProps) {
  const clarifications = application.clarifications ?? []
  const openItem = clarifications.find((item) => item.status === 'open')
  const showForm =
    allowAnswer &&
    application.status === 'clarification_requested' &&
    openItem != null

  const [answerText, setAnswerText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (clarifications.length === 0 && !showForm) {
    return null
  }

  async function handleSubmit() {
    const text = answerText.trim()
    if (text.length < 1) {
      setError('Укажите текст ответа')
      return
    }
    if (file && file.size > MAX_FILE_BYTES) {
      setError('Размер файла не должен превышать 5 МБ')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const updated = await answerClarification(application.id, text, file)
      setAnswerText('')
      setFile(null)
      onUpdated?.(updated)
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Не удалось отправить ответ',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className={`${surfaceCard} px-8 py-8`}>
      <h2 className="m-0 text-[18px] font-bold leading-6 text-[rgba(3,3,6,0.88)]">
        Уточнения
      </h2>

      {clarifications.length > 0 ? (
        <ul className="mt-5 m-0 flex list-none flex-col gap-3 p-0">
          {clarifications.map((item) => (
            <ClarificationItem key={item.id} item={item} />
          ))}
        </ul>
      ) : null}

      {showForm ? (
        <div className="mt-6">
          <div className={fieldWrapClass}>
            <label className={labelClass} htmlFor="clarification-answer">
              Ваш ответ
            </label>
            <textarea
              id="clarification-answer"
              className={textareaClass}
              value={answerText}
              onChange={(event) => setAnswerText(event.target.value)}
              rows={3}
              disabled={busy}
            />
          </div>
          <div className="mt-4">
            <label
              className="m-0 block text-[13px] text-[rgba(3,3,6,0.55)]"
              htmlFor="clarification-file"
            >
              Файл (необязательно, pdf / png / jpg, до 5 МБ)
            </label>
            <input
              id="clarification-file"
              type="file"
              accept={ACCEPT}
              className="mt-2 block w-full text-[14px] text-[rgba(3,3,6,0.88)]"
              disabled={busy}
              onChange={(event) => {
                const next = event.target.files?.[0] ?? null
                setFile(next)
                setError(null)
              }}
            />
            {file ? (
              <p className="mt-1 m-0 text-[13px] text-[rgba(3,3,6,0.55)]">
                Выбран: {file.name}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className={`${primaryBtn} mt-4 w-full max-w-[240px] flex-none`}
            disabled={busy}
            onClick={() => void handleSubmit()}
          >
            Отправить ответ
          </button>
          {error ? (
            <p className="mt-3 m-0 text-[14px] text-[#ef3124]">{error}</p>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}
