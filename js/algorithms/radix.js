import { Op, step, indices } from '../core/steps.js';

const BASE = 10;
const digitOf = (value, exp) => Math.floor(value / exp) % BASE;
const passCount = (max) => {
  const passes = String(max).length;
  return passes === 1 ? 'basta una pasada' : `hacen falta ${passes} pasadas`;
};

function* sort(a) {
  const n = a.length;
  const max = Math.max(...a);
  let exp = 1;

  yield step('start', { note: 'Empieza Radix Sort. Aquí no se compara ningún par de elementos.' });
  yield step('findMax', { ops: [Op.digit(exp)], vars: { max, exp }, note: `El mayor es ${max}: ${passCount(max)}.` });

  while (true) {
    const more = Math.floor(max / exp) > 0;
    yield step('testExp', { branch: more, vars: { max, exp } });
    if (!more) break;

    const buckets = Array.from({ length: BASE }, () => []);
    let i = 0;
    yield step('initI', { vars: { exp, i: 1 } });

    while (true) {
      const inRange = i < n;
      yield step('testI', { branch: inRange, vars: { exp, i: i + 1 } });
      if (!inRange) break;

      const d = digitOf(a[i], exp);
      buckets[d].push(a[i]);
      yield step('dist', { ops: [Op.toBucket(i, d)], vars: { exp, i: i + 1, d }, note: `${a[i]} → cubeta ${d}` });
      i += 1;
    }

    let k = 0;
    let d = 0;
    yield step('initK', { vars: { exp, k: 1, d } });

    while (true) {
      const inRange = d < BASE;
      yield step('testD', { branch: inRange, vars: { exp, k: k + 1, d } });
      if (!inRange) break;

      while (true) {
        const empty = buckets[d].length === 0;
        yield step('testQ', { branch: empty, vars: { exp, k: k + 1, d } });
        if (empty) break;

        a[k] = buckets[d].shift();
        k += 1;
        yield step('collect', { ops: [Op.collect(d, k - 1)], vars: { exp, k: k + 1, d }, note: `Cubeta ${d} → A[${k}] = ${a[k - 1]}` });
      }

      d += 1;
      yield step('incD', { vars: { exp, k: k + 1, d } });
    }

    exp *= BASE;
    yield step('nextExp', { ops: [Op.digit(exp)], vars: { exp }, note: 'Pasamos al siguiente dígito.' });
  }

  yield step('end', { ops: [Op.digit(null), Op.sorted(indices(0, n - 1))], note: 'Vector ordenado sin una sola comparación.' });
}

/** Estado del vector tras cada pasada (para la explicación estática). */
export function lsdPasses(values) {
  const max = Math.max(...values);
  const passes = [];
  let current = [...values];
  for (let exp = 1; Math.floor(max / exp) > 0; exp *= BASE) {
    const buckets = Array.from({ length: BASE }, () => []);
    current.forEach((value) => buckets[digitOf(value, exp)].push(value));
    current = buckets.flat();
    passes.push({ exp, values: current });
  }
  return passes;
}

export default {
  id: 'radix',
  name: 'Radix Sort',
  family: 'Distribución',
  group: 'nuevo',
  isNew: true,
  usesBuckets: true,
  summary: 'Reparte los números en 10 cubetas según cada dígito, de las unidades hacia arriba, y los vuelve a juntar.',
  description:
    'También se llama ordenación por residuos. Para cada dígito, empezando por las unidades, reparte los números en cubetas del 0 al 9 y luego los recoge en el orden en que llegaron. Como cada pasada respeta el orden anterior, al terminar la última el vector queda ordenado sin haber comparado ningún par de elementos. Si las claves tienen longitud fija, su costo crece de forma lineal.',
  complexity: { best: 'O(d·(n+b))', average: 'O(d·(n+b))', worst: 'O(d·(n+b))', space: 'O(n + b)' },
  stable: true,
  inPlace: false,
  comparative: false,
  efficiency: { score: 5, label: 'Muy alta*', note: '*Con enteros o claves de longitud fija. Necesita memoria extra para las cubetas.' },
  example: [170, 45, 75, 90, 802, 24, 2, 66],
  inputRange: { min: 2, max: 999 },
  pseudocode: [
    ['start', 'procedimiento radix(A, n)'],
    ['findMax', '  max ← mayor(A) ; exp ← 1'],
    ['testExp', '  mientras max div exp > 0 hacer'],
    ['testI', '    desde i ← 1 hasta n hacer'],
    ['dist', '      d ← (A[i] div exp) mod 10'],
    ['dist', '      encolar(cubeta[d], A[i])'],
    [null, '    fin_desde'],
    ['initK', '    k ← 1'],
    ['testD', '    desde d ← 0 hasta 9 hacer'],
    ['testQ', '      mientras no vacia(cubeta[d]) hacer'],
    ['collect', '        A[k] ← desencolar(cubeta[d])'],
    ['collect', '        k ← k + 1'],
    [null, '      fin_mientras'],
    ['incD', '    fin_desde'],
    ['nextExp', '    exp ← exp * 10'],
    [null, '  fin_mientras'],
    ['end', 'fin_procedimiento'],
  ],
  flowchart: {
    nodes: [
      { id: 'start', type: 'terminal', text: 'Inicio' },
      { id: 'findMax', type: 'process', text: 'max ← mayor(A)\nexp ← 1' },
      { id: 'testExp', type: 'decision', text: '¿max div exp > 0?' },
      { id: 'initI', type: 'process', text: 'i ← 1' },
      { id: 'testI', type: 'decision', text: '¿i ≤ n?' },
      { id: 'dist', type: 'process', text: 'd ← (A[i] div exp) mod 10\nencolar(cubeta[d], A[i])\ni ← i + 1' },
      { id: 'initK', type: 'process', text: 'k ← 1 ; d ← 0' },
      { id: 'testD', type: 'decision', text: '¿d ≤ 9?' },
      { id: 'testQ', type: 'decision', text: '¿cubeta[d]\nvacía?' },
      { id: 'collect', type: 'process', text: 'A[k] ← desencolar(cubeta[d])\nk ← k + 1' },
      { id: 'incD', type: 'process', text: 'd ← d + 1' },
      { id: 'nextExp', type: 'process', text: 'exp ← exp × 10' },
      { id: 'end', type: 'terminal', text: 'Fin' },
    ],
    edges: [
      { from: 'start', to: 'findMax' },
      { from: 'findMax', to: 'testExp' },
      { from: 'testExp', to: 'initI', label: 'Sí' },
      { from: 'testExp', to: 'end', label: 'No', route: 'around', side: 'right', lane: 2 },
      { from: 'initI', to: 'testI' },
      { from: 'testI', to: 'dist', label: 'Sí' },
      { from: 'testI', to: 'initK', label: 'No', route: 'around', side: 'right', lane: 0 },
      { from: 'dist', to: 'testI', route: 'around', side: 'left', lane: 0 },
      { from: 'initK', to: 'testD' },
      { from: 'testD', to: 'testQ', label: 'Sí' },
      { from: 'testD', to: 'nextExp', label: 'No', route: 'around', side: 'right', lane: 1 },
      { from: 'testQ', to: 'collect', label: 'No' },
      { from: 'testQ', to: 'incD', label: 'Sí', route: 'around', side: 'right', lane: 0 },
      { from: 'collect', to: 'testQ', route: 'around', side: 'left', lane: 0 },
      { from: 'incD', to: 'testD', route: 'around', side: 'left', lane: 1 },
      { from: 'nextExp', to: 'testExp', route: 'around', side: 'left', lane: 2 },
    ],
  },
  sort,
};
