/**
 * Tokens de movimiento para GSAP leídos desde css/tokens.css (única fuente de verdad):
 * las mismas curvas y duraciones sirven a las transiciones CSS y a las animaciones JS.
 */
import { gsap, CustomEase } from './gsap.js';

const styles = getComputedStyle(document.documentElement);
const token = (name) => styles.getPropertyValue(name).trim();

/** 'cubic-bezier(a, b, c, d)' → ease registrado en GSAP. */
function registerBezier(name, cssValue) {
  const [x1, y1, x2, y2] = cssValue.match(/-?[\d.]+/g).map(Number);
  CustomEase.create(name, `M0,0 C${x1},${y1} ${x2},${y2} 1,1`);
  return name;
}

const seconds = (name) => parseFloat(token(name)) / 1000;

export const EASE = Object.freeze({
  out: registerBezier('ui-out', token('--ease-out')),
  inOut: registerBezier('ui-in-out', token('--ease-in-out')),
});

export const DURATION = Object.freeze({
  press: seconds('--dur-press'),
  fast: seconds('--dur-fast'),
  ui: seconds('--dur-ui'),
  modal: seconds('--dur-modal'),
  reveal: seconds('--dur-reveal'),
});

/** Escalonado de grupos: 30–80 ms entre elementos. */
export const STAGGER = Object.freeze({ tight: 0.03, normal: 0.05 });

gsap.defaults({ ease: EASE.out });
