import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  listApplications,
  type ApplicationListItem,
} from '../../api/applications'
import { ApiError } from '../../api/client'
import {
  formatDateTime,
  formatMoney,
  STATUS_BADGE_CLASS,
  STATUS_LABELS,
} from './applicationLabels'
import { primaryBtn, surfaceCard } from './uiClasses'

export function ApplicationsListSection() {
  const navigate = useNavigate()
  const [items, setItems] = useState<ApplicationListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listApplications()
      setItems(data)
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Не удалось загрузить заявки'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <section className="relative z-10 mx-auto w-[1140px] max-w-full pb-16 pt-[66px]">
      <h1 className="m-0 text-center text-[40px] font-bold leading-[48px] tracking-[0.1px] text-[rgba(3,3,6,0.88)]">
        Мои заявки
      </h1>
      <p className="mx-auto mt-3 mb-0 max-w-[640px] text-center text-[16px] leading-6 tracking-[-0.24px] text-[rgba(3,3,6,0.62)]">
        Черновики и отправленные заявки по кредитным продуктам
      </p>

      {loading ? (
        <p className="mx-auto mt-12 mb-0 text-center text-[16px] text-[rgba(3,3,6,0.62)]">
          Загрузка…
        </p>
      ) : null}

      {error ? (
        <div className={`mx-auto mt-12 w-full max-w-[655px] ${surfaceCard} px-10 py-10 text-center`}>
          <p className="m-0 text-[16px] leading-6 text-[rgba(3,3,6,0.88)]">{error}</p>
          <button
            type="button"
            className={`${primaryBtn} mx-auto mt-6 w-full max-w-[240px] flex-none`}
            onClick={() => void load()}
          >
            Повторить
          </button>
        </div>
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <div className={`mx-auto mt-12 w-full max-w-[655px] ${surfaceCard} px-10 py-14 text-center`}>
          <p className="m-0 text-[22px] font-bold leading-[26px] text-[rgba(3,3,6,0.88)]">
            Заявок пока нет
          </p>
          <p className="mt-3 m-0 text-[16px] leading-6 text-[rgba(3,3,6,0.62)]">
            Оформите оборотный кредит на витрине продуктов
          </p>
          <Link
            to="/app"
            className={`${primaryBtn} mx-auto mt-8 inline-flex w-full max-w-[320px] flex-none no-underline`}
          >
            К кредитным продуктам
          </Link>
        </div>
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <ul className="mx-auto mt-12 m-0 flex w-full max-w-[900px] list-none flex-col gap-4 p-0">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={`${surfaceCard} flex w-full flex-col gap-2 border-0 px-8 py-6 text-left transition-shadow hover:shadow-[0_8px_24px_rgba(15,25,55,0.08)]`}
                onClick={() => navigate(`/app/applications/${item.id}`)}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[18px] font-bold leading-6 text-[rgba(3,3,6,0.88)]">
                    {item.product_name}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-[13px] font-medium ${STATUS_BADGE_CLASS[item.status]}`}
                  >
                    {STATUS_LABELS[item.status]}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-[14px] leading-5 text-[rgba(3,3,6,0.62)]">
                  <span>Сумма: {formatMoney(item.amount)}</span>
                  <span>
                    Срок:{' '}
                    {item.term_months != null ? `${item.term_months} мес.` : '—'}
                  </span>
                  <span>Обновлено: {formatDateTime(item.updated_at)}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
