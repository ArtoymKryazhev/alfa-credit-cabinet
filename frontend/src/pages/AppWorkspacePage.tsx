import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { AppHeader, type AppSection } from '../components/app/AppHeader'
import { ApplicationDetailSection } from '../components/app/ApplicationDetailSection'
import { ApplicationsListSection } from '../components/app/ApplicationsListSection'
import { AppMarketingFooter } from '../components/app/AppMarketingFooter'
import { MyBusinessSection } from '../components/app/MyBusinessSection'
import { OffersFireChip } from '../components/app/OffersFireChip'
import { OffersSection } from '../components/app/OffersSection'

function sectionFromPath(pathname: string): AppSection {
  if (pathname.startsWith('/app/applications')) return 'applications'
  if (pathname.startsWith('/app/business')) return 'business'
  return 'products'
}

export function AppWorkspacePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const params = useParams<{ id?: string }>()
  const section = sectionFromPath(location.pathname)

  function handleSectionChange(next: AppSection) {
    if (next === 'business') {
      navigate('/app/business')
      return
    }
    if (next === 'applications') {
      navigate('/app/applications')
      return
    }
    navigate('/app')
  }

  return (
    <div className="min-h-screen overflow-x-clip overflow-y-auto bg-[#0b0b0c]">
      <div className="app-desktop-artboard relative min-h-screen font-['Segoe_UI',system-ui,sans-serif]">
        <AppHeader activeSection={section} onSectionChange={handleSectionChange} />

        {section === 'products' ? (
          <>
            {/* Fire-chip: Figma X in centered 1920 column. Intellect: full-bleed dock outside. */}
            <div className="pointer-events-none absolute inset-x-0 top-0 z-30">
              <div className="relative mx-auto w-[1920px]">
                <div className="pointer-events-auto">
                  <OffersFireChip />
                </div>
              </div>
            </div>

            {/* Full-bleed gray surface; footer capped at 1920 inside. 388px → footer (Figma gap). */}
            <div className="relative z-10 overflow-visible rounded-t-[60px] bg-[#f2f3f5] pb-[53px]">
              <OffersSection />

              <div className="h-[388px]" aria-hidden />

              <AppMarketingFooter />
            </div>
          </>
        ) : null}

        {section === 'business' ? (
          <div className="relative z-10 min-h-[calc(100vh-92px)] overflow-visible rounded-t-[60px] bg-[#f2f3f5] pb-16">
            <MyBusinessSection />
          </div>
        ) : null}

        {section === 'applications' ? (
          <div className="relative z-10 min-h-[calc(100vh-92px)] overflow-visible rounded-t-[60px] bg-[#f2f3f5] pb-16">
            {params.id ? (
              <ApplicationDetailSection applicationId={params.id} />
            ) : (
              <ApplicationsListSection />
            )}
          </div>
        ) : null}
      </div>

    </div>
  )
}
