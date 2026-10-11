import { useRef, type PointerEvent } from 'react'
import { Link } from 'react-router-dom'
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react'
import { ArrowRight, ChevronDown, PenLine, Star, Truck } from 'lucide-react'
import WhatsAppIcon from '../ui/WhatsAppIcon'
import { EASE_OUT, fadeUp, staggerContainer, pressable } from '../motion/variants'
import { useWhatsApp } from '../../hooks/useShop'

const MotionLink = motion.create(Link)

// Full-width wall of pink peonies (CC0, Mira Bozhko via Wikimedia Commons), stored at
// 1280 / 1920 / 2560 px so it stays sharp edge to edge. A soft cream glow in the centre keeps
// the words clear. To use your own licensed photo, save it as flower-wall-1280/1920/2560.webp
// in public/images/hero.
const HERO_PHOTO = '/images/hero/flower-wall'

const TRUST = [
  { icon: Truck, label: 'Same-day in Colombo', filled: false },
  { icon: PenLine, label: 'Free handwritten card', filled: false },
  { icon: Star, label: 'Freshness guaranteed', filled: true },
]

// Petals drifting at different depths. `depth` scales how far each one moves with the pointer,
// so near petals glide more than far ones — a simple, convincing 3D parallax.
const PETALS = [
  { left: '30%', top: '16%', size: 14, depth: 0.3, color: '#f4c6cf', delay: 0 },
  { left: '68%', top: '12%', size: 18, depth: 0.6, color: '#f7d3c4', delay: 1.4 },
  { left: '24%', top: '74%', size: 22, depth: 0.9, color: '#f4c6cf', delay: 0.6 },
  { left: '74%', top: '70%', size: 16, depth: 0.5, color: '#e7c873', delay: 2.2 },
  { left: '50%', top: '90%', size: 12, depth: 0.2, color: '#f7d3c4', delay: 3 },
]

function Petal({ p, mx, my }: { p: (typeof PETALS)[number]; mx: MotionValue<number>; my: MotionValue<number> }) {
  const x = useTransform(mx, (v) => v * 70 * p.depth)
  const y = useTransform(my, (v) => v * 45 * p.depth)
  return (
    <motion.span aria-hidden="true" className="pointer-events-none absolute" style={{ left: p.left, top: p.top, x, y }}>
      <motion.svg
        width={p.size}
        height={p.size}
        viewBox="0 0 24 24"
        style={{ filter: p.depth > 0.8 ? 'blur(1.2px)' : undefined, opacity: 0.55 + p.depth * 0.4, transformPerspective: 400 }}
        animate={{ y: [0, -20, 0], rotateX: [0, 180, 360], rotateY: [0, 120, 360], rotateZ: [0, 40, 0] }}
        transition={{ duration: 9 + p.depth * 4, repeat: Infinity, ease: 'easeInOut', delay: p.delay }}
      >
        <path d="M12 2C7 6 5 11 7 16c1.2 3 3 5 5 6 2-1 3.8-3 5-6 2-5 0-10-5-14z" fill={p.color} />
      </motion.svg>
    </motion.span>
  )
}

// Each word flips up into place around its bottom edge, like a card turning towards you.
function FlipWords({ text, delay, className = '' }: { text: string; delay: number; className?: string }) {
  const words = text.split(' ')
  return (
    <span className={`inline-block ${className}`}>
      {words.map((word, i) => (
        <span key={i} className="inline-block whitespace-nowrap">
          <motion.span
            className="inline-block origin-bottom"
            initial={{ rotateX: -95, opacity: 0, y: 18 }}
            animate={{ rotateX: 0, opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: delay + i * 0.12, ease: EASE_OUT }}
            style={{ transformPerspective: 900 }}
          >
            {word}
          </motion.span>
          {i < words.length - 1 && ' '}
        </span>
      ))}
    </span>
  )
}

// The flower wall, in layers of motion:
//  1. it settles in from a gentle zoom,
//  2. then slowly "breathes" — a long, endless zoom-and-pan (Ken Burns), so the flowers feel alive,
//  3. it drifts against the pointer for depth,
//  4. and a soft band of sunlight passes across it every few seconds.
// The source is 2560 px wide, so the slow zoom never makes it look soft.
function FlowerWall({ mx, my, lift, still }: { mx: MotionValue<number>; my: MotionValue<number>; lift: MotionValue<number>; still: boolean }) {
  const x = useTransform(mx, (v) => v * -24)
  const y = useTransform(my, (v) => v * -16)
  return (
    <motion.div className="absolute -inset-8 -z-20 overflow-hidden" style={{ y: lift }}>
      <motion.div className="h-full w-full" style={{ x, y }}>
        <motion.div
          className="h-full w-full"
          // Visible from the very first frame (no fade-in), then it slowly breathes.
          initial={false}
          animate={still ? { scale: 1 } : { scale: [1, 1.07, 1], x: ['0%', '-1.5%', '0%'], y: ['0%', '-1%', '0%'] }}
          transition={still ? { duration: 0 } : { duration: 30, ease: 'easeInOut', repeat: Infinity }}
        >
          <img
            src={`${HERO_PHOTO}-1920.webp`}
            srcSet={`${HERO_PHOTO}-1280.webp 1280w, ${HERO_PHOTO}-1920.webp 1920w, ${HERO_PHOTO}-2560.webp 2560w`}
            sizes="100vw"
            alt="A wall of soft pink peonies"
            fetchPriority="high"
            loading="eager"
            decoding="sync"
            className="h-full w-full object-cover"
          />
        </motion.div>
      </motion.div>
      {/* Sunlight sweep */}
      {!still && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-16deg] bg-gradient-to-r from-transparent via-white/35 to-transparent mix-blend-soft-light"
          initial={{ x: '0%' }}
          animate={{ x: '520%' }}
          transition={{ duration: 4.5, delay: 2, ease: 'easeInOut', repeat: Infinity, repeatDelay: 6 }}
        />
      )}
    </motion.div>
  )
}

export default function Hero() {
  const whatsapp = useWhatsApp()
  const reduce = useReducedMotion()

  // ---- Pointer position across the hero, -0.5 … 0.5, smoothed with a spring ----
  const section = useRef<HTMLElement>(null)
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const mx = useSpring(rawX, { stiffness: 60, damping: 18 })
  const my = useSpring(rawY, { stiffness: 60, damping: 18 })
  function onMove(e: PointerEvent<HTMLElement>) {
    if (e.pointerType !== 'mouse' || reduce || !section.current) return
    const r = section.current.getBoundingClientRect()
    rawX.set((e.clientX - r.left) / r.width - 0.5)
    rawY.set((e.clientY - r.top) / r.height - 0.5)
  }
  function onLeave() {
    rawX.set(0)
    rawY.set(0)
  }

  // ---- Scroll: the words lift away faster than the flowers ----
  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end start'] })
  const wordsLift = useTransform(scrollYProgress, [0, 1], [0, -110])
  const photoLift = useTransform(scrollYProgress, [0, 1], [0, 60])

  // ---- Magnetic "Shop Flowers" button ----
  const magX = useSpring(0, { stiffness: 200, damping: 15 })
  const magY = useSpring(0, { stiffness: 200, damping: 15 })
  function magnet(e: PointerEvent<HTMLAnchorElement>) {
    if (e.pointerType !== 'mouse' || reduce) return
    const r = e.currentTarget.getBoundingClientRect()
    magX.set((e.clientX - r.left - r.width / 2) * 0.25)
    magY.set((e.clientY - r.top - r.height / 2) * 0.35)
  }

  return (
    // Fills the first screen exactly: the viewport minus the sticky header (101px phone, 109px desktop).
    <section
      ref={section}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="relative isolate flex h-[calc(100svh-101px)] min-h-[600px] overflow-hidden bg-[#f3d9df] text-primary lg:h-[calc(100svh-109px)] lg:max-h-[900px] lg:min-h-[600px]"
    >
      {/* ---- Full-width flower wall ---- */}
      <FlowerWall mx={mx} my={my} lift={photoLift} still={Boolean(reduce)} />
      {/* A soft cream glow behind the words, so they read clearly over the flowers. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_60%,rgba(250,244,238,0.96)_0%,rgba(250,244,238,0.88)_45%,rgba(250,244,238,0)_85%)] sm:bg-[radial-gradient(ellipse_46%_62%_at_50%_50%,rgba(250,244,238,0.96)_0%,rgba(250,244,238,0.88)_48%,rgba(250,244,238,0)_80%)]"
      />

      {!reduce && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-[5]">
          {PETALS.map((p, i) => (
            <Petal key={i} p={p} mx={mx} my={my} />
          ))}
        </div>
      )}

      {/* ---- Centred words ---- */}
      <div className="relative mx-auto flex w-full max-w-3xl items-end justify-center px-5 pb-24 pt-10 text-center sm:items-center sm:pb-10">
        <motion.div style={{ y: wordsLift }} initial="hidden" animate="show" variants={staggerContainer(0.1, 0.25)}>
          <motion.p variants={fadeUp} className="eyebrow flex items-center justify-center gap-3 font-bold text-[#7a4f05]">
            <span className="h-px w-6 bg-[#c8930a]/60 sm:w-8" aria-hidden="true" />
            <span><span className="hidden sm:inline">Ceylon Petals · </span>Sri Lankan Flower Studio</span>
            <span className="h-px w-6 bg-[#c8930a]/60 sm:w-8" aria-hidden="true" />
          </motion.p>

          <h1
            aria-label="Make Every Moment Bloom"
            className="mt-5 font-display text-[clamp(2.6rem,min(6.4vw,11vh),6rem)] leading-[1.04] tracking-[-0.02em] text-primary [text-shadow:0_2px_18px_rgba(255,250,244,0.9)]"
          >
            <span aria-hidden="true">
              <FlipWords text="Make Every" delay={0.4} className="block" />
              <span className="block whitespace-nowrap">
                <FlipWords text="Moment" delay={0.65} />{' '}
                <motion.em
                  className="text-gradient inline-block pr-2 font-normal italic"
                  initial={{ opacity: 0, rotateY: -70, x: -20, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, rotateY: 0, x: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 1.1, delay: 0.95, ease: EASE_OUT }}
                  style={{ transformPerspective: 900 }}
                >
                  Bloom
                </motion.em>
              </span>
            </span>
          </h1>

          <motion.p variants={fadeUp} className="mx-auto mt-5 max-w-xl text-[16px] font-medium leading-relaxed text-primary [text-shadow:0_1px_12px_rgba(255,250,244,0.95)] sm:text-[18px]">
            Thoughtfully arranged fresh flowers, elegant bouquets and meaningful gifts for birthdays, anniversaries,
            weddings and every special moment. Delivered with love across Sri Lanka.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-8 flex flex-col justify-center gap-3 min-[400px]:flex-row sm:gap-4">
            <MotionLink
              to="/shop"
              {...pressable}
              onPointerMove={magnet}
              onPointerLeave={() => {
                magX.set(0)
                magY.set(0)
              }}
              style={{ x: magX, y: magY }}
              className="btn-gradient inline-flex items-center justify-center gap-3 whitespace-nowrap px-7 py-4 shadow-[0_18px_40px_-16px_rgba(200,147,10,0.75)] sm:px-8"
            >
              Shop Flowers <ArrowRight size={16} />
            </MotionLink>
            <motion.a
              href={whatsapp("Hello Ceylon Petals! I'd like to order some flowers.")}
              target="_blank"
              rel="noopener noreferrer"
              {...pressable}
              className="inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-sm border border-outline-variant bg-white px-7 py-4 text-[14px] font-semibold uppercase tracking-[0.08em] text-primary shadow-sm transition-colors hover:border-primary hover:bg-primary hover:text-white sm:px-8"
            >
              <WhatsAppIcon size={18} className="text-[#1a9e4b]" /> Order on WhatsApp
            </motion.a>
          </motion.div>

          <motion.ul variants={fadeUp} className="mt-9 hidden flex-wrap items-center justify-center gap-3 sm:flex">
            {TRUST.map(({ icon: Icon, label, filled }) => (
              <li key={label} className="flex items-center gap-2 rounded-full bg-white/75 px-3 py-1.5 text-[14px] font-medium text-primary shadow-sm backdrop-blur-sm">
                <Icon size={16} className="text-tertiary" fill={filled ? 'currentColor' : 'none'} /> {label}
              </li>
            ))}
          </motion.ul>
        </motion.div>
      </div>

      {/* ---- Scroll cue ---- */}
      <motion.a
        href="#home-next"
        aria-label="Scroll to explore"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="absolute bottom-4 left-1/2 hidden -translate-x-1/2 text-primary/40 hover:text-primary lg:block"
      >
        <ChevronDown size={24} className="animate-bounce" />
      </motion.a>
    </section>
  )
}
