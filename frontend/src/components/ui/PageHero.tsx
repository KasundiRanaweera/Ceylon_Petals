import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import Breadcrumbs, { type Crumb } from './Breadcrumbs'
import AnimatedTitle from '../motion/AnimatedTitle'
import { Blobs } from '../motion/Ambient'
import { fadeUp, scaleIn, staggerContainer, withDelay } from '../motion/variants'
import { sizedImage } from '../../lib/images'

export interface HeroBadge {
  icon: LucideIcon
  label: string
}

export interface HeroImage {
  src: string
  alt: string
  /** Portrait for story pages; landscape keeps shopping pages short. */
  shape?: 'portrait' | 'landscape'
  caption?: { eyebrow: string; title: string; text?: string }
}

interface PageHeroProps {
  breadcrumbs: Crumb[]
  title: string
  /** Part of the title shown in italic accent colour. */
  highlight?: string
  eyebrow?: string
  eyebrowIcon?: LucideIcon
  subtitle?: ReactNode
  actions?: ReactNode
  badges?: HeroBadge[]
  image?: HeroImage
  /** Right-hand panel when there's no image (e.g. the same-day countdown). */
  aside?: ReactNode
  /** Full-width content under the hero text, e.g. category pills. */
  children?: ReactNode
  tone?: 'light' | 'dark'
  /** A full-width photo behind the words, under a soft cream wash (the Stitch page-opening style). */
  backdrop?: { src: string; alt: string }
  size?: 'compact' | 'feature'
}

// The one hero every storefront page uses, so pages open the same way: breadcrumb, eyebrow,
// headline that rises word by word, supporting text, actions — and an optional photo that
// drifts slightly as you scroll.
export default function PageHero({
  breadcrumbs,
  title,
  highlight,
  eyebrow,
  eyebrowIcon: EyebrowIcon,
  subtitle,
  actions,
  badges,
  image,
  aside,
  children,
  tone = 'light',
  size = 'feature',
  backdrop,
}: PageHeroProps) {
  const dark = !backdrop && tone === 'dark'
  const hasSide = !backdrop && Boolean(image || aside)
  const compact = size === 'compact'

  return (
    <section
      className={`relative w-full overflow-hidden ${
        dark ? 'bg-ink-gradient text-on-primary' : 'bg-aurora'
      } ${backdrop ? 'text-center' : ''}`}
    >
      {backdrop ? (
        <>
          <img src={backdrop.src} alt={backdrop.alt} fetchPriority="high" className="absolute inset-0 h-full w-full object-cover" />
          {/* the cream wash keeps the mauve title readable over any photo */}
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-surface/80 via-surface/62 to-surface/90" />
        </>
      ) : (
        <Blobs tone={tone} />
      )}

      <div className={`relative max-w-7xl mx-auto px-4 lg:px-12 ${compact ? 'pt-5 pb-8 lg:pb-10' : 'pt-5 pb-10 lg:pb-14'}`}>
        <motion.div initial="hidden" animate="show" variants={fadeUp}>
          <Breadcrumbs items={breadcrumbs} tone={tone} />
        </motion.div>

        <div className={`grid grid-cols-1 gap-10 items-center ${compact ? 'mt-4 lg:mt-6' : 'mt-5 lg:mt-8'} ${hasSide ? 'lg:grid-cols-12' : ''}`}>
          <motion.div
            className={`space-y-4 ${hasSide ? 'lg:col-span-7' : backdrop ? 'mx-auto max-w-3xl py-10 lg:py-16 [&>*]:justify-center [&>*]:mx-auto' : 'max-w-4xl'}`}
            initial="hidden"
            animate="show"
            variants={staggerContainer(0.1, 0.05)}
          >
            {eyebrow && (
              <motion.div variants={fadeUp}>
                {/* the small tag above the title (a soft blush pill, as in the Stitch design) */}
                <span
                  className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-1.5 text-[12px] font-semibold tracking-[0.12em] ${
                    dark ? 'bg-white/10 text-[#e9c349]' : 'bg-primary-fixed text-tertiary'
                  }`}
                >
                  {EyebrowIcon && <EyebrowIcon size={13} />}
                  {eyebrow}
                </span>
              </motion.div>
            )}

            <AnimatedTitle
              text={title}
              highlight={highlight}
              delay={0.15}
              className={`font-display tracking-tight ${
                compact ? 'text-[34px] leading-[1.05] lg:text-[56px]' : 'text-[38px] leading-[1.02] md:text-6xl lg:text-[clamp(3.5rem,8.5svh,4.75rem)] lg:leading-[0.98]'
              } ${dark ? 'text-white' : 'text-mauve'}`}
              highlightClassName={dark ? 'italic text-[#e9c349]' : 'italic text-tertiary'}
            />

            {subtitle && (
              <motion.div variants={fadeUp} className={`max-w-2xl text-body-md lg:text-body-lg ${dark ? 'text-white/80' : 'text-on-surface-variant'}`}>
                {subtitle}
              </motion.div>
            )}

            {actions && (
              <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3 pt-2">
                {actions}
              </motion.div>
            )}

            {badges && badges.length > 0 && (
              <motion.ul variants={staggerContainer(0.06)} className="flex flex-wrap gap-2 pt-2">
                {badges.map(({ icon: Icon, label }) => (
                  <motion.li
                    key={label}
                    variants={fadeUp}
                    className={`inline-flex items-center gap-2 border-l py-0.5 pl-3 pr-4 text-[12px] font-medium uppercase tracking-[0.14em] ${
                      dark ? 'border-tertiary-fixed-dim/60 text-white/85' : 'border-tertiary/60 text-on-surface-variant'
                    }`}
                  >
                    <Icon size={15} className={dark ? 'text-tertiary-fixed' : 'text-primary'} />
                    {label}
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </motion.div>

          {image && !backdrop && (
            <motion.div className="relative hidden lg:col-span-5 lg:block" initial="hidden" animate="show" variants={withDelay(scaleIn, 0.2)}>
              <div className={`relative mx-auto ${image.shape === 'landscape' ? 'max-w-xl lg:max-w-[min(100%,calc((100svh-330px)*1.33))] lg:ml-auto' : 'max-w-sm lg:ml-auto lg:mr-0 lg:max-w-[min(25rem,calc(100svh-330px))]'}`}>
                {/* Thin gradient frame around a crisp, un-dimmed photo. */}
                {/* Crisp, un-dimmed photo with a hairline gold frame offset behind it. */}
                <div className="relative">
                <span aria-hidden="true" className="absolute -right-3 -top-3 bottom-3 left-3 border border-[#d4af37]/60" />
                <div className={`relative overflow-hidden rounded-sm bg-surface-container shadow-[0_30px_60px_-30px_rgba(12,10,9,0.55)] ${image.shape === 'landscape' ? 'aspect-[4/3]' : 'aspect-square'}`}>
                  <motion.img
                    src={sizedImage(image.src, 1408)}
                    alt={image.alt}
                    className="h-full w-full object-cover"
                  />
                </div>
                </div>
                {image.caption && (
                  <p className={`mt-5 flex items-baseline gap-3 border-b pb-3 ${dark ? 'border-white/15' : 'border-outline-variant'}`}>
                    <span className={`font-display text-[14px] italic ${dark ? 'text-tertiary-fixed-dim' : 'text-tertiary'}`}>Fig.</span>
                    <span>
                      <span className={`font-display text-[19px] ${dark ? 'text-white' : 'text-primary'}`}>{image.caption.title}</span>
                      {image.caption.text && <span className={`ml-2 text-body-sm ${dark ? 'text-white/60' : 'text-secondary'}`}>— {image.caption.text}</span>}
                    </span>
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {!image && !backdrop && aside && (
            <motion.div className="lg:col-span-5 flex lg:justify-end" initial="hidden" animate="show" variants={withDelay(fadeUp, 0.3)}>
              {aside}
            </motion.div>
          )}
        </div>

        {children && (
          <motion.div initial="hidden" animate="show" variants={withDelay(fadeUp, 0.35)} className="mt-8">
            {children}
          </motion.div>
        )}
      </div>
    </section>
  )
}
