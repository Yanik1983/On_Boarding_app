import type { Station } from '../../content/schema'
import { CompanyExplorer } from './CompanyExplorer'
import { CredoExplorer } from './CredoExplorer'
import { DivisionsExplorer } from './DivisionsExplorer'
import { FinishExplorer } from './FinishExplorer'
import { OrganizationExplorer } from './OrganizationExplorer'
import { ProductsExplorer } from './ProductsExplorer'
import { SiteExplorer } from './SiteExplorer'
import { TechnologyExplorer } from './TechnologyExplorer'
import { WelcomeExplorer } from './WelcomeExplorer'

export function Explorer({ station }: { station: Station }) {
  switch (station.kind) {
    case 'welcome':
      return <WelcomeExplorer station={station} />
    case 'company':
      return <CompanyExplorer station={station} />
    case 'credo':
      return <CredoExplorer station={station} />
    case 'divisions':
      return <DivisionsExplorer station={station} />
    case 'organization':
      return <OrganizationExplorer station={station} />
    case 'technology':
      return <TechnologyExplorer station={station} />
    case 'products':
      return <ProductsExplorer station={station} />
    case 'site':
      return <SiteExplorer station={station} />
    case 'finish':
      return <FinishExplorer station={station} />
  }
}
