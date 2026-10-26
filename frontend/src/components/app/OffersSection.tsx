import { Fragment, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { openApplication } from '../../api/applications'
import chevronIcon from '../../assets/app/icon-chevron.svg'
import { AlfaPodborCard } from './AlfaPodborCard'
import { NewsSection } from './NewsSection'
import { OfferCard } from './OfferCard'
import { offers, type Offer } from './offersData'

const filters = ['Сумма', 'Обеспечение', 'Цель'] as const

export function OffersSection() {
  const navigate = useNavigate()
  const [busyOfferId, setBusyOfferId] = useState<string | null>(null)
  const [applyError, setApplyError] = useState<string | null>(null)

  async function handleApply(offer: Offer) {
    if (!offer.productCode) return
    setApplyError(null)
    setBusyOfferId(offer.id)
    try {
      const application = await openApplication(offer.productCode)
      navigate(`/app/applications/${application.id}`)
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Не удалось открыть заявку'
      setApplyError(message)
    } finally {
      setBusyOfferId(null)
    }
  }

  return (
    <section className="relative z-10 mx-auto w-[1074px] pt-[22px]">
      <div className="px-[50px]">
        <h1 className="m-0 text-[40px] font-bold leading-[48px] tracking-[0.1px] text-[rgba(3,3,6,0.88)]">
          Кредитные предложения
        </h1>

        <div className="mt-8 flex gap-2">
          {filters.map((label) => (
            <button
              key={label}
              type="button"
              className="flex h-10 items-center gap-0.5 rounded-[10px] border-0 bg-[rgba(15,25,55,0.1)] px-3 text-[14px] leading-5 tracking-[-0.08px] text-[rgba(3,3,6,0.88)]"
            >
              <span className="px-1">{label}</span>
              <img src={chevronIcon} alt="" className="size-4" width={16} height={16} />
            </button>
          ))}
        </div>

        {applyError ? (
          <p className="mt-4 m-0 text-[14px] leading-5 text-[#ef3124]">{applyError}</p>
        ) : null}

        <div className="mt-6 flex flex-col gap-6">
          <AlfaPodborCard />
          {offers.map((offer, index) => (
            <Fragment key={offer.id}>
              <OfferCard
                offer={offer}
                onApply={(item) => void handleApply(item)}
                applyBusy={busyOfferId === offer.id}
              />
              {(index + 1) % 4 === 0 ? <AlfaPodborCard /> : null}
            </Fragment>
          ))}
        </div>

        <NewsSection />
      </div>
    </section>
  )
}
