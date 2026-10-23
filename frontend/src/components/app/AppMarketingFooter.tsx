import promoBg from '../../assets/app/footer-promo-bg.png'
import pinIcon from '../../assets/app/footer-pin-loc.svg'
import appIcon from '../../assets/app/footer-app-icon.png'
import langCn from '../../assets/app/footer-lang-cn.png'
import langEn from '../../assets/app/footer-lang-en.png'
import socialTelegram from '../../assets/app/footer-social-telegram.png'
import socialVk from '../../assets/app/footer-social-vkontakte.png'
import { legalLines, sitemapColumns, topColumns, topContact } from './footerData'

export function AppMarketingFooter() {
  return (
    <>
      {/* Sibling above footer; -mb-[206px] → bg starts 98px below promo top */}
      <div className="relative z-20 mx-auto -mb-[206px] h-[304px] w-[1140px] overflow-hidden rounded-[32px] bg-[#27272a]">
        <img
          src={promoBg}
          alt=""
          className="absolute inset-0 size-full object-cover"
          width={1140}
          height={304}
        />
        <div className="absolute left-8 top-8 z-10 max-w-[520px]">
          <p className="m-0 text-[40px] font-bold leading-[48px] tracking-[0.1px] text-white/94">
            Альфа‑Бизнес в&nbsp;смартфоне
          </p>
          <p className="mt-4 text-[16px] leading-6 tracking-[-0.24px] text-white/94">
            Всё для бизнеса&nbsp;— в&nbsp;одном приложении
          </p>
          <button
            type="button"
            className="mt-16 h-12 rounded-[10px] border-0 bg-white px-8 text-[16px] leading-5 tracking-[-0.05px] text-[rgba(3,3,6,0.88)]"
          >
            Скачайте приложение
          </button>
        </div>
      </div>

      <footer className="relative z-10 mx-auto w-full max-w-[1920px] rounded-t-[64px] bg-[#121213] pb-16 pt-[206px] text-white">
        {/* pt 206 clears promo overlap; +74 → «Малый бизнес» at y≈280 */}
        <div className="mx-auto mt-[74px] w-[1140px]">
          <p className="m-0 text-[14px] leading-5 tracking-[-0.08px] text-white/94">
            Малый бизнес и&nbsp;ИП
          </p>

          <div className="mt-6 flex gap-[51px]">
            <div className="w-[240px]">
              <p className="m-0 text-[12px] uppercase leading-4 tracking-[1.25px] text-[rgba(238,238,251,0.55)]">
                {topContact.title}
              </p>
              {topContact.rows.map((row) => (
                <div key={row.label} className="mt-3">
                  <p className="m-0 text-[12px] leading-4 tracking-[0.06px] text-[rgba(238,238,251,0.55)]">
                    {row.label}
                  </p>
                  <p className="m-0 mt-0.5 text-[14px] leading-5 tracking-[-0.08px] text-white/94">
                    {row.value}
                  </p>
                </div>
              ))}
            </div>

            {topColumns.map((col) => (
              <div key={col.title} className="w-[240px]">
                <p className="m-0 text-[12px] uppercase leading-4 tracking-[1.25px] text-[rgba(238,238,251,0.55)]">
                  {col.title}
                </p>
                <ul className="mt-3 list-none space-y-2 p-0">
                  {col.links.map((link) => (
                    <li key={link} className="text-[14px] leading-5 tracking-[-0.08px] text-white/94">
                      {link}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-[52px] flex gap-[51px]">
            <div className="w-[240px]">
              <p className="m-0 text-[12px] uppercase leading-4 tracking-[1.25px] text-[rgba(238,238,251,0.55)]">
                Местоположение
              </p>
              <p className="mt-3 flex items-center gap-1.5 text-[16px] leading-6 tracking-[-0.05px] text-white/94">
                <img src={pinIcon} alt="" className="size-[14px] shrink-0" width={14} height={14} />
                Москва
              </p>
            </div>

            <div className="w-[240px]">
              <p className="m-0 text-[12px] uppercase leading-4 tracking-[1.25px] text-[rgba(238,238,251,0.55)]">
                Скачать приложение
              </p>
              <div className="mt-3 flex h-8 items-center gap-2">
                <img
                  src={appIcon}
                  alt=""
                  className="size-8 rounded-[8px] object-cover"
                  width={32}
                  height={32}
                />
                <span className="text-[14px] leading-5 tracking-[-0.08px] text-white/94">
                  Альфа‑Бизнес
                </span>
              </div>
            </div>

            <div className="w-[240px]">
              <p className="m-0 text-[12px] uppercase leading-4 tracking-[1.25px] text-[rgba(238,238,251,0.55)]">
                Для иностранных клиентов
              </p>
              <div className="mt-3 flex h-8 items-center gap-3">
                <span className="flex items-center gap-2">
                  <img
                    src={langCn}
                    alt=""
                    className="size-8 rounded-[8px] object-cover"
                    width={32}
                    height={32}
                  />
                  <span className="text-[14px] leading-5 tracking-[-0.08px] text-white/94">中文</span>
                </span>
                <span className="flex items-center gap-2">
                  <img
                    src={langEn}
                    alt=""
                    className="size-8 rounded-[8px] object-cover"
                    width={32}
                    height={32}
                  />
                  <span className="text-[14px] leading-5 tracking-[-0.08px] text-white/94">Eng</span>
                </span>
              </div>
            </div>

            <div className="w-[240px]">
              <p className="m-0 text-[12px] uppercase leading-4 tracking-[1.25px] text-[rgba(238,238,251,0.55)]">
                Наши соцсети
              </p>
              <div className="mt-3 flex gap-2">
                <img
                  src={socialTelegram}
                  alt="Telegram"
                  className="size-8 rounded-[8px] object-cover"
                  width={32}
                  height={32}
                />
                <img
                  src={socialVk}
                  alt="VK"
                  className="size-8 rounded-[8px] object-cover"
                  width={32}
                  height={32}
                />
              </div>
            </div>
          </div>

          <div className="mt-10 h-px w-full bg-[#49494f]" />

          <div className="mt-8 flex gap-[51px]">
            {sitemapColumns.map((col, colIndex) => (
              <div key={`col-${colIndex}`} className="w-[240px]">
                {col.heading ? (
                  <p className="m-0 mb-[14px] text-[11.8px] font-bold uppercase leading-4 tracking-[1.25px] text-[rgba(233,233,250,0.37)]">
                    {col.heading}
                  </p>
                ) : (
                  <div className="mb-[14px] h-4" aria-hidden />
                )}
                {col.groups.map((group) => (
                  <div key={group.title} className="mb-[13px]">
                    <p className="m-0 text-[14px] leading-5 tracking-[-0.08px] text-white/94">
                      {group.title}
                    </p>
                    {group.links.length > 0 ? (
                      <ul className="mt-[3px] list-none space-y-[4px] p-0">
                        {group.links.map((link) => (
                          <li
                            key={link}
                            className="text-[11px] leading-4 tracking-[0.15px] text-white/56"
                          >
                            {link}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="mt-12 space-y-1 text-[12px] leading-[14px] text-[rgba(238,238,251,0.45)]">
            {legalLines.map((line) => (
              <p key={line.slice(0, 40)} className="m-0">
                {line}
              </p>
            ))}
          </div>
        </div>
      </footer>
    </>
  )
}
