import { gsap, prefersReducedMotion } from '../lib/gsap.js';
import { EASE, DURATION } from '../lib/motion.js';
import { h, s } from '../utils/dom.js';

const SIZE = Object.freeze({ width: 34, height: 34 });
const HOP_HEIGHT = 30;
const SMALL_HOP = 10;

/**
 * Bit: guía animada que salta sobre el elemento protagonista de cada paso.
 * Sólo sabe dibujarse y moverse a una caja { x, y, width }; no conoce los algoritmos.
 *
 * El salto imita la gravedad (despegue rápido, cima, caída que acelera) y lleva
 * estirar/aplastar: se estira al despegar y se aplasta al aterrizar.
 */
export class Mascot {
  #el;
  #figure;
  #bubble;
  #position = null;
  #timeline = null;

  constructor(root) {
    this.#bubble = h('span', { class: 'mascot__bubble' });
    this.#figure = this.#drawFigure();
    this.#el = h('div', { class: 'mascot', 'aria-hidden': 'true' }, [this.#bubble, this.#figure]);
    root.append(this.#el);
  }

  setVisible(visible) {
    this.#el.hidden = !visible;
  }

  /** Salta (o se coloca, sin animación) encima de `box`, mostrando `cue` en su globo. */
  moveTo(box, { duration = DURATION.ui, cue = null, animate = true } = {}) {
    if (!box) return;
    const target = { x: box.x + box.width / 2 - SIZE.width / 2, y: box.y - SIZE.height + 3 };
    const from = this.#position;
    this.#position = target;
    this.say(cue);
    this.#timeline?.kill();
    gsap.set(this.#figure, { scaleX: 1, scaleY: 1 });

    if (!from || !animate || prefersReducedMotion) {
      gsap.set(this.#el, target);
      return;
    }

    if (target.x !== from.x) this.#el.classList.toggle('is-facing-left', target.x < from.x);
    const travel = Math.hypot(target.x - from.x, target.y - from.y);
    const peak = Math.min(from.y, target.y) - (travel < 4 ? SMALL_HOP : HOP_HEIGHT);
    const half = duration / 2;

    this.#timeline = gsap.timeline()
      // despegue: se estira
      .to(this.#figure, { scaleY: 1.14, scaleX: 0.9, duration: half * 0.4, ease: EASE.out })
      .to(this.#figure, { scaleY: 1, scaleX: 1, duration: half * 0.6, ease: EASE.out })
      // vuelo: x constante; y sube frenando y cae acelerando (gravedad)
      .to(this.#el, { x: target.x, duration, ease: 'none' }, 0)
      .to(this.#el, { y: peak, duration: half, ease: 'power2.out' }, 0)
      .to(this.#el, { y: target.y, duration: half, ease: 'power2.in' }, half)
      // aterrizaje: se aplasta y recupera
      .to(this.#figure, { scaleY: 0.78, scaleX: 1.16, duration: DURATION.press / 2, ease: EASE.out }, duration)
      .to(this.#figure, { scaleY: 1, scaleX: 1, duration: DURATION.press, ease: EASE.out });
  }

  /** Dos saltitos en el sitio al terminar el algoritmo (momento poco frecuente: se permite el gusto). */
  celebrate() {
    if (!this.#position) return;
    this.say('¡listo!');
    if (prefersReducedMotion) return;
    const { y } = this.#position;
    const cheer = gsap.timeline({ repeat: 1 })
      .to(this.#el, { y: y - 22, duration: 0.22, ease: 'power2.out' })
      .to(this.#el, { y, duration: 0.22, ease: 'power2.in' })
      .to(this.#figure, { scaleY: 0.8, scaleX: 1.14, duration: 0.08, ease: EASE.out })
      .to(this.#figure, { scaleY: 1, scaleX: 1, duration: DURATION.press, ease: EASE.out });
    // Si aún va en el aire, celebra al aterrizar (cortar el salto lo dejaría flotando).
    if (this.#timeline?.isActive()) this.#timeline.add(cheer);
    else this.#timeline = cheer;
  }

  /** Muestra (o esconde con null) el globo de texto. */
  say(text) {
    const changed = this.#bubble.textContent !== (text ?? '');
    this.#bubble.textContent = text ?? '';
    this.#el.classList.toggle('has-bubble', Boolean(text));
    if (text && changed && !prefersReducedMotion) {
      gsap.fromTo(this.#bubble, { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: DURATION.fast, ease: EASE.out });
    }
  }

  reset() {
    this.#timeline?.kill();
    this.#position = null;
    this.say(null);
  }

  // Robot pequeño: cuerpo de latón, antena, ojos que parpadean (CSS) y patas.
  #drawFigure() {
    return s('svg', { class: 'mascot__figure', viewBox: '0 0 34 34', width: SIZE.width, height: SIZE.height }, [
      s('line', { x1: 17, y1: 6, x2: 17, y2: 1.5, class: 'mascot__antenna' }),
      s('circle', { cx: 17, cy: 2, r: 2, class: 'mascot__tip' }),
      s('ellipse', { cx: 11, cy: 31, rx: 4.2, ry: 2.4, class: 'mascot__foot' }),
      s('ellipse', { cx: 23, cy: 31, rx: 4.2, ry: 2.4, class: 'mascot__foot' }),
      s('rect', { x: 3, y: 6, width: 28, height: 24, rx: 10, class: 'mascot__body' }),
      s('rect', { x: 8, y: 11, width: 18, height: 11, rx: 5.5, class: 'mascot__face' }),
      s('g', { class: 'mascot__eyes' }, [
        s('circle', { cx: 13.5, cy: 16.5, r: 2.1, class: 'mascot__eye' }),
        s('circle', { cx: 20.5, cy: 16.5, r: 2.1, class: 'mascot__eye' }),
      ]),
      s('path', { d: 'M14.5 25.5 Q17 27.3 19.5 25.5', class: 'mascot__mouth' }),
    ]);
  }
}
