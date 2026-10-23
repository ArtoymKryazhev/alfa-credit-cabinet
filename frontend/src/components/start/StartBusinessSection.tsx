import bizAccount from '../../assets/start/biz-account.png'
import bizAcquiring from '../../assets/start/biz-acquiring.png'
import bizCredits from '../../assets/start/biz-credits.png'
import bizRegister from '../../assets/start/biz-register.png'

const cards = [
  {
    src: bizRegister,
    title: (
      <>
        Регистрация
        <br />
        бизнеса
      </>
    ),
    subtitle: 'Онлайн за\u00a00\u202f₽',
    left: 390,
  },
  {
    src: bizAccount,
    title: 'Расчётный счёт',
    subtitle: 'Бесплатно',
    left: 681,
  },
  {
    src: bizCredits,
    title: 'Кредиты',
    subtitle: 'На развитие бизнеса',
    left: 972,
  },
  {
    src: bizAcquiring,
    title: 'Эквайринг',
    subtitle: 'Комиссия от\u00a01%',
    left: 1263,
  },
] as const

export function StartBusinessSection() {
  return (
    <section className="absolute inset-x-0 top-[786px] h-[463px] bg-[#f2f3f5]">
      <h2 className="absolute left-[390px] top-[72px] m-0 text-[40px] font-bold leading-[48px] text-[rgba(3,3,6,0.88)]">
        Лучшее для бизнеса
      </h2>

      <div className="absolute left-[1155.31px] top-[72px] flex h-[52px] w-[374.69px] items-center rounded-full bg-[#e7e8ea] p-0.5">
        <div className="flex h-12 flex-1 items-center justify-center rounded-full bg-[#121213] text-[16px] leading-[19px] text-white/95">
          Малому бизнесу
        </div>
        <div className="flex h-12 flex-1 items-center justify-center text-[16px] leading-[19px] text-[rgba(3,3,6,0.88)]">
          Крупному бизнесу
        </div>
      </div>

      <p className="absolute left-[390px] top-[156px] m-0 text-base leading-6 text-[rgba(3,3,6,0.88)]">
        Для компаний с&nbsp;оборотом до&nbsp;500&nbsp;млн&nbsp;₽ в&nbsp;год
      </p>

      {cards.map((card) => (
        <div
          key={card.left}
          className="absolute top-[204px] h-[298px] w-[267px] overflow-hidden rounded-[32px] bg-[#f2f3f5]"
          style={{ left: card.left }}
        >
          <img src={card.src} alt="" className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-x-8 top-8 text-center text-[22px] font-bold leading-[26px] tracking-[0.2px] text-[rgba(3,3,6,0.88)]">
            {card.title}
          </div>
          <div className="absolute inset-x-8 top-[92px] text-center text-base leading-6 tracking-[-0.24px] text-[rgba(3,3,6,0.88)]">
            {card.subtitle}
          </div>
        </div>
      ))}
    </section>
  )
}
