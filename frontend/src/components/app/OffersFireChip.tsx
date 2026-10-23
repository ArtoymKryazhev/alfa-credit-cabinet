import fireIcon from '../../assets/icon-fire.png'

export function OffersFireChip() {
  return (
    <button
      type="button"
      className="absolute left-[1222px] top-[149px] z-30 flex h-8 w-[229px] items-center justify-center rounded-full border-0 bg-white pb-[6px] pl-[15px] pr-[19px] pt-1.5 text-[14px] font-medium leading-5 tracking-[0.07px] text-[rgba(3,3,6,0.88)]"
    >
      <img src={fireIcon} alt="" className="mr-1.5 size-4 object-contain" width={16} height={16} />
      Кредитные предложения
    </button>
  )
}
