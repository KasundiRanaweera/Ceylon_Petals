import { Link, useLocation } from 'react-router-dom'
import { MapPin, Phone, Mail, Clock, Sparkles, ArrowRight } from 'lucide-react'
import WhatsAppIcon from '../ui/WhatsAppIcon'
import { Reveal } from '../motion/Reveal'
import { Petals } from '../motion/Ambient'
import Logo from './Logo'
import { HELP_NAV, SHOP_NAV } from './navLinks'
import { useShop, useWhatsApp } from '../../hooks/useShop'
import { formatPhone } from '../../lib/phone'
import { SITE_IMAGES } from '../../data/siteImages'
import { sizedImage } from '../../lib/images'

export default function Footer() {
  const shop = useShop()
  const socials = [
    { label: 'Instagram', url: shop.instagramUrl },
    { label: 'Facebook', url: shop.facebookUrl },
    { label: 'TikTok', url: shop.tiktokUrl },
  ].filter((s) => s.url)
  const whatsapp = useWhatsApp()
  const { pathname } = useLocation()
  // Keep the checkout and login pages focused.
  const showCta = !['/checkout', '/sign-in', '/register'].includes(pathname) && !pathname.startsWith('/payment')

  return (
    <footer className="w-full border-t border-outline-variant/50 bg-surface pt-16 pb-24 sm:pb-8 text-on-surface-variant">
      <div className="max-w-7xl mx-auto px-4 lg:px-12">
        {showCta && (
          <Reveal className="relative mb-14 grid overflow-hidden rounded-2xl bg-ink-gradient text-white lg:grid-cols-[1.15fr_1fr]">
            <Petals color="#e9c349" />
            <div className="relative flex flex-col justify-center gap-6 px-6 py-10 sm:px-10 lg:py-14 lg:pl-14 lg:pr-8">
              <div className="max-w-xl space-y-2">
                <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-tertiary-fixed">
                  <Sparkles size={14} /> Not sure what to send?
                </p>
                <h2 className="font-display text-3xl leading-tight sm:text-4xl">Tell us who it's for — our florists will suggest something lovely.</h2>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href={whatsapp("Hello! Could you help me choose flowers?")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-sm bg-[#25D366] px-6 py-3 text-title-md text-primary hover:bg-[#1EBE5D]"
                >
                  <WhatsAppIcon size={18} /> Ask on WhatsApp
                </a>
                <Link to="/custom-order" className="inline-flex items-center justify-center gap-2 rounded-sm bg-white/12 px-6 py-3 text-title-md text-white ring-1 ring-white/25 backdrop-blur-md hover:bg-white/20">
                  Custom order <ArrowRight size={17} />
                </Link>
              </div>
            </div>
            {/* our florist's hands at work: below the words on phones, beside them on large screens */}
            <div className="relative h-56 sm:h-72 lg:h-auto">
              <img
                src={sizedImage(SITE_IMAGES.floristAtWork, 960)}
                alt="A florist's hands arranging pink and cream roses"
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,#2e2d2d_0%,rgba(46,45,45,0)_35%)] lg:bg-[linear-gradient(90deg,#2e2d2d_0%,rgba(46,45,45,0)_30%)]" />
            </div>
          </Reveal>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          <div className="space-y-4">
            <Logo />
            <p className="text-body-sm leading-relaxed text-on-surface-variant">
              Fresh flowers, hampers and plants, hand-arranged in Colombo and delivered with care across Sri Lanka.
            </p>
            <a
              href={whatsapp('Hello! I have a question.')}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Message ${shop.shopName} on WhatsApp`}
              title="WhatsApp"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366] text-primary transition-colors hover:bg-[#1EBE5D]"
            >
              <WhatsAppIcon size={22} />
            </a>
            {socials.length > 0 && (
              // The owner adds these in Admin -> Settings -> Storefront.
              <ul className="flex flex-wrap gap-2" aria-label="Follow us">
                {socials.map((s) => (
                  <li key={s.label}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[44px] items-center rounded-full border border-outline-variant bg-white/70 px-4 text-label-md text-primary transition-colors hover:border-primary hover:bg-primary hover:text-on-primary"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="mb-5 text-[13px] font-medium uppercase tracking-[0.22em] text-on-surface-variant">Shop</h3>
            <ul className="space-y-2 text-body-sm">
              {SHOP_NAV.slice(0, 7).map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="inline-flex min-h-9 items-center hover:text-tertiary transition-colors sm:min-h-0">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-5 text-[13px] font-medium uppercase tracking-[0.22em] text-on-surface-variant">Help</h3>
            <ul className="space-y-2 text-body-sm">
              {HELP_NAV.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="inline-flex min-h-9 items-center hover:text-tertiary transition-colors sm:min-h-0">{link.label}</Link>
                </li>
              ))}
              <li>
                <Link to="/custom-order" className="inline-flex min-h-9 items-center hover:text-tertiary transition-colors sm:min-h-0">Bulk & corporate orders</Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3 text-body-sm">
            <h3 className="mb-5 text-[13px] font-medium uppercase tracking-[0.22em] text-on-surface-variant">Visit or call</h3>
            <p className="flex items-start gap-2"><MapPin size={16} className="text-primary mt-0.5 shrink-0" />{shop.address}</p>
            <p className="flex items-center gap-2">
              <Phone size={16} className="text-primary shrink-0" />
              <a href={`tel:${shop.phone.replace(/\s/g, '')}`} className="hover:text-tertiary">{shop.phone}</a>
            </p>
            <p className="flex items-center gap-2">
              <WhatsAppIcon size={16} className="text-[#1a9e4b] shrink-0" />
              <a href={whatsapp('Hello! I have a question.')} target="_blank" rel="noopener noreferrer" className="hover:text-tertiary">
                {formatPhone(shop.whatsappNumber)}
              </a>
            </p>
            <p className="flex items-center gap-2">
              <Mail size={16} className="text-primary shrink-0" />
              <a href={`mailto:${shop.email}`} className="hover:text-tertiary">{shop.email}</a>
            </p>
            <p className="flex items-center gap-2"><Clock size={16} className="text-primary shrink-0" />{shop.openingHours}</p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-outline-variant/70 pt-6 text-[12px] uppercase tracking-[0.16em] text-outline md:flex-row">
          <p>© {new Date().getFullYear()} {shop.shopName}. All rights reserved.</p>
          <div className="flex items-center gap-5 normal-case tracking-normal text-[13px]">
            <Link to="/privacy" className="inline-flex min-h-9 items-center hover:text-tertiary sm:min-h-0">Privacy & terms</Link>
            <Link to="/refund-policy" className="inline-flex min-h-9 items-center hover:text-tertiary sm:min-h-0">Refund policy</Link>
            <Link to="/admin/login" className="inline-flex min-h-9 items-center hover:text-tertiary sm:min-h-0">Owner login</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
