import { Op, step, swapInPlace, indices } from '../core/steps.js';

function* sort(a) {
  const n = a.length;
  let i = 0;

  yield step('start', { note: 'Empieza la ordenación por selección.' });
  yield step('initI', { vars: { i: 1 } });

  while (true) {
    const more = i < n - 1;
    yield step('testI', { branch: more, vars: { i: i + 1 } });
    if (!more) break;

    let min = i;
    let j = i + 1;
    yield step('setMin', { ops: [Op.mark(min, 'min')], vars: { i: i + 1, min: min + 1, j: j + 1 } });

    while (true) {
      const inRange = j < n;
      yield step('testJ', { branch: inRange, vars: { i: i + 1, min: min + 1, j: j + 1 } });
      if (!inRange) break;

      const less = a[j] < a[min];
      yield step('cmp', {
        branch: less,
        ops: [Op.compare(j, min)],
        vars: { i: i + 1, min: min + 1, j: j + 1 },
        note: `¿${a[j]} < ${a[min]}? ${less ? 'Sí → nuevo mínimo' : 'No'}`,
      });

      if (less) {
        min = j;
        yield step('newMin', { ops: [Op.mark(min, 'min')], vars: { i: i + 1, min: min + 1, j: j + 1 } });
      }

      j += 1;
      yield step('incJ', { vars: { i: i + 1, min: min + 1, j: j + 1 } });
    }

    const needsSwap = min !== i;
    yield step('checkSwap', { branch: needsSwap, vars: { i: i + 1, min: min + 1 } });
    if (needsSwap) {
      swapInPlace(a, i, min);
      yield step('swap', { ops: [Op.swap(i, min)], vars: { i: i + 1, min: min + 1 } });
    }

    i += 1;
    yield step('incI', {
      ops: [Op.unmark('min'), Op.sorted([i - 1])],
      vars: { i: i + 1 },
      note: `La posición ${i} ya tiene su valor definitivo.`,
    });
  }

  yield step('end', { ops: [Op.unmark('min'), Op.sorted(indices(0, n - 1))], note: 'Vector ordenado.' });
}

export default {
  id: 'selection',
  name: 'Selección',
  family: 'Selección',
  group: 'directo',
  summary: 'Busca el menor de los que faltan y lo pone al principio, una posición a la vez.',
  description:
    'En cada pasada busca el menor de la parte sin ordenar y lo intercambia con el primero de esa parte. Siempre hace n(n − 1)/2 comparaciones, pero nunca más de n − 1 intercambios, lo que conviene cuando escribir en memoria es costoso.',
  complexity: { best: 'O(n²)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
  stable: false,
  inPlace: true,
  comparative: true,
  efficiency: { score: 2, label: 'Baja', note: 'Muchas comparaciones, O(n²), pero pocos intercambios, O(n).' },
  example: [320, 96, 16, 90, 120, 80, 200, 64],
  pseudocode: [
    ['start', 'procedimiento seleccion(A, n)'],
    ['testI', '  desde i ← 1 hasta n − 1 hacer'],
    ['setMin', '    min ← i'],
    ['testJ', '    desde j ← i + 1 hasta n hacer'],
    ['cmp', '      si A[j] < A[min] entonces'],
    ['newMin', '        min ← j'],
    [null, '      fin_si'],
    ['incJ', '    fin_desde'],
    ['checkSwap', '    si min ≠ i entonces'],
    ['swap', '      intercambiar(A[i], A[min])'],
    [null, '    fin_si'],
    ['incI', '  fin_desde'],
    ['end', 'fin_procedimiento'],
  ],
  flowchart: {
    nodes: [
      { id: 'start', type: 'terminal', text: 'Inicio' },
      { id: 'initI', type: 'process', text: 'i ← 1' },
      { id: 'testI', type: 'decision', text: '¿i ≤ n − 1?' },
      { id: 'setMin', type: 'process', text: 'min ← i\nj ← i + 1' },
      { id: 'testJ', type: 'decision', text: '¿j ≤ n?' },
      { id: 'cmp', type: 'decision', text: '¿A[j] < A[min]?' },
      { id: 'newMin', type: 'process', text: 'min ← j', col: 1 },
      { id: 'incJ', type: 'process', text: 'j ← j + 1' },
      { id: 'checkSwap', type: 'decision', text: '¿min ≠ i?' },
      { id: 'swap', type: 'process', text: 'intercambiar(A[i], A[min])', col: 1 },
      { id: 'incI', type: 'process', text: 'i ← i + 1' },
      { id: 'end', type: 'terminal', text: 'Fin' },
    ],
    edges: [
      { from: 'start', to: 'initI' },
      { from: 'initI', to: 'testI' },
      { from: 'testI', to: 'setMin', label: 'Sí' },
      { from: 'testI', to: 'end', label: 'No', route: 'around', side: 'right', lane: 1 },
      { from: 'setMin', to: 'testJ' },
      { from: 'testJ', to: 'cmp', label: 'Sí' },
      { from: 'testJ', to: 'checkSwap', label: 'No', route: 'around', side: 'right', lane: 0 },
      { from: 'cmp', to: 'newMin', label: 'Sí', route: 'branch' },
      { from: 'cmp', to: 'incJ', label: 'No' },
      { from: 'newMin', to: 'incJ' },
      { from: 'incJ', to: 'testJ', route: 'around', side: 'left', lane: 0 },
      { from: 'checkSwap', to: 'swap', label: 'Sí', route: 'branch' },
      { from: 'checkSwap', to: 'incI', label: 'No' },
      { from: 'swap', to: 'incI' },
      { from: 'incI', to: 'testI', route: 'around', side: 'left', lane: 1 },
    ],
  },
  sort,
};
