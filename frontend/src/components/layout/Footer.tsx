import { Link, useLocation } from 'react-router-dom'
import { MapPin, Phone, Mail, Clock, Sparkles, ArrowRight } from 'lucide-react'
import WhatsAppIcon from '../ui/WhatsAppIcon'
import { Reveal } from '../motion/Reveal'
import { Petals } from '../motion/Ambient'
import Logo from './Logo'
import { HELP_NAV, SHOP_NAV } from './navLinks'
import { useShop, useWhatsApp } from '../../hooks/useShop'
import { formatPhone } from '../../lib/phone'

export default function Footer() {
  const shop = useShop()
  const whatsapp = useWhatsApp()
  const { pathname } = useLocation()
  // Keep the checkout and login pages focused.
  const showCta = !['/checkout', '/sign-in', '/register'].includes(pathname) && !pathname.startsWith('/payment')

  return (
    <footer className="w-full bg-surface-container-low pt-14 pb-24 sm:pb-6 text-on-surface-variant">
      <div className="max-w-7xl mx-auto px-4 lg:px-12">
        {showCta && (
          <Reveal className="relative mb-14 overflow-hidden rounded-2xl bg-ink-gradient px-6 py-10 text-white sm:px-10 lg:px-14">
            <Petals color="#e7c873" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
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
          </Reveal>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          <div className="space-y-4">
            <Logo />
            <p className="text-body-sm text-secondary leading-relaxed">
              Fresh flowers, hampers and plants, hand-arranged in Colombo and delivered with care across Sri Lanka.
            </p>
            <a
              href={whatsapp('Hello! I have a question.')}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Message Ceylon Petals on WhatsApp"
              title="WhatsApp"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366] text-primary transition-colors hover:bg-[#1EBE5D]"
            >
              <WhatsAppIcon size={22} />
            </a>
          </div>

          <div>
            <h3 className="font-display text-headline-sm text-primary mb-4">Shop</h3>
            <ul className="space-y-2 text-body-sm">
              {SHOP_NAV.slice(0, 7).map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="hover:text-primary transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-headline-sm text-primary mb-4">Help</h3>
            <ul className="space-y-2 text-body-sm">
              {HELP_NAV.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="hover:text-primary transition-colors">{link.label}</Link>
                </li>
              ))}
              <li>
                <Link to="/custom-order" className="hover:text-primary transition-colors">Bulk & corporate orders</Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3 text-body-sm">
            <h3 className="font-display text-headline-sm text-primary mb-4">Visit or call</h3>
            <p className="flex items-start gap-2"><MapPin size={16} className="text-primary mt-0.5 shrink-0" />{shop.address}</p>
            <p className="flex items-center gap-2">
              <Phone size={16} className="text-primary shrink-0" />
              <a href={`tel:${shop.phone.replace(/\s/g, '')}`} className="hover:text-primary">{shop.phone}</a>
            </p>
            <p className="flex items-center gap-2">
              <WhatsAppIcon size={16} className="text-[#1a9e4b] shrink-0" />
              <a href={whatsapp('Hello! I have a question.')} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                {formatPhone(shop.whatsappNumber)}
              </a>
            </p>
            <p className="flex items-center gap-2">
              <Mail size={16} className="text-primary shrink-0" />
              <a href={`mailto:${shop.email}`} className="hover:text-primary">{shop.email}</a>
            </p>
            <p className="flex items-center gap-2"><Clock size={16} className="text-primary shrink-0" />{shop.openingHours}</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-2 pt-4 border-t border-surface-container text-body-sm text-secondary">
          <p>© {new Date().getFullYear()} {shop.shopName}. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[12px]">
            <Link to="/privacy" className="hover:text-primary">Privacy & terms</Link>
            <Link to="/refund-policy" className="hover:text-primary">Refund policy</Link>
            <Link to="/admin/login" className="hover:text-primary">Owner login</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
