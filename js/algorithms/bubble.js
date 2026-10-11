import { Op, step, swapInPlace, indices } from '../core/steps.js';

function* sort(a) {
  const n = a.length;
  let i = 1;
  let sorted;

  yield step('start', { note: 'Empieza el método de la burbuja.' });
  yield step('init', { vars: { i } });

  do {
    sorted = true;
    let j = 0;
    yield step('flag', { vars: { i, j: 1, ordenado: 'verdadero' } });

    while (true) {
      const inRange = j < n - i;
      yield step('testJ', { branch: inRange, vars: { i, j: j + 1 } });
      if (!inRange) break;

      const greater = a[j] > a[j + 1];
      yield step('cmp', {
        branch: greater,
        ops: [Op.compare(j, j + 1)],
        vars: { i, j: j + 1 },
        note: `¿${a[j]} > ${a[j + 1]}? ${greater ? 'Sí → intercambiar' : 'No'}`,
      });

      if (greater) {
        swapInPlace(a, j, j + 1);
        sorted = false;
        yield step('swap', { ops: [Op.swap(j, j + 1)], vars: { i, j: j + 1, ordenado: 'falso' } });
      }

      j += 1;
      yield step('incJ', { vars: { i, j: j + 1 } });
    }

    yield step('incI', {
      ops: [Op.sorted([n - i])],
      vars: { i: i + 1 },
      note: `El mayor de esta pasada ya llegó a la posición ${n - i + 1}.`,
    });
    i += 1;
    yield step('done', { branch: sorted, vars: { ordenado: sorted ? 'verdadero' : 'falso' } });
  } while (!sorted);

  yield step('end', { ops: [Op.sorted(indices(0, n - 1))], note: 'Una pasada sin cambios: el vector ya está ordenado.' });
}

export default {
  id: 'bubble',
  name: 'Burbuja',
  family: 'Intercambio',
  group: 'directo',
  summary: 'Compara vecinos y los intercambia si están al revés; en cada pasada, el mayor llega al final.',
  description:
    'Recorre el vector comparando cada elemento con el siguiente y los intercambia si están en desorden. En cada pasada, el mayor sube hasta el final, como una burbuja. Esta versión se detiene en cuanto una pasada no cambia nada, y no vuelve a revisar la parte que ya quedó ordenada.',
  complexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
  stable: true,
  inPlace: true,
  comparative: true,
  efficiency: { score: 1, label: 'Baja', note: 'Sirve para aprender; en la práctica, solo con listas muy pequeñas o casi ordenadas.' },
  example: [50, 15, 56, 14, 35, 1, 12, 9],
  pseudocode: [
    ['start', 'procedimiento burbuja(A, n)'],
    ['init', '  i ← 1'],
    [null, '  repetir'],
    ['flag', '    ordenado ← verdadero'],
    ['testJ', '    desde j ← 1 hasta n − i hacer'],
    ['cmp', '      si A[j] > A[j+1] entonces'],
    ['swap', '        intercambiar(A[j], A[j+1])'],
    ['swap', '        ordenado ← falso'],
    [null, '      fin_si'],
    ['incJ', '    fin_desde'],
    ['incI', '    i ← i + 1'],
    ['done', '  hasta_que ordenado'],
    ['end', 'fin_procedimiento'],
  ],
  flowchart: {
    nodes: [
      { id: 'start', type: 'terminal', text: 'Inicio' },
      { id: 'init', type: 'process', text: 'i ← 1' },
      { id: 'flag', type: 'process', text: 'ordenado ← verdadero\nj ← 1' },
      { id: 'testJ', type: 'decision', text: '¿j ≤ n − i?' },
      { id: 'cmp', type: 'decision', text: '¿A[j] > A[j+1]?' },
      { id: 'swap', type: 'process', text: 'intercambiar(A[j], A[j+1])\nordenado ← falso', col: 1 },
      { id: 'incJ', type: 'process', text: 'j ← j + 1' },
      { id: 'incI', type: 'process', text: 'i ← i + 1' },
      { id: 'done', type: 'decision', text: '¿ordenado?' },
      { id: 'end', type: 'terminal', text: 'Fin' },
    ],
    edges: [
      { from: 'start', to: 'init' },
      { from: 'init', to: 'flag' },
      { from: 'flag', to: 'testJ' },
      { from: 'testJ', to: 'cmp', label: 'Sí' },
      { from: 'testJ', to: 'incI', label: 'No', route: 'around', side: 'right', lane: 0 },
      { from: 'cmp', to: 'swap', label: 'Sí', route: 'branch' },
      { from: 'cmp', to: 'incJ', label: 'No' },
      { from: 'swap', to: 'incJ' },
      { from: 'incJ', to: 'testJ', route: 'around', side: 'left', lane: 0 },
      { from: 'incI', to: 'done' },
      { from: 'done', to: 'end', label: 'Sí' },
      { from: 'done', to: 'flag', label: 'No', route: 'around', side: 'left', lane: 1 },
    ],
  },
  sort,
};
