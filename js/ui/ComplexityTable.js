import { h } from '../utils/dom.js';
import { efficiencyMeter, complexityBadge, yesNo } from './components.js';

const COLUMNS = [
  ['Algoritmo', (a) => h('span', { class: 'ctable__name', text: a.name })],
  ['Mejor', (a) => complexityBadge(a.complexity.best, 'best')],
  ['Promedio', (a) => complexityBadge(a.complexity.average, 'average')],
  ['Peor', (a) => complexityBadge(a.complexity.worst, 'worst')],
  ['Espacio', (a) => complexityBadge(a.complexity.space, 'space')],
  ['Estable', (a) => yesNo(a.stable)],
  ['Tipo', (a) => (a.comparative ? 'Comparativo' : 'Distribución')],
  ['Eficiencia', (a) => efficiencyMeter(a.efficiency)],
];

/** Tabla generada desde el registro: una sola fuente de verdad para el Big O. */
export function renderComplexityTable(table, algorithms) {
  table.replaceChildren(
    h('caption', { class: 'visually-hidden', text: 'Complejidad y eficiencia de los métodos de ordenación' }),
    h('thead', {}, h('tr', {}, COLUMNS.map(([title]) => h('th', { scope: 'col', text: title })))),
    h('tbody', {}, algorithms.map((algorithm) =>
      h('tr', { class: algorithm.isNew ? 'is-new' : '' }, COLUMNS.map(([title, cell], index) =>
        h(index === 0 ? 'th' : 'td', { 'data-label': title, scope: index === 0 ? 'row' : undefined }, cell(algorithm)))))),
  );
}
