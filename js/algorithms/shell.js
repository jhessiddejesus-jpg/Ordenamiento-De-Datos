import { Op, step, swapInPlace, indices } from '../core/steps.js';

function* sort(a) {
  const n = a.length;
  let salto = Math.floor(n / 2);

  yield step('start', { note: 'Empieza el método de Shell.' });
  yield step('initS', { vars: { salto } });

  while (true) {
    const more = salto > 0;
    yield step('testS', { branch: more, vars: { salto } });
    if (!more) break;

    let sw;
    do {
      sw = false;
      let i = 0;
      yield step('pass', { vars: { salto, i: 1, sw: 'falso' } });

      while (true) {
        const inRange = i < n - salto;
        yield step('testI', { branch: inRange, vars: { salto, i: i + 1 } });
        if (!inRange) break;

        const greater = a[i] > a[i + salto];
        yield step('cmp', {
          branch: greater,
          ops: [Op.compare(i, i + salto)],
          vars: { salto, i: i + 1 },
          note: `Salto ${salto}: ¿${a[i]} > ${a[i + salto]}? ${greater ? 'Sí → intercambiar' : 'No'}`,
        });

        if (greater) {
          swapInPlace(a, i, i + salto);
          sw = true;
          yield step('swap', { ops: [Op.swap(i, i + salto)], vars: { salto, i: i + 1, sw: 'verdadero' } });
        }

        i += 1;
        yield step('incI', { vars: { salto, i: i + 1 } });
      }

      yield step('testSw', { branch: sw, vars: { salto, sw: sw ? 'verdadero' : 'falso' } });
    } while (sw);

    salto = Math.floor(salto / 2);
    yield step('half', { vars: { salto }, note: `Ahora el salto es ${salto}.` });
  }

  yield step('end', { ops: [Op.sorted(indices(0, n - 1))], note: 'Vector ordenado.' });
}

export default {
  id: 'shell',
  name: 'Shell',
  family: 'Inserción por saltos',
  group: 'avanzado',
  summary: 'Compara elementos separados por un salto que se reduce a la mitad hasta llegar a 1.',
  description:
    'Mejora de la inserción que propuso Donald Shell en 1959. Compara A[i] con A[i + salto], empezando con salto = n div 2, y repite cada recorrido mientras haya intercambios; después reduce el salto a la mitad. Así los valores muy desubicados viajan lejos desde el principio y la última pasada casi no tiene trabajo.',
  complexity: { best: 'O(n log n)', average: '≈ O(n^1.5)', worst: 'O(n²)', space: 'O(1)' },
  stable: false,
  inPlace: true,
  comparative: true,
  efficiency: { score: 4, label: 'Alta', note: 'Muy buena para tamaños medianos y sin memoria extra; depende de los saltos elegidos.' },
  example: [6, 1, 5, 2, 3, 4, 0],
  pseudocode: [
    ['start', 'procedimiento shell(A, n)'],
    ['initS', '  salto ← n div 2'],
    ['testS', '  mientras salto > 0 hacer'],
    [null, '    repetir'],
    ['pass', '      sw ← falso'],
    ['testI', '      desde i ← 1 hasta n − salto hacer'],
    ['cmp', '        si A[i] > A[i + salto] entonces'],
    ['swap', '          intercambiar(A[i], A[i + salto])'],
    ['swap', '          sw ← verdadero'],
    [null, '        fin_si'],
    ['incI', '      fin_desde'],
    ['testSw', '    hasta_que no sw'],
    ['half', '    salto ← salto div 2'],
    [null, '  fin_mientras'],
    ['end', 'fin_procedimiento'],
  ],
  flowchart: {
    nodes: [
      { id: 'start', type: 'terminal', text: 'Inicio' },
      { id: 'initS', type: 'process', text: 'salto ← n div 2' },
      { id: 'testS', type: 'decision', text: '¿salto > 0?' },
      { id: 'pass', type: 'process', text: 'sw ← falso\ni ← 1' },
      { id: 'testI', type: 'decision', text: '¿i ≤ n − salto?' },
      { id: 'cmp', type: 'decision', text: '¿A[i] > A[i+salto]?' },
      { id: 'swap', type: 'process', text: 'intercambiar(A[i], A[i+salto])\nsw ← verdadero', col: 1 },
      { id: 'incI', type: 'process', text: 'i ← i + 1' },
      { id: 'testSw', type: 'decision', text: '¿sw?' },
      { id: 'half', type: 'process', text: 'salto ← salto div 2' },
      { id: 'end', type: 'terminal', text: 'Fin' },
    ],
    edges: [
      { from: 'start', to: 'initS' },
      { from: 'initS', to: 'testS' },
      { from: 'testS', to: 'pass', label: 'Sí' },
      { from: 'testS', to: 'end', label: 'No', route: 'around', side: 'right', lane: 1 },
      { from: 'pass', to: 'testI' },
      { from: 'testI', to: 'cmp', label: 'Sí' },
      { from: 'testI', to: 'testSw', label: 'No', route: 'around', side: 'right', lane: 0 },
      { from: 'cmp', to: 'swap', label: 'Sí', route: 'branch' },
      { from: 'cmp', to: 'incI', label: 'No' },
      { from: 'swap', to: 'incI' },
      { from: 'incI', to: 'testI', route: 'around', side: 'left', lane: 0 },
      { from: 'testSw', to: 'pass', label: 'Sí', route: 'around', side: 'left', lane: 1 },
      { from: 'testSw', to: 'half', label: 'No' },
      { from: 'half', to: 'testS', route: 'around', side: 'left', lane: 2 },
    ],
  },
  sort,
};
