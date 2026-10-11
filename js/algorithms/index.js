/**
 * Registro de algoritmos (abierto/cerrado): para añadir uno nuevo basta con crear
 * su módulo con la misma forma y agregarlo a esta lista. Ninguna vista cambia.
 */
import bubble from './bubble.js';
import selection from './selection.js';
import insertion from './insertion.js';
import shell from './shell.js';
import quick from './quick.js';
import radix from './radix.js';

export const algorithms = Object.freeze([bubble, selection, insertion, shell, quick, radix]);

export function getAlgorithm(id) {
  const algorithm = algorithms.find((candidate) => candidate.id === id);
  if (!algorithm) throw new Error(`Algoritmo desconocido: ${id}`);
  return algorithm;
}

export const DEFAULT_INPUT_RANGE = Object.freeze({ min: 5, max: 99 });
export const inputRangeOf = (algorithm) => algorithm.inputRange ?? DEFAULT_INPUT_RANGE;
