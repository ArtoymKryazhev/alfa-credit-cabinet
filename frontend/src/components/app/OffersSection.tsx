import chevronIcon from '../../assets/app/icon-chevron.svg'
import { OfferCard } from './OfferCard'
import { offers } from './offersData'

const filters = ['Сумма', 'Обеспечение', 'Цель'] as const

export function OffersSection() {
  return (
    <section className="relative z-10 mx-auto w-[1074px] pt-[22px]">
      <div className="px-[50px]">
        <h1 className="m-0 text-[40px] font-bold leading-[48px] tracking-[0.1px] text-[rgba(3,3,6,0.88)]">
          Кредитные предложения
        </h1>

        <div className="mt-14 flex gap-2">
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

        <div className="mt-6 flex flex-col gap-6">
          {offers.map((offer, index) => (
            <OfferCard key={offer.id} offer={offer} showBusinessCta={index === 0} />
          ))}
        </div>
      </div>
    </section>
  )
}
