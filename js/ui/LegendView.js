import { h } from '../utils/dom.js';

/**
 * Leyenda de colores del vector. Las entradas se derivan de las operaciones
 * que aparecen en la traza: cada algoritmo muestra sólo lo que usa.
 */
const ENTRIES = [
  { feature: 'compare', state: 'compare', label: 'Comparando' },
  { feature: 'lift', state: 'lifted', label: 'Clave (aux)' },
  { feature: 'min', state: 'min', label: 'Mínimo actual' },
  { feature: 'pivot', state: 'pivot', label: 'Pivote' },
  { feature: 'toBucket', state: 'chip', label: 'En cubeta' },
  { feature: 'range', state: 'dim', label: 'Fuera de la sublista' },
  { feature: 'sorted', state: 'sorted', label: 'En su lugar final' },
];

/** Conjunto de rasgos de una traza: tipos de operación y roles marcados. */
export const featuresOf = (trace) => new Set(trace.flatMap((step) => step.ops.map((op) => op.role ?? op.type)));

export class LegendView {
  #root;

  constructor(root) {
    this.#root = root;
  }

  render(features) {
    this.#root.replaceChildren(...ENTRIES
      .filter(({ feature }) => features.has(feature))
      .map(({ state, label }) => h('li', { class: 'legend-item' }, [
        h('i', { class: `legend-item__swatch is-${state}`, 'aria-hidden': 'true' }),
        label,
      ])));
  }
}
