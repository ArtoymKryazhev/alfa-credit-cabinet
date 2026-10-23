import heroAcquiring from '../../assets/start/hero-acquiring.png'
import heroBenefit from '../../assets/start/hero-benefit.png'
import heroCredit from '../../assets/start/hero-credit.png'
import heroEarn from '../../assets/start/hero-earn.png'
import heroRegister from '../../assets/start/hero-register.png'

export function StartHeroCards() {
  return (
    <div className="absolute inset-x-0 top-0 h-[786px] bg-[#0b0b0c]">
      {/* Large earn card */}
      <div
        className="absolute left-[390px] top-[144px] h-[418px] w-[849px] overflow-hidden rounded-[32px] bg-[#fcb1a7]"
      >
        <img src={heroEarn} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute left-8 top-[29px] text-[47.8px] font-bold leading-[52px] tracking-[0.1px] text-[rgba(3,3,6,0.88)]">
          <p className="m-0">Заработайте</p>
          <p className="m-0">на&nbsp;Альфа-Банке</p>
        </div>
        <button
          type="button"
          className="absolute bottom-8 left-8 h-12 rounded-[10px] bg-[#ef3124] px-6 text-base text-[rgba(255,255,255,0.94)]"
        >
          Узнать подробнее
        </button>
      </div>

      {/* Credit card */}
      <div className="absolute left-[1263px] top-[144px] h-[273px] w-[267px] overflow-hidden rounded-[32px] bg-[#b6cbff]">
        <img src={heroCredit} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-x-8 top-8 text-center text-[22px] font-bold leading-[26px] tracking-[0.2px] text-[rgba(255,255,255,0.94)]">
          <p className="m-0">Кредит</p>
          <p className="m-0">с&nbsp;господдержкой</p>
          <p className="m-0 mt-0">до&nbsp;50&nbsp;млн&nbsp;₽</p>
        </div>
      </div>

      {/* Acquiring card */}
      <div className="absolute left-[1263px] top-[441px] h-[273px] w-[267px] overflow-hidden rounded-[32px] bg-[#9df2f5]">
        <img src={heroAcquiring} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-x-8 top-8 text-center text-[21.8px] font-bold leading-[26px] tracking-[0.2px] text-[rgba(3,3,6,0.88)]">
          Эквайринг от&nbsp;1%
        </div>
      </div>

      {/* Free register */}
      <div className="absolute left-[390px] top-[586px] h-32 w-[412px] overflow-hidden rounded-[32px] bg-[#bff0a8]">
        <img src={heroRegister} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute left-8 top-[38px] text-[22px] font-bold leading-[26px] tracking-[0.2px] text-[rgba(3,3,6,0.88)]">
          <p className="m-0">Бесплатная</p>
          <p className="m-0">регистрация бизнеса</p>
        </div>
      </div>

      {/* Benefit */}
      <div className="absolute left-[826px] top-[586px] h-32 w-[412px] overflow-hidden rounded-[32px] bg-[#ffe5c7]">
        <img src={heroBenefit} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute left-8 top-[38px] text-[20.6px] font-bold leading-[26px] tracking-[0.2px] text-[rgba(3,3,6,0.88)]">
          <p className="m-0">Больше выгоды&nbsp;—</p>
          <p className="m-0">на&nbsp;старте</p>
        </div>
      </div>
    </div>
  )
}
