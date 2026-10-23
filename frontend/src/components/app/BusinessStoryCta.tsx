import chevronIcon from '../../assets/app/icon-chevron.svg'

export function BusinessStoryCta() {
  return (
    <button
      type="button"
      className="flex h-10 w-[314px] items-center rounded-[10px] border-0 bg-[#e7e8eb] pl-3 pr-3"
    >
      <span className="text-[14px] font-semibold leading-[19px] tracking-[0.1px] text-[rgba(3,3,6,0.88)]">
        Расскажите про свой бизнес
      </span>
      <span className="ml-auto mr-2 flex h-[22px] w-12 shrink-0 items-center justify-center rounded-[5px] bg-[#0cc44d] text-[14px] font-semibold leading-[19px] text-white">
        +10б
      </span>
      <img src={chevronIcon} alt="" className="size-4 shrink-0 -rotate-90" width={16} height={16} />
    </button>
  )
}
