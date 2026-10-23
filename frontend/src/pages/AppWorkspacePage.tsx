import { AlfaIntellectBar } from '../components/app/AlfaIntellectBar'
import { AppHeader } from '../components/app/AppHeader'
import { AppMarketingFooter } from '../components/app/AppMarketingFooter'
import { OffersFireChip } from '../components/app/OffersFireChip'
import { OffersSection } from '../components/app/OffersSection'

export function AppWorkspacePage() {
  return (
    <div className="min-h-screen overflow-auto bg-[#0b0b0c]">
      <div className="relative mx-auto min-h-screen w-[1920px] font-['Segoe_UI',system-ui,sans-serif]">
        <AppHeader />
        <OffersFireChip />
        <AlfaIntellectBar />

        {/* Header in-flow. Fire-chip / intellect — absolute (Figma Y). 355px → promo. */}
        <div className="relative z-10 overflow-visible rounded-t-[60px] bg-[#f2f3f5]">
          <OffersSection />

          <div className="h-[355px]" aria-hidden />

          <AppMarketingFooter />
        </div>
      </div>
    </div>
  )
}
