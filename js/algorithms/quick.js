import { Op, step, swapInPlace, indices } from '../core/steps.js';

/** Partición de Hoare con pivote central (versión del libro), recursiva. */
function* quick(a, izq, der, depth) {
  const range = { izq: izq + 1, der: der + 1, nivel: depth };
  yield step('start', { ops: [Op.range(izq, der)], vars: range, note: `Llamada rápido(A, ${izq + 1}, ${der + 1}).` });

  let i = izq;
  let j = der;
  const center = Math.floor((izq + der) / 2);
  const pivote = a[center];
  const vars = () => ({ ...range, i: i + 1, j: j + 1, pivote });

  yield step('init', { ops: [Op.mark(center, 'pivot')], vars: vars(), note: `Pivote = A[${center + 1}] = ${pivote}.` });

  do {
    while (true) {
      const less = a[i] < pivote;
      yield step('scanI', { branch: less, ops: [Op.compare(i)], vars: vars(), note: `¿${a[i]} < ${pivote}?` });
      if (!less) break;
      i += 1;
      yield step('incI', { vars: vars() });
    }

    while (true) {
      const greater = a[j] > pivote;
      yield step('scanJ', { branch: greater, ops: [Op.compare(j)], vars: vars(), note: `¿${a[j]} > ${pivote}?` });
      if (!greater) break;
      j -= 1;
      yield step('decJ', { vars: vars() });
    }

    const cross = i <= j;
    yield step('check', { branch: cross, vars: vars() });
    if (cross) {
      swapInPlace(a, i, j);
      const ops = [Op.swap(i, j)];
      i += 1;
      j -= 1;
      yield step('swap', { ops, vars: vars() });
    }

    yield step('until', { branch: i > j, vars: vars() });
  } while (i <= j);

  const goLeft = izq < j;
  yield step('recL', { branch: goLeft, vars: vars() });
  if (goLeft) {
    yield step('callL', { vars: vars(), note: `Ahora ordena la parte izquierda (${izq + 1} a ${j + 1}).` });
    yield* quick(a, izq, j, depth + 1);
  }

  const goRight = i < der;
  yield step('recR', { branch: goRight, ops: [Op.range(izq, der), Op.unmark('pivot')], vars: vars() });
  if (goRight) {
    yield step('callR', { vars: vars(), note: `Ahora ordena la parte derecha (${i + 1} a ${der + 1}).` });
    yield* quick(a, i, der, depth + 1);
  }

  const isRoot = depth === 0;
  yield step('end', {
    ops: isRoot ? [Op.range(0, a.length - 1), Op.unmark('pivot'), Op.sorted(indices(0, a.length - 1))] : [Op.unmark('pivot')],
    vars: range,
    note: isRoot ? 'Vector ordenado.' : `Termina rápido(A, ${izq + 1}, ${der + 1}) y vuelve a la llamada anterior.`,
  });
}

function* sort(a) {
  yield* quick(a, 0, a.length - 1, 0);
}

export default {
  id: 'quick',
  name: 'Quicksort',
  family: 'Divide y vencerás',
  group: 'avanzado',
  summary: 'Elige un pivote, separa los menores de los mayores y ordena cada parte por su cuenta.',
  description:
    'Lo creó C. A. R. Hoare. Toma un pivote (aquí, el elemento central) y avanza desde los dos extremos: i se detiene en un valor que no es menor que el pivote y j en uno que no es mayor; entonces los intercambia. Cuando se cruzan quedan dos partes, que se ordenan igual con recursión. Suele ser el más rápido, aunque con malos pivotes cae a O(n²).',
  complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n²)', space: 'O(log n)' },
  stable: false,
  inPlace: true,
  comparative: true,
  efficiency: { score: 5, label: 'Muy alta', note: 'El más usado en la práctica; las bibliotecas estándar usan variantes como introsort.' },
  example: [50, 30, 20, 80, 90, 70, 95, 85, 10, 15, 75, 25],
  pseudocode: [
    ['start', 'procedimiento rapido(A, izq, der)'],
    ['init', '  i ← izq ; j ← der'],
    ['init', '  pivote ← A[(izq + der) div 2]'],
    [null, '  repetir'],
    ['scanI', '    mientras A[i] < pivote hacer'],
    ['incI', '      i ← i + 1'],
    ['scanJ', '    mientras A[j] > pivote hacer'],
    ['decJ', '      j ← j − 1'],
    ['check', '    si i ≤ j entonces'],
    ['swap', '      intercambiar(A[i], A[j])'],
    ['swap', '      i ← i + 1 ; j ← j − 1'],
    [null, '    fin_si'],
    ['until', '  hasta_que i > j'],
    ['recL', '  si izq < j entonces'],
    ['callL', '    rapido(A, izq, j)'],
    ['recR', '  si i < der entonces'],
    ['callR', '    rapido(A, i, der)'],
    ['end', 'fin_procedimiento'],
  ],
  flowchart: {
    nodes: [
      { id: 'start', type: 'terminal', text: 'rápido(A, izq, der)' },
      { id: 'init', type: 'process', text: 'i ← izq ; j ← der\npivote ← A[(izq+der) div 2]' },
      { id: 'scanI', type: 'decision', text: '¿A[i] < pivote?' },
      { id: 'incI', type: 'process', text: 'i ← i + 1', col: 1 },
      { id: 'scanJ', type: 'decision', text: '¿A[j] > pivote?' },
      { id: 'decJ', type: 'process', text: 'j ← j − 1', col: 1 },
      { id: 'check', type: 'decision', text: '¿i ≤ j?' },
      { id: 'swap', type: 'process', text: 'intercambiar(A[i], A[j])\ni ← i + 1 ; j ← j − 1' },
      { id: 'until', type: 'decision', text: '¿i > j?' },
      { id: 'recL', type: 'decision', text: '¿izq < j?' },
      { id: 'callL', type: 'call', text: 'rápido(A, izq, j)', col: 1 },
      { id: 'recR', type: 'decision', text: '¿i < der?' },
      { id: 'callR', type: 'call', text: 'rápido(A, i, der)', col: 1 },
      { id: 'end', type: 'terminal', text: 'Retornar' },
    ],
    edges: [
      { from: 'start', to: 'init' },
      { from: 'init', to: 'scanI' },
      { from: 'scanI', to: 'incI', label: 'Sí', route: 'branch' },
      { from: 'incI', to: 'scanI', route: 'around', side: 'right', lane: 0 },
      { from: 'scanI', to: 'scanJ', label: 'No' },
      { from: 'scanJ', to: 'decJ', label: 'Sí', route: 'branch' },
      { from: 'decJ', to: 'scanJ', route: 'around', side: 'right', lane: 0 },
      { from: 'scanJ', to: 'check', label: 'No' },
      { from: 'check', to: 'swap', label: 'Sí' },
      { from: 'check', to: 'until', label: 'No', route: 'around', side: 'right', lane: 0 },
      { from: 'swap', to: 'until' },
      { from: 'until', to: 'scanI', label: 'No', route: 'around', side: 'left', lane: 0 },
      { from: 'until', to: 'recL', label: 'Sí' },
      { from: 'recL', to: 'callL', label: 'Sí', route: 'branch' },
      { from: 'recL', to: 'recR', label: 'No' },
      { from: 'callL', to: 'recR' },
      { from: 'recR', to: 'callR', label: 'Sí', route: 'branch' },
      { from: 'recR', to: 'end', label: 'No' },
      { from: 'callR', to: 'end' },
    ],
  },
  sort,
};
