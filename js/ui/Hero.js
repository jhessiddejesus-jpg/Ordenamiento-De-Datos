import { gsap, ScrollTrigger, prefersReducedMotion } from '../lib/gsap.js';
import { EASE, DURATION, STAGGER } from '../lib/motion.js';
import { h } from '../utils/dom.js';
import { randomInt } from '../core/random.js';

const BAR_COUNT = 36;
const HERO_DURATION = 1; // pieza de presentación: puede superar el presupuesto de UI

const shuffled = (list) => {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

/** Divide el título en palabras para animarlas por separado. */
function splitWords(element) {
  const words = element.textContent.trim().split(/\s+/);
  element.replaceChildren(...words.flatMap((word, index) => [
    h('span', { class: 'split-word' }, h('span', { class: 'split-word__inner', text: word })),
    ...(index < words.length - 1 ? [' '] : []),
  ]));
  return element.querySelectorAll('.split-word__inner');
}

/** Fondo de barras que se ordenan y desordenan en bucle + entrada del título. */
export function initHero(root) {
  const title = root.querySelector('[data-split]');
  const barsRoot = root.querySelector('[data-hero-bars]');
  const heights = Array.from({ length: BAR_COUNT }, (_, index) => 12 + (index / (BAR_COUNT - 1)) * 80);
  const bars = heights.map((height) => h('i', { style: `height:${height}%` }));
  barsRoot.replaceChildren(...bars);

  // Cada barra mide exactamente 1/BAR_COUNT del ancho: xPercent = posición × 100 (transform, sin layout).
  const place = (order, { stagger = 0, ...vars } = {}) => order.forEach((bar, position) =>
    gsap.to(bar, { xPercent: position * 100, delay: position * stagger, ...vars }));

  place(shuffled(bars), { duration: 0 });

  if (prefersReducedMotion) return;

  const words = splitWords(title);
  gsap.timeline({ defaults: { ease: EASE.out } })
    .from(words, { yPercent: 110, duration: HERO_DURATION, stagger: STAGGER.normal })
    .from(root.querySelectorAll('.eyebrow, .hero__lead, .hero__cta > *'), { opacity: 0, y: 16, duration: DURATION.reveal, stagger: STAGGER.normal }, '-=0.7')
    .from(bars, { scaleY: 0, transformOrigin: 'bottom', duration: HERO_DURATION, stagger: { each: 0.015, from: 'random' } }, 0);

  // El bucle decorativo sólo trabaja mientras el hero está en pantalla.
  let visible = true;
  ScrollTrigger.create({ trigger: root, start: 'top bottom', end: 'bottom top', onToggle: (self) => { visible = self.isActive; } });

  const loop = () => {
    if (visible) place(bars, { duration: 1.4, ease: EASE.inOut, stagger: 0.02 });
    gsap.delayedCall(4, () => {
      if (visible) place(shuffled(bars), { duration: 1.2, ease: EASE.inOut, stagger: 0.015 });
      gsap.delayedCall(3, loop);
    });
  };
  gsap.delayedCall(1.6, loop);

  gsap.to(barsRoot, {
    yPercent: 25, opacity: 0.2, ease: 'none',
    scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: true },
  });
}
