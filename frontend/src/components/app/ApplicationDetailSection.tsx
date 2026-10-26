import { useCallback, useEffect, useState } from 'react'
import {
  getApplication,
  type Application,
} from '../../api/applications'
import { ApiError } from '../../api/client'
import { ApplicationDraftWizard } from './ApplicationDraftWizard'
import { ApplicationStatusCard } from './ApplicationStatusCard'
import { primaryBtn, surfaceCard } from './uiClasses'

type ApplicationDetailSectionProps = {
  applicationId: string
}

export function ApplicationDetailSection({
  applicationId,
}: ApplicationDetailSectionProps) {
  const [application, setApplication] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getApplication(applicationId)
      setApplication(data)
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Не удалось загрузить заявку'
      setError(message)
      setApplication(null)
    } finally {
      setLoading(false)
    }
  }, [applicationId])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) {
    return (
      <section className="relative z-10 mx-auto w-[1140px] max-w-full pb-16 pt-[66px]">
        <p className="m-0 text-center text-[16px] text-[rgba(3,3,6,0.62)]">
          Загрузка заявки…
        </p>
      </section>
    )
  }

  if (error || !application) {
    return (
      <section className="relative z-10 mx-auto w-[1140px] max-w-full pb-16 pt-[66px]">
        <div className={`mx-auto mt-8 w-full max-w-[655px] ${surfaceCard} px-10 py-10 text-center`}>
          <p className="m-0 text-[16px] leading-6 text-[rgba(3,3,6,0.88)]">
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
      </section>
    )
  }

  if (application.status === 'draft') {
    return (
      <ApplicationDraftWizard
        application={application}
        onUpdated={setApplication}
      />
    )
  }

  return (
    <ApplicationStatusCard
      application={application}
      onUpdated={setApplication}
    />
  )
}
