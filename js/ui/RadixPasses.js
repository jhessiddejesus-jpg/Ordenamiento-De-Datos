import { gsap, prefersReducedMotion } from '../lib/gsap.js';
import { EASE, DURATION, STAGGER } from '../lib/motion.js';
import { h } from '../utils/dom.js';
import { digitsHtml } from '../utils/digits.js';
import { lsdPasses } from '../algorithms/radix.js';

const PLACE_NAMES = { 1: 'unidades', 10: 'decenas', 100: 'centenas', 1000: 'millares' };

/** Pasadas LSD de un ejemplo: cada fila resalta el dígito por el que quedó ordenada. */
export function renderRadixPasses(root, values) {
  const width = String(Math.max(...values)).length;
  const rows = [
    { label: 'Inicial', values, exp: null },
    ...lsdPasses(values).map(({ exp, values: passValues }) => ({ label: `Por ${PLACE_NAMES[exp] ?? `×${exp}`}`, values: passValues, exp })),
  ];

  root.replaceChildren(...rows.map((row) => h('div', { class: 'passes__row' }, [
    h('span', { class: 'passes__label', text: row.label }),
    h('div', { class: 'passes__cells' }, row.values.map((value) =>
      h('span', { class: 'passes__cell', html: digitsHtml(value, width, row.exp) }))),
  ])));

  if (prefersReducedMotion) return;
  gsap.from(root.querySelectorAll('.passes__cell'), {
    opacity: 0, y: -8, rotateX: -50, duration: DURATION.reveal, ease: EASE.out,
    stagger: STAGGER.tight,
    scrollTrigger: { trigger: root, start: 'top 80%', once: true },
  });
}
