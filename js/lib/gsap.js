/**
 * Único punto de acceso a GSAP (inversión de dependencias):
 * el resto de módulos importa desde aquí y no depende de `window`.
 */
const { gsap, ScrollTrigger, MotionPathPlugin, CustomEase } = window;

if (!gsap) {
  throw new Error('GSAP no se cargó. Revisa la conexión o las etiquetas <script> de index.html.');
}

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin, CustomEase);

export const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export { gsap, ScrollTrigger, CustomEase };
