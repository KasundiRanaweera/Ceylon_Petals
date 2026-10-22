import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Pause, Play } from 'lucide-react'
import { EASE_OUT } from '../motion/variants'

// A short film of one of our bouquets being made by hand, from loose stems to the wrapped dome,
// shown after the "Hand-tied for every moment" section. How the film is made, and where its files
// go, is in docs/HERO-FILM.md.
//
// - Phones get the upright (9:16) cut, larger screens the wide (16:9) one; the choice is made once.
// - It plays silently on a loop only while it is on screen, and has a pause button (anything moving
//   for more than five seconds must be pausable). With reduced motion it waits for a tap on play.
// - Until the film files exist, or if they fail to load, the section is not shown at all.

const FILM = {
  wide: '/videos/bouquet-making.mp4',
  tall: '/videos/bouquet-making-mobile.mp4',
  poster: '/videos/bouquet-making-poster.jpg',
  posterTall: '/videos/bouquet-making-mobile-poster.jpg',
}

export default function BouquetFilm() {
  const reduce = useReducedMotion()
  const box = useRef<HTMLElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const [tall] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  // one quiet retry before giving up, so a brief network hiccup doesn't hide the film
  const retried = useRef(false)
  const [playing, setPlaying] = useState(false)
  // the visitor pressed pause: don't start again by itself when scrolled back into view
  const pausedByVisitor = useRef(false)

  // play while on screen, pause when scrolled away (saves battery and data)
  useEffect(() => {
    const el = box.current
    const v = video.current
    if (!el || !v || reduce) return
    const watch = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !pausedByVisitor.current) v.play().catch(() => {})
        else if (!entry?.isIntersecting) v.pause()
      },
      { threshold: 0.35 },
    )
    watch.observe(el)
    return () => watch.disconnect()
  }, [reduce, ready])

  function toggle() {
    const v = video.current
    if (!v) return
    if (v.paused) {
      pausedByVisitor.current = false
      v.play().catch(() => {})
    } else {
      pausedByVisitor.current = true
      v.pause()
    }
  }

  if (failed) return null

  return (
    <section
      ref={box}
      aria-label="How we make a hand-tied bouquet"
      // stays out of the layout until the film has loaded, so a missing file never leaves a gap
      className={ready ? 'bg-surface px-4 pb-14 lg:px-12 lg:pb-20' : 'h-0 overflow-hidden'}
    >
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={ready ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.9, ease: EASE_OUT }}
        className="relative mx-auto aspect-[9/16] max-h-[62svh] w-full max-w-[300px] overflow-hidden rounded-[1.5rem] bg-[#e9dccb] shadow-[0_40px_80px_-40px_rgba(107,90,96,0.55)] md:aspect-video md:max-h-none md:max-w-3xl"
      >
        <video
          ref={video}
          className="absolute inset-0 h-full w-full object-cover"
          src={tall ? FILM.tall : FILM.wide}
          poster={tall ? FILM.posterTall : FILM.poster}
          muted
          loop
          playsInline
          preload="metadata"
          aria-label="A florist's hands arrange blush and cerise roses with baby's breath, then wrap the bouquet in layered blush paper"
          onLoadedMetadata={() => setReady(true)}
          onError={() => {
            if (retried.current) return setFailed(true)
            retried.current = true
            setTimeout(() => video.current?.load(), 1500)
          }}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
        {/* a soft fade at the foot, so the caption reads on any frame */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-[linear-gradient(to_top,rgba(43,42,42,0.55),transparent)]" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4 sm:p-6">
          <p className="max-w-sm text-[14px] leading-relaxed text-white/95 sm:text-[15px]">
            <span className="mb-1 block text-[12px] font-medium uppercase tracking-[0.22em] text-[#f3d9a4]">From our studio</span>
            Every stem chosen, placed and wrapped by hand in Colombo, the morning it goes out.
          </p>
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? 'Pause the film' : 'Play the film'}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/85 text-[#2b2a2a] backdrop-blur transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {playing ? <Pause size={18} /> : <Play size={18} className="translate-x-px" />}
          </button>
        </div>
      </motion.div>
    </section>
  )
}
