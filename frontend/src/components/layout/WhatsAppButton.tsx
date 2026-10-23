import { useLocation } from 'react-router-dom'
import WhatsAppIcon from '../ui/WhatsAppIcon'
import { useWhatsApp } from '../../hooks/useShop'

// Floating WhatsApp shortcut: just the icon, in the corner, on tablets and larger screens. On
// phones it sits in the nav bar instead (see Header.tsx).
export default function WhatsAppButton() {
  const whatsapp = useWhatsApp()
  const { pathname } = useLocation()
  // Product pages have their own sticky WhatsApp + Add bar on phones.
  const onProductPage = pathname.startsWith('/product/')

  return (
    <a
      href={whatsapp("Hello! I'd like to order some flowers.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      title="WhatsApp"
      className={`fixed bottom-6 right-6 z-40 h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_12px_32px_-4px_rgba(12,10,9,0.3)] transition-transform hover:scale-105 ${
        onProductPage ? 'hidden lg:flex' : 'hidden sm:flex'
      }`}
    >
      <WhatsAppIcon size={28} />
    </a>
  )
}
