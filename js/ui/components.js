/** Piezas visuales reutilizadas por el mapa, la ficha y la tabla (DRY). */
import { h } from '../utils/dom.js';

const MAX_SCORE = 5;

export function efficiencyMeter({ score, label }) {
  return h('span', { class: 'meter', 'aria-label': `Eficiencia ${label} (${score} de ${MAX_SCORE})`, 'data-score': score }, [
    h('span', { class: 'meter__dots', 'aria-hidden': 'true' },
      Array.from({ length: MAX_SCORE }, (_, index) => h('i', { class: index < score ? 'is-on' : '' }))),
    h('span', { class: 'meter__label', text: label }),
  ]);
}

export const complexityBadge = (value, tone = 'average') => h('code', { class: `big-o big-o--${tone}`, text: value });

export const yesNo = (value) => (value ? 'Sí' : 'No');
