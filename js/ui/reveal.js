import { gsap, ScrollTrigger, prefersReducedMotion } from '../lib/gsap.js';
import { EASE, DURATION, STAGGER } from '../lib/motion.js';

/**
 * Aparición al hacer scroll para todo elemento con [data-reveal].
 * Con movimiento reducido se conserva un fundido suave (sin desplazamiento): menos, no cero.
 */
export function initReveal(selector = '[data-reveal]') {
  const from = prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 24 };
  gsap.set(selector, from);
  ScrollTrigger.batch(selector, {
    start: 'top 88%',
    once: true,
    onEnter: (elements) => gsap.to(elements, {
      opacity: 1,
      y: 0,
      duration: prefersReducedMotion ? DURATION.fast : DURATION.reveal,
      ease: EASE.out,
      stagger: STAGGER.normal,
    }),
  });
}
