import { useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowRight, Check, ChevronDown, Heart, Volume2, VolumeX } from "lucide-react";

/* ────────────────────────────────────────────────────────────
   Personal content — everything you need to edit lives here.
   ──────────────────────────────────────────────────────────── */

const HER_NAME = "Famidha A";
const YOUR_NAME = "Wahid";

const PHOTO_SRC = "/her-photo.jpg";
// Which part of the photo stays in frame when it's cropped ("x% y%").
// Lower the second number if her face is near the top of the picture.
const PHOTO_FOCUS = "48% 30%";

const MUSIC_SRC = "/music.mp3"; // optional — just drop the file into /public

// Where her address is sent from the gift box at the very end (opens her mail app).
const GIFT_EMAIL = "wahidcricketer12@gmail.com";

const LETTER_TEXT = `
Dear ${HER_NAME},

I don't know if words will ever be enough to explain how special you are to me.

But today, I want to try.

Thank you for being you.
Thank you for the little moments.
Thank you for the smiles, the memories, and everything that makes having you in my life so special.

This is my first birthday with you as yours — and I hope it's only the first of a lifetime of them.

From today until forever, I want it to be us. I'm quietly counting the days until we finally become one, until the day I get to call you my wife.

I know not everything is easy right now. But soon, everything will fall into place. Good days are coming — I promise you that.

So for today, just smile, be happy, and enjoy every single moment. You deserve all of it, and so much more.

Happy 20th birthday, my love.
`;

// Each card shows the title; tapping / hovering reveals the note.
const REASONS = [
  { title: "Your smile", note: "It changes the whole room — and somehow my whole day with it." },
  { title: "Your kindness", note: "The quiet kind. The kind you give without even noticing." },
  { title: "Your craziness", note: "Never lose it. It's my favourite kind of chaos." },
  {
    title: "The way you make ordinary moments special",
    note: "Even doing nothing feels like something with you.",
  },
  { title: "Simply… you.", note: "No list could ever finish this sentence." },
];

const MEMORY_NOTES = [
  "One of my favorite people.",
  "My favorite smile.",
  "Someone I never want to take for granted.",
];

/* ──────────────────────────────────────────────────────────── */

const HAS_MUSIC = typeof __HAS_MUSIC__ !== "undefined" ? __HAS_MUSIC__ : true;
const EASE = [0.22, 1, 0.36, 1];
const SLOW = { duration: 1.6, ease: EASE };

export default function App() {
  const [stage, setStage] = useState("idle"); // idle → opening → open
  const [curtain, setCurtain] = useState(false);
  const [finale, setFinale] = useState(false);
  const finaleRef = useRef(null);
  const music = useMusic();

  // Every visit (and every refresh) starts at the very beginning,
  // and the photo quietly loads while she reads the opening screen.
  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    new Image().src = PHOTO_SRC;
  }, []);

  const begin = () => {
    if (stage !== "idle") return;
    setStage("opening");
    music.start();
    setTimeout(() => setStage("open"), 2400);
  };

  const startFinale = () => {
    if (curtain || finale) return;
    setCurtain(true);
    setTimeout(() => setFinale(true), 1700);
  };

  // Once the screen is fully black, jump to the final reveal, then lift the curtain.
  useEffect(() => {
    if (!finale) return;
    let t;
    const id = requestAnimationFrame(() => {
      finaleRef.current?.scrollIntoView({ block: "start" });
      t = setTimeout(() => setCurtain(false), 900);
    });
    return () => {
      cancelAnimationFrame(id);
      clearTimeout(t);
    };
  }, [finale]);

  const lit = stage !== "idle";

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-[100svh]">
        <Ambient lit={lit} />
        <Particles active={lit} />
        <div className="grain" aria-hidden />

        <AnimatePresence>
          {stage !== "open" && <Opening key="opening" opening={stage === "opening"} onOpen={begin} />}
        </AnimatePresence>

        {stage === "open" && (
          <>
            <ProgressLine />
            <main className="relative z-10">
              <PhotoReveal />
              <Message />
              <WhyYou />
              <Memory />
              <Letter />
              <LastSurprise onReveal={startFinale} used={curtain || finale} />
              {finale && (
                <>
                  <FinalReveal sectionRef={finaleRef} play={!curtain} />
                  <GiftBox />
                </>
              )}
            </main>
          </>
        )}

        <AnimatePresence>
          {stage === "open" && music.ready && (
            <motion.button
              key="music"
              type="button"
              onClick={music.toggle}
              aria-label={music.muted ? "Play music" : "Mute music"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, delay: 1 }}
              className="safe-bottom fixed left-5 z-50 grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-black/30 text-cream/60 backdrop-blur-md transition-colors hover:text-cream sm:left-7"
            >
              {music.muted ? <VolumeX size={15} strokeWidth={1.5} /> : <Volume2 size={15} strokeWidth={1.5} />}
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {curtain && (
            <motion.div
              key="curtain"
              className="fixed inset-0 z-[70] bg-black"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 1.5, ease: "easeInOut" } }}
              exit={{ opacity: 0, transition: { duration: 2.8, ease: "easeInOut" } }}
            />
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}

/* ───────────────────────── Shared pieces ───────────────────────── */

function Reveal({ children, className, delay = 0, y = 24, amount = 0.6 }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, filter: "blur(10px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount }}
      transition={{ ...SLOW, delay }}
    >
      {children}
    </motion.div>
  );
}

function Photo({ className = "", style, eager = false, alt = HER_NAME }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        aria-hidden
        className={`${className} bg-[radial-gradient(circle_at_50%_40%,#5a2a33,#120c10_75%)]`}
        style={style}
      />
    );
  }
  return (
    <img
      src={PHOTO_SRC}
      alt={alt}
      draggable={false}
      decoding="async"
      loading={eager ? "eager" : "lazy"}
      onError={() => setFailed(true)}
      className={`${className} select-none object-cover`}
      style={{ objectPosition: PHOTO_FOCUS, ...style }}
    />
  );
}

function Eyebrow({ children }) {
  return (
    <p className="text-[10px] font-medium uppercase tracking-[0.45em] text-champagne/60 sm:text-[11px]">
      {children}
    </p>
  );
}

function Ambient({ lit }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_0%,rgba(107,31,46,0.32),transparent_70%),radial-gradient(ellipse_70%_50%_at_50%_110%,rgba(216,193,156,0.08),transparent_70%)]"
        initial={{ opacity: 0.25 }}
        animate={{ opacity: lit ? 1 : 0.25 }}
        transition={{ duration: 3.5, ease: "easeInOut" }}
      />
    </div>
  );
}

/** Lightweight canvas dust — one layer for the whole page, paused when the tab is hidden. */
function Particles({ active }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let parts = [];
    let raf = 0;

    const make = () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.1 + 0.35,
      vx: (Math.random() - 0.5) * 0.06,
      vy: -(Math.random() * 0.14 + 0.03),
      ph: Math.random() * Math.PI * 2,
      tw: Math.random() * 0.012 + 0.004,
      warm: Math.random() < 0.7,
    });

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const widthChanged = window.innerWidth !== w;
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Mobile URL bars change the height constantly — only reseed on real width changes.
      if (widthChanged) parts = Array.from({ length: Math.round(Math.min(70, (w * h) / 14000)) }, make);
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        if (!still) {
          p.x += p.vx;
          p.y += p.vy;
          p.ph += p.tw;
          if (p.y < -5) {
            p.y = h + 5;
            p.x = Math.random() * w;
          }
          if (p.x < -5) p.x = w + 5;
          if (p.x > w + 5) p.x = -5;
        }
        const a = 0.15 + 0.45 * (0.5 + 0.5 * Math.sin(p.ph));
        const c = p.warm ? "232,210,175" : "214,150,155";
        if (p.r > 1.1) {
          ctx.fillStyle = `rgba(${c},${a * 0.12})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = `rgba(${c},${a})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = still ? 0 : requestAnimationFrame(draw);
    };

    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) draw();
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-20 h-full w-full transition-opacity duration-[3000ms] ease-out"
      style={{ opacity: active ? 0.9 : 0 }}
    />
  );
}

function ProgressLine() {
  const { scrollYProgress } = useScroll();
  const scaleY = useSpring(scrollYProgress, { stiffness: 70, damping: 24, restDelta: 0.001 });
  return (
    <motion.div
      aria-hidden
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 2, duration: 2 }}
      className="pointer-events-none fixed right-3 top-1/2 z-50 h-24 w-px -translate-y-1/2 bg-white/10 sm:right-6 sm:h-40"
    >
      <motion.div className="h-full w-full origin-top bg-champagne/80" style={{ scaleY }} />
    </motion.div>
  );
}

function useMusic() {
  const audio = useRef(null);
  const [ready, setReady] = useState(false);
  const [muted, setMuted] = useState(false);

  const start = () => {
    if (!HAS_MUSIC || audio.current) return;
    const a = new Audio(MUSIC_SRC);
    a.loop = true;
    a.volume = 0;
    audio.current = a;
    a.addEventListener("error", () => setReady(false));
    a.play()
      .then(() => {
        setReady(true);
        // Gentle fade-in (iOS ignores volume — it simply plays).
        const fade = setInterval(() => {
          a.volume = Math.min(0.55, a.volume + 0.02);
          if (a.volume >= 0.55) clearInterval(fade);
        }, 110);
      })
      .catch(() => setReady(false));
  };

  const toggle = () => {
    const a = audio.current;
    if (!a) return;
    a.muted = !a.muted;
    if (!a.muted && a.paused) a.play().catch(() => {});
    setMuted(a.muted);
  };

  useEffect(() => {
    const onVisibility = () => {
      const a = audio.current;
      if (!a) return;
      if (document.hidden) a.pause();
      else a.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      audio.current?.pause();
    };
  }, []);

  return { ready, muted, start, toggle };
}

/* ───────────────────────── 1 · Opening ───────────────────────── */

function Opening({ opening, onOpen }) {
  const words = "I made something for you…".split(" ");
  return (
    <motion.section
      className="fixed inset-0 z-40 flex items-center justify-center px-6"
      exit={{ opacity: 0, filter: "blur(14px)", transition: { duration: 1.8, ease: EASE } }}
    >
      <motion.div
        className="flex max-w-xl flex-col items-center text-center"
        animate={opening ? { opacity: 0.35, y: -10, scale: 0.98 } : { opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 2, ease: EASE }}
      >
        <motion.span
          className="mb-10 block h-12 w-px bg-gradient-to-b from-transparent to-champagne/50"
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={{ duration: 1.6, ease: EASE, delay: 0.3 }}
          style={{ originY: 0 }}
        />
        <h1 className="text-balance font-serif text-[clamp(2.4rem,9vw,4.5rem)] font-light italic leading-[1.1] text-cream">
          {words.map((word, i) => (
            <motion.span
              key={i}
              className="inline-block whitespace-pre"
              initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1.4, ease: EASE, delay: 0.8 + i * 0.22 }}
            >
              {word + (i < words.length - 1 ? " " : "")}
            </motion.span>
          ))}
        </h1>
        <motion.p
          className="mt-6 text-sm tracking-wide text-cream/50 sm:text-base"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.6, delay: 2.4 }}
        >
          Take a moment. This is just for you.
        </motion.p>

        <motion.button
          type="button"
          onClick={onOpen}
          disabled={opening}
          initial={{ opacity: 0, y: 10 }}
          animate={opening ? { opacity: 0, y: 0, scale: 0.94 } : { opacity: 1, y: 0, scale: 1 }}
          transition={opening ? { duration: 0.9, ease: EASE } : { duration: 1.4, ease: EASE, delay: 3.2 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="group relative mt-14 overflow-hidden rounded-full border border-champagne/30 px-9 py-4 text-[11px] font-medium uppercase tracking-[0.35em] text-champagne transition-colors duration-700 hover:border-champagne/70 hover:bg-champagne/[0.04]"
        >
          <span className="relative z-10">Open your surprise</span>
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-champagne/10 to-transparent transition-transform duration-[1400ms] ease-out group-hover:translate-x-full" />
        </motion.button>
      </motion.div>

      {/* A slow bloom of light from where she tapped */}
      <AnimatePresence>
        {opening && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-[60vmax] w-[60vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(216,193,156,0.22),rgba(107,31,46,0.12)_45%,transparent_70%)]"
            initial={{ scale: 0.1, opacity: 0 }}
            animate={{ scale: 1.6, opacity: [0, 1, 0.6] }}
            transition={{ duration: 2.6, ease: EASE }}
          />
        )}
      </AnimatePresence>
    </motion.section>
  );
}

/* ───────────────────────── 2 · Photo reveal ───────────────────────── */

function PhotoReveal() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const fade = useTransform(scrollYProgress, [0, 0.85], [1, 0.25]);

  return (
    <section
      ref={ref}
      className="relative flex min-h-[100svh] flex-col items-center justify-center px-6 pb-28 pt-20 text-center"
    >
      <motion.p
        className="max-w-[18rem] text-balance font-serif text-lg italic leading-snug text-cream/70 sm:max-w-md sm:text-2xl"
        initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ ...SLOW, delay: 1.4 }}
      >
        There is one person this little world was made for.
      </motion.p>

      <motion.div style={{ y, opacity: fade }} className="relative mt-10 w-[min(68vw,340px)]">
        <motion.div
          aria-hidden
          className="absolute -inset-10 rounded-full bg-wine/40 blur-3xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 4, delay: 3 }}
        />
        <motion.div
          className="relative aspect-[4/5] overflow-hidden rounded-[3px] shadow-[0_40px_90px_-30px_rgba(0,0,0,0.9)]"
          initial={{ opacity: 0, scale: 0.9, filter: "blur(18px) brightness(0.35)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px) brightness(1)" }}
          transition={{ duration: 3.2, ease: EASE, delay: 2.6 }}
        >
          <Photo eager className="h-full w-full" />
          <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />
        </motion.div>
      </motion.div>

      <motion.h2
        className="mt-12 font-serif text-[clamp(2.75rem,12vw,6rem)] font-light leading-none tracking-tight"
        initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 1.8, ease: EASE, delay: 5.2 }}
      >
        Happy Birthday
      </motion.h2>
      <motion.p
        className="mt-3 flex items-center gap-3 font-serif text-[clamp(1.6rem,6.5vw,2.75rem)] italic text-champagne"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.8, ease: EASE, delay: 6.3 }}
      >
        {HER_NAME}
        <Heart className="h-4 w-4 fill-rose/80 text-rose/80 sm:h-5 sm:w-5" strokeWidth={1} />
      </motion.p>

      <motion.div
        className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-cream/35"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, delay: 8 }}
      >
        Keep going
        <motion.span animate={{ y: [0, 6, 0] }} transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}>
          <ChevronDown size={16} strokeWidth={1.25} />
        </motion.span>
      </motion.div>
    </section>
  );
}

/* ───────────────────────── 3 · Birthday message ───────────────────────── */

function Message() {
  return (
    <section className="mx-auto flex max-w-4xl flex-col gap-[26vh] px-6 py-[28vh] text-center">
      <Reveal>
        <p className="font-serif text-[clamp(2.3rem,9vw,5.25rem)] font-light leading-[1.05]">
          Today isn't just another day.
        </p>
      </Reveal>
      <Reveal>
        <p className="mx-auto max-w-2xl font-serif text-[clamp(1.6rem,6vw,3.25rem)] font-light leading-[1.2] text-cream/80">
          It's the day someone <em className="text-champagne">incredibly special</em> came into this world.
        </p>
      </Reveal>
      <Reveal>
        <p className="font-serif text-[clamp(1.75rem,6.5vw,3.5rem)] italic leading-tight text-rose">
          And I'm really glad you did.
        </p>
      </Reveal>
    </section>
  );
}

/* ───────────────────────── 4 · Why you ───────────────────────── */

function WhyYou() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-[16vh]">
      <Reveal className="text-center">
        <Eyebrow>A few of the reasons</Eyebrow>
        <h2 className="mt-5 font-serif text-[clamp(2.75rem,11vw,5.5rem)] font-light italic leading-none">Why you?</h2>
      </Reveal>

      <motion.ul
        className="mt-14 flex flex-wrap justify-center gap-4 sm:mt-20"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
        variants={{ show: { transition: { staggerChildren: 0.18, delayChildren: 0.2 } } }}
      >
        {REASONS.map((r, i) => (
          <ReasonCard key={r.title} index={i} {...r} />
        ))}
      </motion.ul>

      <Reveal delay={1.2} amount={0.5}>
        <p className="mt-10 text-center text-[11px] uppercase tracking-[0.35em] text-cream/30">Tap each one</p>
      </Reveal>
    </section>
  );
}

function ReasonCard({ title, note, index }) {
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const active = hovered || pinned;

  return (
    <motion.li
      className="w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.7rem)]"
      variants={{
        hidden: { opacity: 0, y: 30, filter: "blur(8px)" },
        show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 1.3, ease: EASE } },
      }}
    >
      <motion.button
        type="button"
        aria-expanded={active}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        onClick={() => setPinned((p) => !p)}
        animate={{
          y: active ? -5 : 0,
          borderColor: active ? "rgba(216,193,156,0.35)" : "rgba(255,255,255,0.08)",
          backgroundColor: active ? "rgba(107,31,46,0.16)" : "rgba(255,255,255,0.015)",
          boxShadow: active
            ? "0 24px 60px -24px rgba(107,31,46,0.75), 0 0 0 1px rgba(216,193,156,0.06)"
            : "0 0 0 0 rgba(0,0,0,0)",
        }}
        transition={{ duration: 0.7, ease: EASE }}
        className="flex h-full w-full flex-col items-start rounded-2xl border px-6 py-6 text-left sm:px-7 sm:py-7"
      >
        <span className="flex items-center gap-3 text-[11px] tracking-[0.3em] text-champagne/60">
          {String(index + 1).padStart(2, "0")}
          <motion.span
            className="block h-px bg-champagne/50"
            animate={{ width: active ? 40 : 18 }}
            transition={{ duration: 0.8, ease: EASE }}
          />
        </span>
        <span className="mt-4 font-serif text-[1.55rem] leading-tight text-cream sm:text-[1.7rem]">{title}</span>
        <motion.span
          className="mt-3 text-sm leading-relaxed text-cream/60"
          animate={{ opacity: active ? 1 : 0, y: active ? 0 : 6, filter: active ? "blur(0px)" : "blur(4px)" }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          {note}
        </motion.span>
      </motion.button>
    </motion.li>
  );
}

/* ───────────────────────── 5 · The photo memory ───────────────────────── */

const NOTE_PLACEMENT = [
  "order-1 self-start -rotate-3 lg:absolute lg:-left-64 lg:top-8 lg:w-56 lg:text-right",
  "order-3 self-end rotate-2 text-right lg:absolute lg:-right-64 lg:top-40 lg:w-56 lg:text-left",
  "order-4 self-center -rotate-1 text-center lg:absolute lg:-left-60 lg:bottom-6 lg:w-56 lg:text-right",
];

function Memory() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const rotate = useTransform(scrollYProgress, [0, 1], [-6, 3]);
  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);

  return (
    <section ref={ref} className="relative overflow-hidden px-6 py-[18vh]">
      <Reveal className="mb-16 text-center sm:mb-24">
        <Eyebrow>Kept close</Eyebrow>
      </Reveal>

      <div className="relative mx-auto flex max-w-sm flex-col items-center gap-12 lg:block lg:w-[340px] lg:max-w-none">
        {MEMORY_NOTES.map((text, i) => (
          <motion.p
            key={text}
            className={`font-hand text-[1.75rem] leading-tight text-champagne/90 sm:text-[2rem] ${NOTE_PLACEMENT[i]}`}
            initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 1.6, ease: EASE, delay: 0.5 + i * 0.9 }}
          >
            {text}
          </motion.p>
        ))}

        <motion.figure
          style={{ rotate, y }}
          initial={{ opacity: 0, scale: 0.94 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 1.8, ease: EASE }}
          className="relative order-2 w-[min(72vw,300px)] bg-[#efe7da] p-3 pb-16 shadow-[0_40px_90px_-25px_rgba(0,0,0,0.95)] lg:w-[340px]"
        >
          <span
            aria-hidden
            className="absolute -top-3 left-1/2 h-7 w-24 -translate-x-1/2 -rotate-3 bg-[#f6efe3]/30 shadow-sm backdrop-blur-[2px]"
          />
          <div className="aspect-square overflow-hidden bg-black">
            <Photo className="h-full w-full" style={{ filter: "sepia(0.2) saturate(0.9) contrast(1.05)" }} />
          </div>
          <figcaption className="absolute inset-x-0 bottom-4 text-center font-hand text-[1.7rem] text-letter-ink/80">
            {HER_NAME}
          </figcaption>
        </motion.figure>
      </div>
    </section>
  );
}

/* ───────────────────────── 6 · The letter ───────────────────────── */

function Letter() {
  const [state, setState] = useState("closed"); // closed → opening → open
  const letterRef = useRef(null);
  const paragraphs = useMemo(
    () =>
      LETTER_TEXT.trim()
        .split(/\n\s*\n/)
        .map((p) => p.trim()),
    []
  );

  const open = () => {
    if (state !== "closed") return;
    setState("opening");
    setTimeout(() => setState("open"), 2500);
  };

  useEffect(() => {
    if (state !== "open") return;
    const t = setTimeout(() => letterRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 500);
    return () => clearTimeout(t);
  }, [state]);

  return (
    <section className="relative px-5 py-[18vh]">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_50%_45%,rgba(216,193,156,0.12),transparent_70%)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: state === "closed" ? 0 : 1 }}
        transition={{ duration: 3, ease: "easeInOut" }}
      />

      <div className="relative mx-auto flex max-w-xl flex-col items-center">
        <AnimatePresence mode="wait">
          {state !== "open" ? (
            <motion.div
              key="envelope"
              className="flex w-full flex-col items-center text-center"
              exit={{ opacity: 0, y: 30, scale: 0.97, transition: { duration: 0.9, ease: EASE } }}
            >
              <Reveal>
                <Eyebrow>For your eyes only</Eyebrow>
                <p className="mt-6 text-balance font-serif text-[clamp(1.75rem,7vw,2.75rem)] font-light italic leading-tight">
                  There's something I wanted to tell you.
                </p>
              </Reveal>
              <Reveal delay={0.4} className="mt-32 sm:mt-36">
                <Envelope opening={state === "opening"} />
              </Reveal>
              <motion.button
                type="button"
                onClick={open}
                disabled={state !== "closed"}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: state === "closed" ? 1 : 0 }}
                animate={{ opacity: state === "closed" ? 1 : 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, delay: state === "closed" ? 0.8 : 0 }}
                whileTap={{ scale: 0.97 }}
                className="mt-12 rounded-full border border-champagne/30 px-8 py-4 text-[11px] font-medium uppercase tracking-[0.35em] text-champagne transition-colors duration-700 hover:border-champagne/70 hover:bg-champagne/[0.04]"
              >
                Open my letter
              </motion.button>
            </motion.div>
          ) : (
            <motion.article
              key="letter"
              ref={letterRef}
              className="relative w-full scroll-mt-10 rounded-[4px] bg-paper px-7 py-12 text-letter-ink shadow-[0_50px_120px_-30px_rgba(0,0,0,0.95)] sm:px-14 sm:py-16"
              initial={{ opacity: 0, y: 60, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1.5, ease: EASE }}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-[4px] bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.6),transparent_60%),radial-gradient(ellipse_at_bottom_right,rgba(160,120,90,0.12),transparent_60%)]"
              />
              <div className="relative space-y-6">
                {paragraphs.map((p, i) => {
                  const first = i === 0;
                  const last = i === paragraphs.length - 1;
                  return (
                    <motion.p
                      key={i}
                      className={`whitespace-pre-line font-serif ${
                        first
                          ? "text-[1.6rem] italic sm:text-3xl"
                          : last
                            ? "pt-4 text-[1.45rem] italic text-wine sm:text-[1.7rem]"
                            : "text-[1.2rem] leading-[1.65] sm:text-[1.35rem]"
                      }`}
                      initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
                      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      viewport={{ once: true, amount: 0.8 }}
                      transition={{ duration: 1.4, ease: EASE, delay: i < 3 ? 1 + i * 1.1 : 0.3 }}
                    >
                      {p}
                    </motion.p>
                  );
                })}
                <motion.p
                  className="pt-2 text-right font-hand text-[2rem] text-letter-ink/80"
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ duration: 1.6, ease: EASE, delay: 0.6 }}
                >
                  — {YOUR_NAME}
                </motion.p>
              </div>
            </motion.article>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function Envelope({ opening }) {
  const lines = [0, 1, 2, 3];
  return (
    <div className="relative aspect-[3/2] w-[min(82vw,400px)]" style={{ perspective: 1200 }}>
      {/* back */}
      <div className="absolute inset-0 rounded-[6px] bg-[#cbbca6] shadow-[0_45px_90px_-30px_rgba(0,0,0,0.95)]" />

      {/* the letter inside */}
      <motion.div
        className="absolute inset-x-[7%] bottom-[5%] top-[6%] rounded-[3px] bg-paper px-[8%] pt-[7%]"
        style={{ zIndex: 2 }}
        animate={{ y: opening ? "-52%" : "0%" }}
        transition={{ duration: 1.4, ease: EASE, delay: opening ? 0.95 : 0 }}
      >
        <p className="font-hand text-xl text-letter-ink/70">Dear {HER_NAME},</p>
        <div className="mt-3 space-y-3">
          {lines.map((l) => (
            <div key={l} className="h-px bg-letter-ink/10" style={{ width: `${92 - l * 14}%` }} />
          ))}
        </div>
      </motion.div>

      {/* front pocket */}
      <div
        className="absolute inset-0 rounded-[6px]"
        style={{
          zIndex: 3,
          background: "linear-gradient(170deg,#e9dfcf 0%,#ddd0bc 60%,#d2c3ac 100%)",
          clipPath: "polygon(0 0, 50% 56%, 100% 0, 100% 100%, 0 100%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 rounded-[6px] opacity-60"
        style={{
          zIndex: 3,
          background:
            "linear-gradient(to top right, transparent 49.6%, rgba(90,60,40,0.12) 50%, transparent 50.4%), linear-gradient(to top left, transparent 49.6%, rgba(90,60,40,0.12) 50%, transparent 50.4%)",
          clipPath: "polygon(0 0, 50% 56%, 100% 0, 100% 100%, 0 100%)",
        }}
      />

      {/* top flap */}
      <motion.div
        className="absolute inset-x-0 top-0 h-[58%]"
        style={{
          originY: 0,
          clipPath: "polygon(0 0, 100% 0, 50% 100%)",
          background: "linear-gradient(180deg,#e4d8c6 0%,#d3c4ad 100%)",
          filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.15))",
        }}
        initial={{ rotateX: 0, zIndex: 4 }}
        animate={opening ? { rotateX: 180, zIndex: 1 } : { rotateX: 0, zIndex: 4 }}
        transition={{ duration: 1.1, ease: [0.65, 0, 0.35, 1] }}
      />

      {/* wax seal */}
      <div className="absolute left-1/2 top-[58%] z-[5] -translate-x-1/2 -translate-y-1/2">
        <motion.div
          className="grid h-12 w-12 place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#8a2a3a,#4a1220_70%)] font-serif text-lg italic text-[#e9c9b4]/90 shadow-[0_3px_8px_rgba(0,0,0,0.45),inset_0_0_0_3px_rgba(0,0,0,0.12)] sm:h-14 sm:w-14"
          animate={{ opacity: opening ? 0 : 1, scale: opening ? 0.85 : 1 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          {HER_NAME.charAt(0)}
        </motion.div>
      </div>
    </div>
  );
}

/* ───────────────────────── 7 · One last surprise ───────────────────────── */

const line = {
  hidden: { opacity: 0, y: 14, filter: "blur(8px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 1.6, ease: EASE } },
};

function LastSurprise({ onReveal, used }) {
  return (
    <section className="relative flex min-h-[100svh] items-center justify-center bg-[linear-gradient(to_bottom,transparent,#000_30%,#000)] px-6 py-28 text-center">
      <motion.div
        className="flex flex-col items-center"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.6 }}
        variants={{ show: { transition: { staggerChildren: 2, delayChildren: 0.4 } } }}
      >
        <motion.p variants={line} className="font-serif text-[clamp(2.75rem,12vw,5.5rem)] font-light italic leading-none">
          Wait…
        </motion.p>
        <motion.p
          variants={line}
          className="mt-10 max-w-xs font-serif text-[clamp(1.5rem,6vw,2.5rem)] font-light leading-snug text-cream/85 sm:max-w-lg"
        >
          I still have one more thing for you.
        </motion.p>
        <motion.p variants={line} className="mt-8 text-sm tracking-wide text-cream/45 sm:text-base">
          Close your eyes for a second…
        </motion.p>
        <motion.div variants={line} className="mt-14">
          <motion.button
            type="button"
            onClick={onReveal}
            disabled={used}
            animate={{ opacity: used ? 0 : 1 }}
            whileTap={{ scale: 0.97 }}
            className="group inline-flex items-center gap-3 rounded-full border border-champagne/30 px-8 py-4 text-[11px] font-medium uppercase tracking-[0.35em] text-champagne transition-colors duration-700 hover:border-champagne/70 hover:bg-champagne/[0.04]"
          >
            One last surprise
            <ArrowRight size={14} strokeWidth={1.5} className="transition-transform duration-700 group-hover:translate-x-1" />
          </motion.button>
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ───────────────────────── 8 · Final reveal ───────────────────────── */

const FINAL_LINES = [
  { text: "Happy Birthday", className: "font-serif text-[clamp(3rem,13vw,7rem)] font-light leading-none tracking-tight" },
  { text: HER_NAME, className: "mt-4 font-serif text-[clamp(1.9rem,8vw,3.5rem)] italic text-champagne" },
  {
    text: "You deserve a world full of beautiful moments.",
    className: "mt-14 font-serif text-[clamp(1.35rem,5vw,2.1rem)] font-light leading-snug text-cream/90",
  },
  {
    text: "And I hope this year gives you more reasons to smile than ever before.",
    className: "mt-5 font-serif text-[clamp(1.35rem,5vw,2.1rem)] font-light leading-snug text-cream/90",
  },
];

function FinalReveal({ sectionRef, play }) {
  const show = (delay, extra = {}) => ({
    initial: { opacity: 0, y: 16, filter: "blur(10px)" },
    animate: play ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined,
    transition: { duration: 2, ease: EASE, delay, ...extra },
  });

  return (
    <section
      ref={sectionRef}
      className="relative isolate flex min-h-[100svh] items-center justify-center overflow-hidden bg-black px-6 pb-32 pt-28 text-center"
    >
      {/* the photo, slowly breathing in */}
      <motion.div
        aria-hidden
        className="absolute inset-0 -z-10 will-change-transform"
        initial={{ scale: 1.2, opacity: 0 }}
        animate={play ? { scale: 1.03, opacity: 1 } : undefined}
        transition={{ scale: { duration: 24, ease: "easeOut" }, opacity: { duration: 4, ease: "easeInOut" } }}
      >
        <Photo eager alt="" className="absolute inset-0 h-full w-full" />
        <Photo eager alt="" className="edge-mask absolute inset-0 h-full w-full blur-md" />
      </motion.div>
      <div aria-hidden className="absolute inset-0 -z-10 bg-ink/55" />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_60%_at_50%_45%,transparent_15%,rgba(8,8,12,0.92)_85%)]"
      />
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-gradient-to-t from-ink to-transparent" />

      <div className="relative max-w-2xl">
        {FINAL_LINES.map((l, i) => (
          <motion.p key={i} className={l.className} {...show([2, 3.6, 6, 8.2][i])}>
            {l.text}
          </motion.p>
        ))}

        <motion.p
          className="mt-16 flex items-center justify-center gap-3 font-serif text-[clamp(1.6rem,6vw,2.5rem)] italic text-rose"
          {...show(11, { duration: 2.4 })}
        >
          Happy Birthday, my love.
          <Heart className="h-5 w-5 fill-rose/80 text-rose/80" strokeWidth={1} />
        </motion.p>
        <motion.p className="mt-6 font-hand text-[2rem] text-cream/80" {...show(13)}>
          — {YOUR_NAME}
        </motion.p>
      </div>

      <motion.p
        className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-cream/40"
        initial={{ opacity: 0 }}
        animate={play ? { opacity: 1 } : undefined}
        transition={{ duration: 3, delay: 15 }}
      >
        Oh, and one more thing
        <motion.span animate={{ y: [0, 6, 0] }} transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}>
          <ChevronDown size={16} strokeWidth={1.25} />
        </motion.span>
      </motion.p>
    </section>
  );
}
