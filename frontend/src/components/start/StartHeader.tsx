import alfaLogo from '../../assets/icon-alfa-logo.svg'
import heartGif from '../../assets/gif-heart.gif'
import searchIcon from '../../assets/icon-search.svg'

export function StartHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-10 h-[104px]">
      <img
        src={alfaLogo}
        alt="Альфа-Банк"
        className="absolute left-[390px] top-[32px] h-10 w-7"
        width={28}
        height={40}
      />

      <nav className="absolute left-[458px] top-10 flex items-center gap-0 text-[16px] leading-6 text-white/90">
        <span className="w-[155.5px]">Частным лицам</span>
        <span className="w-[204.45px]">Малому бизнесу и&nbsp;ИП</span>
        <span>Среднему и&nbsp;крупному бизнесу</span>
      </nav>

      <button
        type="button"
        className="absolute left-[1082.61px] top-8 flex h-8 w-6 items-center justify-center"
        aria-label="Поиск"
      >
        <img src={searchIcon} alt="" className="h-6 w-6" width={24} height={24} />
      </button>

      <img
        src={heartGif}
        alt=""
        className="absolute left-[1240.13px] top-[34px] h-8 w-11"
        width={44}
        height={32}
      />

      <button
        type="button"
        className="absolute left-[1284.13px] top-8 h-10 rounded-[10px] bg-transparent px-5 text-[14px] leading-5 text-white/90"
      >
        Онлайн-заявки
      </button>

      <button
        type="button"
        className="absolute left-[1442px] top-8 h-10 w-[88px] rounded-[10px] bg-[#ef3124] text-[16px] leading-5 text-white/95"
      >
        Войти
      </button>
    </header>
  )
}
