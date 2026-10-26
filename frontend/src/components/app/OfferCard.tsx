import type { Offer } from './offersData'

const badgeClass: Record<NonNullable<Offer['badge']>['tone'], string> = {
  green: 'bg-[#0cc44d]',
  orange: 'bg-[#fa9313]',
}

type OfferCardProps = {
  offer: Offer
  onApply?: (offer: Offer) => void
  applyBusy?: boolean
}

export function OfferCard({
  offer,
  onApply,
  applyBusy = false,
}: OfferCardProps) {
  const canApply = Boolean(offer.productCode)

  return (
    <article className="relative flex min-h-[250px] w-full items-center overflow-hidden rounded-[12px] bg-white px-6 py-[43px]">
      <div className="relative z-10 flex w-[calc(100%-328px)] max-w-[600px] flex-col">
        {offer.badge ? (
          <span
            className={`mb-4 inline-flex w-fit rounded px-2 py-0.5 text-[11px] font-bold uppercase leading-4 tracking-[0.54px] text-white/94 ${badgeClass[offer.badge.tone]}`}
          >
            {offer.badge.label}
          </span>
        ) : null}

        <h2 className="m-0 text-[22px] font-bold leading-[26px] tracking-[0.2px] text-[rgba(3,3,6,0.88)]">
          {offer.title}
        </h2>

        <div className="mt-3 flex flex-wrap items-center gap-x-0 text-[16px] font-medium leading-6 tracking-[-0.05px] text-[rgba(3,3,6,0.88)]">
          {offer.terms.map((term, index) => (
            <span key={term} className="flex items-center">
              {index > 0 ? (
                <span className="mx-2 inline-block size-[2px] rounded-full bg-[rgba(3,3,6,0.88)]" />
              ) : null}
              {term}
            </span>
          ))}
        </div>

        <p className="mt-5 mb-6 w-full text-[14px] leading-5 tracking-[-0.08px] text-[rgba(4,4,19,0.55)]">
          {offer.description}
        </p>

        <div className="flex items-center gap-8">
          {canApply ? (
            <button
              type="button"
              className="h-10 min-w-[88px] shrink-0 rounded-[10px] border-0 bg-[rgba(15,25,55,0.1)] px-5 text-[14px] font-medium leading-5 tracking-[0.07px] text-[rgba(3,3,6,0.88)] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={applyBusy}
              onClick={() => onApply?.(offer)}
            >
              {applyBusy ? 'Открытие…' : 'Оформить'}
            </button>
          ) : (
            <button
              type="button"
              className="h-10 min-w-[88px] shrink-0 cursor-not-allowed rounded-[10px] border-0 bg-[rgba(15,25,55,0.06)] px-5 text-[14px] font-medium leading-5 tracking-[0.07px] text-[rgba(3,3,6,0.45)]"
              disabled
              title="В демо недоступно"
            >
              В демо недоступно
            </button>
          )}
          <button
            type="button"
            className="border-0 bg-transparent text-[14px] font-medium leading-5 tracking-[0.07px] text-[rgba(3,3,6,0.88)]"
          >
            Все условия
          </button>
        </div>
      </div>

      <img
        src={offer.image}
        alt=""
        className="absolute right-[88px] top-[5px] size-[240px] object-contain"
        width={240}
        height={240}
      />
    </article>
  )
}
