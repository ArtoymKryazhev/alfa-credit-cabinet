import intellectIcon from '../../assets/app/icon-intellect.svg'

export function AlfaIntellectBar() {
  return (
    <div className="pointer-events-auto absolute inset-x-0 top-[1172px] z-40">
      <div className="bg-[#e7e8eb] pt-1">
        <div className="relative flex h-[49px] items-center justify-between overflow-hidden rounded-t-[14px] bg-[#f2f3f5] px-1.5 shadow-[inset_0.7px_0.7px_1.4px_0_white]">
          <button type="button" className="flex h-[19px] w-[162px] items-center gap-2 px-1.5">
            <span className="relative flex size-[19px] items-center justify-center overflow-hidden rounded-[10px] bg-gradient-to-br from-[#ef3124] to-[#f859c5]">
              <img src={intellectIcon} alt="" className="size-[13px]" width={13} height={13} />
            </span>
            <span className="bg-gradient-to-r from-[#6868e9] to-[#904bff] bg-clip-text text-[12px] font-bold leading-4 tracking-[0.26px] text-transparent">
              Альфа-Интеллект
            </span>
          </button>

          <div className="absolute left-1/2 top-1/2 w-[842px] -translate-x-1/2 -translate-y-1/2">
            <div className="flex h-[38px] items-center rounded-full bg-white px-3">
              <span className="text-[11px] leading-normal tracking-[-0.16px] text-[rgba(4,4,19,0.55)]">
                Как копить баллы
              </span>
            </div>
          </div>

          <button
            type="button"
            className="ml-auto flex h-[38px] min-w-[142px] items-center justify-center rounded-full bg-[#212124] px-5 text-[11px] font-medium leading-[14px] text-white/94"
          >
            Связь с банком
          </button>
        </div>
      </div>
    </div>
  )
}
