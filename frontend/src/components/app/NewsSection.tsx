import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { getNews, type NewsFeed } from '../../api/news'
import { ghostLink } from './uiClasses'

function formatDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return iso
  return `${match[3]}.${match[2]}.${match[1]}`
}

export function NewsSection() {
  const [feed, setFeed] = useState<NewsFeed | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    void getNews()
      .then((data) => {
        if (!cancelled) setFeed(data)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message =
          err instanceof ApiError ? err.message : 'Не удалось загрузить новости'
        setError(message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="mt-12" aria-labelledby="news-heading">
      <h2
        id="news-heading"
        className="m-0 text-[28px] font-bold leading-9 tracking-[0.1px] text-[rgba(3,3,6,0.88)]"
      >
        Для вашего бизнеса
      </h2>

      {loading ? (
        <p className="mt-4 m-0 text-[14px] leading-5 text-[rgba(4,4,19,0.55)]">
          Загрузка подборки…
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 m-0 text-[14px] leading-5 text-[#ef3124]">{error}</p>
      ) : null}

      {!loading && !error && feed ? (
        <>
          {feed.personalized && (feed.industry || feed.region) ? (
            <p className="mt-3 m-0 text-[16px] leading-6 tracking-[-0.05px] text-[rgba(4,4,19,0.55)]">
              Подборка
              {feed.industry ? (
                <>
                  {' '}
                  по отрасли «{feed.industry}»
                </>
              ) : null}
              {feed.region ? (
                <>
                  {feed.industry ? ' и' : ' по'} региону «{feed.region}»
                </>
              ) : null}
            </p>
          ) : (
            <p className="mt-3 m-0 text-[16px] leading-6 tracking-[-0.05px] text-[rgba(4,4,19,0.55)]">
              Заполните «Мой бизнес», чтобы получать подборку по отрасли и
              региону.{' '}
              <Link to="/app/business" className={ghostLink}>
                Перейти в профиль
              </Link>
            </p>
          )}

          <div className="mt-6 grid grid-cols-3 gap-4">
            {feed.items.map((item) => (
              <article
                key={item.id}
                className="flex min-h-[180px] flex-col rounded-[12px] bg-white px-5 py-5"
              >
                <time
                  dateTime={item.published_at}
                  className="text-[12px] leading-4 tracking-[0.2px] text-[rgba(4,4,19,0.55)]"
                >
                  {formatDate(item.published_at)}
                </time>
                <h3 className="mt-3 m-0 text-[18px] font-bold leading-6 tracking-[0.1px] text-[rgba(3,3,6,0.88)]">
                  {item.title}
                </h3>
                <p className="mt-3 mb-0 flex-1 text-[14px] leading-5 tracking-[-0.08px] text-[rgba(4,4,19,0.55)]">
                  {item.summary}
                </p>
                <p className="mt-4 mb-0 text-[12px] leading-4 text-[rgba(4,4,19,0.45)]">
                  {item.source}
                </p>
              </article>
            ))}
          </div>

          <p className="mt-4 mb-0 text-[12px] leading-4 text-[rgba(4,4,19,0.45)]">
            Материалы демонстрационные, сгенерированы для прототипа
          </p>
        </>
      ) : null}
    </section>
  )
}
