import { h } from '../utils/dom.js';

const LABELS = [
  ['comparisons', 'Comparaciones'],
  ['swaps', 'Intercambios'],
  ['writes', 'Escrituras'],
];

/** Contadores de operaciones acumuladas hasta el paso actual. */
export class StatsView {
  #values = new Map();

  constructor(root) {
    root.replaceChildren(...LABELS.map(([key, label]) => {
      const value = h('strong', { text: '0' });
      this.#values.set(key, value);
      return h('span', { class: `stat stat--${key}` }, [value, h('small', { text: label })]);
    }));
  }

  render(stats) {
    for (const [key] of LABELS) this.#values.get(key).textContent = stats?.[key] ?? 0;
  }
}
