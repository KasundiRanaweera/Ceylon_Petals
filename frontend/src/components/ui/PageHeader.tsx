import type { ReactNode } from 'react'
import PageHero from './PageHero'
import type { Crumb } from './Breadcrumbs'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  subtitle?: ReactNode
  breadcrumbs: Crumb[]
  aside?: ReactNode
  backdrop?: { src: string; alt: string }
}

// Compact hero for utility pages (cart, checkout, account, help pages). Same look as the big heroes.
export default function PageHeader(props: PageHeaderProps) {
  return <PageHero size="compact" {...props} />
}
