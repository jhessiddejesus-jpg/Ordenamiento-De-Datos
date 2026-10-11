import { gsap, prefersReducedMotion } from '../lib/gsap.js';
import { EASE, STAGGER } from '../lib/motion.js';
import { $, h } from '../utils/dom.js';
import { countOperations } from '../core/trace.js';
import { randomArray } from '../core/random.js';

const SIZES = [50, 200, 1000];
const INPUT_RANGE = { min: 1, max: 999 };
// Visualización explicativa: puede durar más que la UI (≈ 2 × revelado).
const BAR_DURATION = 1.1;
const format = (value) => Math.round(value).toLocaleString('es');

/** Ejecuta todos los algoritmos sobre el MISMO vector aleatorio y compara operaciones reales. */
export class Benchmark {
  #root;
  #algorithms;
  #rows;
  #note;

  constructor(root, algorithms) {
    this.#root = root;
    this.#algorithms = algorithms;
    this.#rows = $('[data-bench-rows]', root);
    this.#note = $('[data-bench-note]', root);
    $('[data-bench-sizes]', root).replaceChildren(...SIZES.map((size) =>
      h('button', { class: 'chip-btn', type: 'button', dataset: { size }, text: `n = ${size.toLocaleString('es')}`, onclick: () => this.run(size) })));
  }

  run(size) {
    this.#root.querySelectorAll('[data-size]').forEach((button) =>
      button.classList.toggle('is-active', Number(button.dataset.size) === size));

    const input = randomArray(size, INPUT_RANGE);
    const results = this.#algorithms.map((algorithm) => {
      const { comparisons, swaps, writes } = countOperations(algorithm, input);
      return { algorithm, comparisons, moves: swaps + writes, total: comparisons + swaps + writes };
    });
    const max = Math.max(...results.map((result) => result.total));

    this.#note.textContent = `Todos ordenan el mismo vector aleatorio de ${format(size)} números (del 1 al 999). Cada barra suma comparaciones y movimientos.`;
    this.#rows.replaceChildren(...results.map((result) => this.#row(result, max)));
    this.#animate();
  }

  #row({ algorithm, comparisons, moves, total }, max) {
    const ratio = total / max;
    return h('div', { class: `bench__row${algorithm.isNew ? ' is-new' : ''}` }, [
      h('span', { class: 'bench__name', text: algorithm.name }),
      h('div', { class: 'bench__track' }, [
        h('div', { class: 'bench__bar', style: `--w:${Math.max(ratio, 0.004)}` }, [
          h('i', { class: 'bench__cmp', style: `flex:${comparisons}` }),
          h('i', { class: 'bench__mov', style: `flex:${moves}` }),
        ]),
      ]),
      h('span', { class: 'bench__value' }, [
        h('strong', { 'data-count': total, text: format(total) }),
        h('small', { text: `${format(comparisons)} comp. · ${format(moves)} mov.` }),
      ]),
    ]);
  }

  #animate() {
    if (prefersReducedMotion) return;
    gsap.from(this.#rows.querySelectorAll('.bench__bar'), { scaleX: 0, transformOrigin: 'left center', duration: BAR_DURATION, ease: EASE.out, stagger: STAGGER.normal });
    this.#rows.querySelectorAll('[data-count]').forEach((element) => {
      const counter = { value: 0 };
      gsap.to(counter, {
        value: Number(element.dataset.count), duration: BAR_DURATION, ease: EASE.out,
        onUpdate: () => { element.textContent = format(counter.value); },
      });
    });
  }
}
