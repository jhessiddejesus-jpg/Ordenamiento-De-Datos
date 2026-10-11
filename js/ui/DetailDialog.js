import { gsap, prefersReducedMotion } from '../lib/gsap.js';
import { EASE, DURATION, STAGGER } from '../lib/motion.js';
import { h } from '../utils/dom.js';
import { efficiencyMeter, complexityBadge, yesNo } from './components.js';

const CASES = [
  ['best', 'Mejor caso', 'best'],
  ['average', 'Caso promedio', 'average'],
  ['worst', 'Peor caso', 'worst'],
  ['space', 'Espacio', 'space'],
];

/** Ficha de un algoritmo en un <dialog> nativo (accesible: foco, Esc, backdrop). */
export class DetailDialog {
  #dialog;
  #onExplore;

  constructor(dialog, { onExplore }) {
    this.#dialog = dialog;
    this.#onExplore = onExplore;
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) this.close();
    });
  }

  open(algorithm) {
    this.#dialog.replaceChildren(this.#content(algorithm));
    this.#dialog.showModal();
    if (!prefersReducedMotion) {
      // Modal: centrado (sin origen en el disparador), sin rebote, ease-out fuerte.
      gsap.fromTo(this.#dialog, { opacity: 0, y: 16, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: DURATION.modal, ease: EASE.out });
      gsap.from(this.#dialog.querySelectorAll('[data-stagger]'), { opacity: 0, y: 8, stagger: STAGGER.tight, duration: DURATION.ui, delay: 0.05 });
    }
  }

  close() {
    if (prefersReducedMotion) {
      this.#dialog.close();
      return;
    }
    // La salida es más rápida que la entrada: el usuario ya decidió cerrar.
    gsap.to(this.#dialog, { opacity: 0, y: 8, scale: 0.98, duration: DURATION.press, ease: EASE.out, onComplete: () => this.#dialog.close() });
  }

  #content(algorithm) {
    return h('article', { class: 'detail__body' }, [
      h('button', { class: 'detail__close', type: 'button', 'aria-label': 'Cerrar', text: '✕', onclick: () => this.close() }),
      h('p', { class: 'eyebrow', 'data-stagger': '', text: algorithm.family }),
      h('h3', { id: 'detail-title', class: 'detail__title', 'data-stagger': '', text: algorithm.name }),
      h('p', { class: 'detail__desc', 'data-stagger': '', text: algorithm.description }),
      h('div', { class: 'detail__cases', 'data-stagger': '' }, CASES.map(([key, label, tone]) =>
        h('div', { class: 'detail__case' }, [h('small', { text: label }), complexityBadge(algorithm.complexity[key], tone)]))),
      h('dl', { class: 'facts', 'data-stagger': '' }, [
        this.#fact('Estable', yesNo(algorithm.stable)),
        this.#fact('In situ', yesNo(algorithm.inPlace)),
        this.#fact('Comparativo', yesNo(algorithm.comparative)),
      ]),
      h('div', { class: 'detail__eff', 'data-stagger': '' }, [
        h('small', { text: 'Eficiencia' }),
        efficiencyMeter(algorithm.efficiency),
        h('p', { class: 'muted', text: algorithm.efficiency.note }),
      ]),
      h('button', {
        class: 'btn btn--primary',
        type: 'button',
        'data-stagger': '',
        text: 'Ver su diagrama de flujo →',
        onclick: () => {
          this.#dialog.close();
          this.#onExplore(algorithm.id);
        },
      }),
    ]);
  }

  #fact(term, value) {
    return h('div', {}, [h('dt', { text: term }), h('dd', { text: value })]);
  }
}
