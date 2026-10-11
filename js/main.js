/**
 * Raíz de composición: crea las piezas, inyecta dependencias y conecta callbacks.
 * Ningún módulo de UI conoce a los demás; sólo este archivo los une.
 */
import { ScrollTrigger } from './lib/gsap.js';
import { $ } from './utils/dom.js';
import { algorithms, getAlgorithm } from './algorithms/index.js';
import { conceptMap } from './data/conceptMap.js';
import { initHero } from './ui/Hero.js';
import { initReveal } from './ui/reveal.js';
import { ConceptMap } from './ui/ConceptMap.js';
import { DetailDialog } from './ui/DetailDialog.js';
import { LabController } from './ui/LabController.js';
import { renderComplexityTable } from './ui/ComplexityTable.js';
import { Benchmark } from './ui/Benchmark.js';
import { renderRadixPasses } from './ui/RadixPasses.js';

const RADIX_EXAMPLE = getAlgorithm('radix').example;
const DEFAULT_ALGORITHM = 'bubble';
const DEFAULT_BENCH_SIZE = 200;

const lab = new LabController($('[data-lab]'), algorithms);

function openInLab(id) {
  lab.select(id);
  $('#flujo').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const detail = new DetailDialog($('[data-detail]'), { onExplore: openInLab });

const map = new ConceptMap($('[data-concept-map]'), {
  tree: conceptMap,
  resolveAlgorithm: getAlgorithm,
  onSelect: (id) => detail.open(getAlgorithm(id)),
});

initHero($('#inicio'));
initReveal();
map.animateIn();
lab.select(DEFAULT_ALGORITHM);
renderComplexityTable($('[data-complexity-table]'), algorithms);
new Benchmark($('[data-benchmark]'), algorithms).run(DEFAULT_BENCH_SIZE);
renderRadixPasses($('[data-radix-passes]'), RADIX_EXAMPLE);

document.querySelectorAll('[data-open-lab]').forEach((button) =>
  button.addEventListener('click', () => openInLab(button.dataset.openLab)));

// Las fuentes cambian medidas: recalcular disparadores de scroll cuando terminen de cargar.
document.fonts?.ready.then(() => ScrollTrigger.refresh());
