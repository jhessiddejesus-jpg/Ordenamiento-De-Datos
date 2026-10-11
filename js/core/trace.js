/** Convierte la ejecución de un algoritmo en datos: pasos + contadores acumulados. */

const emptyCounts = () => ({ comparisons: 0, swaps: 0, writes: 0 });

const TALLY = {
  compare: (counts) => { counts.comparisons += 1; },
  swap: (counts, op) => { if (op.a !== op.b) counts.swaps += 1; },
  toBucket: (counts) => { counts.writes += 1; },
  collect: (counts) => { counts.writes += 1; },
};

function tally(counts, ops) {
  for (const op of ops) TALLY[op.type]?.(counts, op);
}

/** Ejecuta el algoritmo y guarda todos los pasos (para reproducir, avanzar y retroceder). */
export function buildTrace(algorithm, input) {
  const counts = emptyCounts();
  const steps = [];
  for (const step of algorithm.sort([...input])) {
    tally(counts, step.ops);
    steps.push({ ...step, stats: { ...counts } });
  }
  return steps;
}

/** Solo cuenta operaciones (para la carrera de algoritmos con n grande). */
export function countOperations(algorithm, input) {
  const counts = emptyCounts();
  const output = [...input];
  for (const step of algorithm.sort(output)) tally(counts, step.ops);
  return { ...counts, output };
}
