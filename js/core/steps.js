/**
 * Protocolo de pasos compartido por todos los algoritmos.
 *
 * Cada algoritmo es un generador que produce pasos { at, branch, ops, vars, note }:
 *  - at:     id del nodo del diagrama de flujo que se está ejecutando.
 *  - branch: para decisiones, la rama tomada (true = Sí, false = No).
 *  - ops:    operaciones visuales sobre el vector (ver `Op`).
 *  - vars:   variables del pseudocódigo para mostrar (ya en base 1).
 *  - note:   narración opcional.
 *
 * Así el diagrama, el pseudocódigo y el vector consumen la misma fuente de verdad.
 */
export const Op = Object.freeze({
  compare: (a, b = null) => ({ type: 'compare', a, b }),
  swap: (a, b) => ({ type: 'swap', a, b }),
  lift: (i) => ({ type: 'lift', i }),
  drop: (i) => ({ type: 'drop', i }),
  mark: (i, role) => ({ type: 'mark', i, role }),
  unmark: (role) => ({ type: 'unmark', role }),
  range: (lo, hi) => ({ type: 'range', lo, hi }),
  sorted: (indices) => ({ type: 'sorted', indices }),
  digit: (exp) => ({ type: 'digit', exp }),
  toBucket: (i, bucket) => ({ type: 'toBucket', i, bucket }),
  collect: (bucket, k) => ({ type: 'collect', bucket, k }),
});

export const step = (at, { ops = [], vars = {}, branch, note } = {}) => ({ at, ops, vars, branch, note });

export function swapInPlace(array, i, j) {
  [array[i], array[j]] = [array[j], array[i]];
}

/** Índices consecutivos [from..to]. */
export const indices = (from, to) => Array.from({ length: Math.max(0, to - from + 1) }, (_, k) => from + k);
