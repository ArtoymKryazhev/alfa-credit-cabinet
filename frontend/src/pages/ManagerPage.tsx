import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import {
  listManagerApplications,
  type ManagerApplicationListItem,
} from '../api/manager'
import { useAuth } from '../auth/AuthContext'
import {
  formatDateTime,
  formatMoney,
  STATUS_LABELS,
} from '../components/app/applicationLabels'
import { primaryBtn, surfaceCard } from '../components/app/uiClasses'
import { ManagerHeader } from '../components/manager/ManagerHeader'

export function ManagerPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [attentionOnly, setAttentionOnly] = useState(true)
  const [items, setItems] = useState<ManagerApplicationListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listManagerApplications(attentionOnly)
      setItems(data)
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Не удалось загрузить очередь'
      setError(message)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [attentionOnly])

  useEffect(() => {
    void load()
  }, [load])

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f2f3f5]">
      <ManagerHeader onLogout={() => void handleLogout()} />
      <main className="mx-auto flex w-full max-w-[960px] flex-1 flex-col px-8 py-12">
        <h1 className="m-0 text-3xl font-bold text-[rgba(3,3,6,0.88)]">
          Очередь заявок
        </h1>
        <p className="mt-2 mb-0 text-[16px] leading-6 text-[rgba(3,3,6,0.62)]">
          Кредитные заявки — ручное рассмотрение
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            className={
              attentionOnly
                ? `${primaryBtn} flex-none px-5`
                : 'inline-flex h-12 flex-none items-center justify-center rounded-[10px] border-0 bg-[rgba(15,25,55,0.1)] px-5 text-[16px] text-[rgba(3,3,6,0.88)]'
            }
            onClick={() => setAttentionOnly(true)}
          >
            Требуют внимания
          </button>
          <button
            type="button"
            className={
              !attentionOnly
                ? `${primaryBtn} flex-none px-5`
                : 'inline-flex h-12 flex-none items-center justify-center rounded-[10px] border-0 bg-[rgba(15,25,55,0.1)] px-5 text-[16px] text-[rgba(3,3,6,0.88)]'
            }
            onClick={() => setAttentionOnly(false)}
          >
            Все
          </button>
        </div>

        {loading ? (
          <p className="mt-10 m-0 text-[16px] text-[rgba(3,3,6,0.62)]">
            Загрузка очереди…
          </p>
        ) : null}

        {error ? (
          <div className={`mt-8 ${surfaceCard} px-8 py-8`}>
            <p className="m-0 text-[16px] text-[rgba(3,3,6,0.88)]">{error}</p>
            <button
              type="button"
              className={`${primaryBtn} mt-4 w-full max-w-[200px] flex-none`}
              onClick={() => void load()}
            >
              Повторить
            </button>
          </div>
        ) : null}

        {!loading && !error && items.length === 0 ? (
          <div className={`mt-8 ${surfaceCard} px-8 py-10`}>
            <p className="m-0 text-[16px] text-[rgba(3,3,6,0.62)]">
              {attentionOnly
                ? 'Нет заявок, требующих внимания'
                : 'Заявок пока нет'}
            </p>
          </div>
        ) : null}

        {!loading && !error && items.length > 0 ? (
          <ul className="mt-8 m-0 flex list-none flex-col gap-3 p-0">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  to={`/manager/applications/${item.id}`}
                  className={`${surfaceCard} flex flex-col gap-2 px-6 py-5 text-[rgba(3,3,6,0.88)] no-underline transition-shadow hover:shadow-md`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="m-0 text-[18px] font-bold leading-6">
                      {item.company_name ?? 'Компания'}
                    </p>
                    <span className="rounded-full bg-[rgba(38,55,88,0.08)] px-3 py-1 text-[13px]">
                      {STATUS_LABELS[item.status]}
                    </span>
                  </div>
                  <p className="m-0 text-[14px] text-[rgba(3,3,6,0.62)]">
                    {item.product_name}
                    {' · '}
                    {item.client_display_name}
                    {' · '}
                    {formatMoney(item.amount)}
                    {item.term_months != null
                      ? ` · ${item.term_months} мес.`
                      : ''}
                  </p>
                  <p className="m-0 text-[12px] text-[rgba(3,3,6,0.55)]">
                    Отправлена: {formatDateTime(item.submitted_at)}
                    {' · '}
                    ID {item.id.slice(0, 8)}…
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </main>
    </div>
  )
}
