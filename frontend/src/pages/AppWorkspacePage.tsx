import { AlfaIntellectBar } from '../components/app/AlfaIntellectBar'
import { AppHeader } from '../components/app/AppHeader'
import { AppMarketingFooter } from '../components/app/AppMarketingFooter'
import { OffersFireChip } from '../components/app/OffersFireChip'
import { OffersSection } from '../components/app/OffersSection'

export function AppWorkspacePage() {
  return (
    <div className="min-h-screen overflow-x-clip overflow-y-auto bg-[#0b0b0c]">
      <div className="app-desktop-artboard relative min-h-screen font-['Segoe_UI',system-ui,sans-serif]">
        <AppHeader />

        {/* Fire-chip: Figma X in centered 1920 column. Intellect: full-bleed. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30">
          <div className="relative mx-auto w-[1920px]">
            <div className="pointer-events-auto">
              <OffersFireChip />
            </div>
          </div>
        </div>
        <AlfaIntellectBar />

        {/* Full-bleed gray surface; footer capped at 1920 inside. 355px → promo. */}
        <div className="relative z-10 overflow-visible rounded-t-[60px] bg-[#f2f3f5]">
          <OffersSection />

          <div className="h-[355px]" aria-hidden />

          <AppMarketingFooter />
        </div>
      </div>
    </div>
  )
}
