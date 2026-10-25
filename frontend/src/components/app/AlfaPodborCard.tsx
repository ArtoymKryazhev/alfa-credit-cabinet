import chevronIcon from '../../assets/app/icon-chevron.svg'
import clockIcon from '../../assets/app/icon-clock.svg'

const tags = [
  { label: 'РЕКОМЕНДУЕМ', tone: 'green' },
  { label: 'ЛЬГОТНЫЕ КРЕДИТЫ', tone: 'dark' },
  { label: 'БАНКОВСКИЕ КРЕДИТЫ', tone: 'dark' },
] as const

const tagClass: Record<(typeof tags)[number]['tone'], string> = {
  green: 'bg-[#0cc44d]',
  dark: 'bg-[#2c2c2c]',
}

export function AlfaPodborCard() {
  return (
    <article className="relative flex h-[250px] w-full flex-col overflow-hidden rounded-[12px] bg-white px-6 pt-[25px] pb-[25px]">
      <div className="flex flex-wrap gap-2.5">
        {tags.map((tag) => (
          <span
            key={tag.label}
            className={`inline-flex h-[19px] items-center rounded px-2 text-[11px] font-bold leading-[15px] text-white/88 ${tagClass[tag.tone]}`}
          >
            {tag.label}
          </span>
        ))}
      </div>

      <h2 className="m-0 mt-[17px] max-w-[821px] text-[22px] font-bold leading-[29px] text-[rgba(3,3,6,0.88)]">
        Вместе с Альфа-Подбором вы найдете идеальное решение под ваш бизнес
      </h2>

      <p className="m-0 mt-[9px] text-[16px] font-semibold leading-[21px] text-[rgba(3,3,6,0.88)]">
        Бесплатно
      </p>

      <p className="m-0 mt-[21px] max-w-[819px] text-[14px] font-semibold leading-[19px] text-[rgba(3,3,6,0.55)]">
        Расскажите о своём деле — и мы подберём идеальный кредитный продукт с учётом ваших
        особенностей и задач бизнеса
      </p>

      <div className="mt-[25px] flex items-center gap-8">
        <button
          type="button"
          className="flex h-10 w-[171px] items-center gap-3 rounded-[10px] border-0 bg-[#e7e8eb] px-3"
        >
          <span className="text-[14px] font-semibold leading-[19px] tracking-[0.1px] text-[rgba(3,3,6,0.88)]">
            Заполнить анкету
          </span>
          <img
            src={chevronIcon}
            alt=""
            className="size-4 shrink-0 -rotate-90"
            width={16}
            height={16}
          />
        </button>

        <div className="flex items-center gap-2.5">
          <img src={clockIcon} alt="" className="size-[14px]" width={14} height={14} />
          <span className="text-[14px] font-semibold leading-[19px] tracking-[0.1px] text-[rgba(3,3,6,0.88)]">
            ~ 2-3 минуты
          </span>
        </div>
      </div>
    </article>
  )
}
