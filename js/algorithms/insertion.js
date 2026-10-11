import { Op, step, swapInPlace, indices } from '../core/steps.js';

function* sort(a) {
  const n = a.length;
  let i = 1;

  yield step('start', { note: 'Empieza la inserción directa, el método de la baraja.' });
  yield step('initI', { vars: { i: 2 } });

  while (true) {
    const more = i < n;
    yield step('testI', { branch: more, vars: { i: i + 1 } });
    if (!more) break;

    const aux = a[i];
    let j = i - 1;
    yield step('take', {
      ops: [Op.lift(i)],
      vars: { i: i + 1, j: j + 1, aux },
      note: `Tomamos ${aux} para colocarlo entre los ya ordenados.`,
    });

    while (true) {
      const shift = j >= 0 && a[j] > aux;
      yield step('testW', {
        branch: shift,
        ops: j >= 0 ? [Op.compare(j, j + 1)] : [],
        vars: { i: i + 1, j: j + 1, aux },
        note: j >= 0 ? `¿${a[j]} > ${aux}? ${shift ? 'Sí → desplazar' : 'No'}` : 'Llegamos al inicio del vector.',
      });
      if (!shift) break;

      // Desplazar A[j] a la derecha equivale a que aux avance una posición a la izquierda.
      swapInPlace(a, j, j + 1);
      yield step('shift', { ops: [Op.swap(j, j + 1)], vars: { i: i + 1, j, aux } });
      j -= 1;
    }

    yield step('place', { ops: [Op.drop(j + 1)], vars: { i: i + 1, j: j + 1, aux } });
    i += 1;
    yield step('incI', { vars: { i: i + 1 } });
  }

  yield step('end', { ops: [Op.sorted(indices(0, n - 1))], note: 'Vector ordenado.' });
}

export default {
  id: 'insertion',
  name: 'Inserción',
  family: 'Inserción',
  group: 'directo',
  summary: 'Toma cada elemento y lo coloca en su lugar entre los ya ordenados, como al acomodar cartas.',
  description:
    'Avanza desde el segundo elemento. Guarda cada valor en aux y mueve a la derecha los mayores hasta abrirle un hueco. Si el vector ya está ordenado, solo hace n − 1 comparaciones. Una variante, la inserción binaria, encuentra el hueco con búsqueda binaria.',
  complexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
  stable: true,
  inPlace: true,
  comparative: true,
  efficiency: { score: 3, label: 'Media', note: 'Muy buena con pocos datos o casi ordenados; Shell y Timsort parten de ella.' },
  example: [5, 14, 24, 39, 43, 65, 84, 45],
  pseudocode: [
    ['start', 'procedimiento insercion(A, n)'],
    ['testI', '  desde i ← 2 hasta n hacer'],
    ['take', '    aux ← A[i]'],
    ['take', '    j ← i − 1'],
    ['testW', '    mientras (j ≥ 1) y (A[j] > aux) hacer'],
    ['shift', '      A[j+1] ← A[j]'],
    ['shift', '      j ← j − 1'],
    [null, '    fin_mientras'],
    ['place', '    A[j+1] ← aux'],
    ['incI', '  fin_desde'],
    ['end', 'fin_procedimiento'],
  ],
  flowchart: {
    nodes: [
      { id: 'start', type: 'terminal', text: 'Inicio' },
      { id: 'initI', type: 'process', text: 'i ← 2' },
      { id: 'testI', type: 'decision', text: '¿i ≤ n?' },
      { id: 'take', type: 'process', text: 'aux ← A[i]\nj ← i − 1' },
      { id: 'testW', type: 'decision', text: '¿j ≥ 1 y\nA[j] > aux?' },
      { id: 'shift', type: 'process', text: 'A[j+1] ← A[j]\nj ← j − 1' },
      { id: 'place', type: 'process', text: 'A[j+1] ← aux' },
      { id: 'incI', type: 'process', text: 'i ← i + 1' },
      { id: 'end', type: 'terminal', text: 'Fin' },
    ],
    edges: [
      { from: 'start', to: 'initI' },
      { from: 'initI', to: 'testI' },
      { from: 'testI', to: 'take', label: 'Sí' },
      { from: 'testI', to: 'end', label: 'No', route: 'around', side: 'right', lane: 1 },
      { from: 'take', to: 'testW' },
      { from: 'testW', to: 'shift', label: 'Sí' },
      { from: 'testW', to: 'place', label: 'No', route: 'around', side: 'right', lane: 0 },
      { from: 'shift', to: 'testW', route: 'around', side: 'left', lane: 0 },
      { from: 'place', to: 'incI' },
      { from: 'incI', to: 'testI', route: 'around', side: 'left', lane: 1 },
    ],
  },
  sort,
};
