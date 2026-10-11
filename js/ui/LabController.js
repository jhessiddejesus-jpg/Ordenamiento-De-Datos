import { $, $$, h } from '../utils/dom.js';
import { Player } from '../core/Player.js';
import { buildTrace } from '../core/trace.js';
import { randomArray } from '../core/random.js';
import { inputRangeOf } from '../algorithms/index.js';
import { FlowchartView } from './flowchart/FlowchartView.js';
import { ArrayVisualizer } from './ArrayVisualizer.js';
import { PseudocodeView } from './PseudocodeView.js';
import { VariablesView } from './VariablesView.js';
import { StatsView } from './StatsView.js';
import { LegendView, featuresOf } from './LegendView.js';
import { Mascot } from './Mascot.js';

const MAX_ANIMATION = 0.55;

/**
 * Orquesta el laboratorio: elige algoritmo y datos, construye la traza
 * y reparte cada paso a las vistas. No dibuja nada por sí mismo.
 */
export class LabController {
  #root;
  #algorithms;
  #algorithm = null;
  #input = [];
  #trace = [];
  #lastIndex = -1;
  #player = new Player();
  #views;
  #controls;

  constructor(root, algorithms) {
    this.#root = root;
    this.#algorithms = algorithms;
    this.#views = {
      flow: new FlowchartView($('[data-flowchart]', root)),
      array: new ArrayVisualizer($('[data-visualizer]', root)),
      code: new PseudocodeView($('[data-pseudocode]', root)),
      vars: new VariablesView($('[data-vars]', root)),
      stats: new StatsView($('[data-stats]', root)),
      legend: new LegendView($('[data-legend]', root)),
      mascot: new Mascot($('[data-visualizer]', root)),
    };
    this.#controls = {
      scrub: $('[data-control="scrub"]', root),
      speed: $('[data-control="speed"]', root),
      size: $('[data-control="size"]', root),
      progress: $('[data-output="progress"]', root),
      speedOut: $('[data-output="speed"]', root),
      toggle: $('[data-action="toggle"]', root),
      narration: $('[data-narration]', root),
      title: $('[data-lab-title]', root),
    };

    this.#renderTabs();
    this.#bindControls();
    this.#player.on('step', (event) => this.#onStep(event));
    this.#player.on('state', ({ playing }) => this.#onPlayState(playing));
  }

  select(id) {
    const algorithm = this.#algorithms.find((candidate) => candidate.id === id);
    if (!algorithm || algorithm === this.#algorithm) return;
    this.#algorithm = algorithm;

    $$('[role="tab"]', this.#root).forEach((tab) => tab.setAttribute('aria-selected', String(tab.dataset.id === id)));
    this.#controls.title.textContent = `Vector · ${algorithm.name}`;
    this.#views.flow.render(algorithm.flowchart, { title: `Diagrama de flujo de ${algorithm.name}` });
    this.#views.code.render(algorithm.pseudocode);
    this.#setInput(algorithm.example);
  }

  // ── Datos ───────────────────────────────────────────────

  #setInput(values) {
    this.#input = [...values];
    this.#trace = buildTrace(this.#algorithm, this.#input);
    this.#controls.scrub.max = String(this.#trace.length - 1);
    this.#views.legend.render(featuresOf(this.#trace));
    this.#views.mascot.reset();
    this.#player.load(this.#trace);
  }

  #shuffle() {
    const size = Number(this.#controls.size.value);
    this.#setInput(randomArray(size, inputRangeOf(this.#algorithm)));
  }

  // ── Pasos ───────────────────────────────────────────────

  #onStep({ index, step, mode }) {
    const sequential = mode === 'forward' && index === this.#lastIndex + 1;
    const duration = Math.min(MAX_ANIMATION, this.#player.delay * 0.85);

    if (sequential) {
      this.#views.array.apply(step.ops, { animate: true, duration });
      this.#views.flow.goTo(step.at, this.#trace[index - 1]?.at ?? null, { duration });
      this.#guide({ animate: true, duration, finished: index === this.#trace.length - 1 });
    } else {
      this.#replayUntil(index);
      if (step) this.#views.flow.goTo(step.at, null);
      else this.#views.flow.clear();
      this.#guide({ animate: false });
    }

    this.#views.code.highlight(step?.at ?? null);
    this.#views.vars.render(step?.vars);
    this.#views.stats.render(step?.stats);
    this.#controls.narration.textContent = this.#narrate(step);
    this.#controls.scrub.value = String(index);
    this.#controls.progress.textContent = `${index + 1} / ${this.#trace.length}`;
    this.#lastIndex = index;
  }

  /** Bit salta al protagonista del paso; si el paso no toca el vector, se queda donde está y calla. */
  #guide({ animate, duration, finished = false }) {
    const { array, mascot } = this.#views;
    const idle = this.#player.index < 0 ? { box: array.boxAt(0), cue: null } : null;
    const focus = animate ? array.focus : (array.lastFocus ?? idle);
    if (focus) mascot.moveTo(focus.box, { animate, duration, cue: focus.cue });
    else mascot.say(null);
    if (finished) mascot.celebrate();
  }

  /** Reconstruye el estado del vector hasta `index` sin animar (para retroceder o saltar). */
  #replayUntil(index) {
    const array = this.#views.array;
    array.load(this.#input, { buckets: Boolean(this.#algorithm.usesBuckets) });
    for (let k = 0; k <= index; k += 1) array.apply(this.#trace[k].ops, { render: false });
    array.render({ animate: false });
  }

  #narrate(step) {
    if (!step) return 'Pulsa ▶ para empezar.';
    if (step.note) return step.note;
    const node = this.#algorithm.flowchart.nodes.find((candidate) => candidate.id === step.at);
    const text = node.text.replaceAll('\n', ' · ');
    return step.branch === undefined ? text : `${text} → ${step.branch ? 'Sí' : 'No'}`;
  }

  #onPlayState(playing) {
    this.#controls.toggle.setAttribute('aria-label', playing ? 'Pausar' : 'Reproducir');
    this.#root.classList.toggle('is-playing', playing);
  }

  // ── Controles ───────────────────────────────────────────

  #renderTabs() {
    const tabs = this.#algorithms.map((algorithm) => h('button', {
      class: `lab__tab${algorithm.isNew ? ' lab__tab--new' : ''}`,
      role: 'tab',
      'aria-selected': 'false',
      dataset: { id: algorithm.id },
      onclick: () => this.select(algorithm.id),
    }, [
      h('span', { class: 'lab__tab-name', text: algorithm.name }),
      h('code', { class: 'lab__tab-o', text: algorithm.complexity.average }),
    ]));
    $('[data-lab-tabs]', this.#root).replaceChildren(...tabs);
  }

  #bindControls() {
    const actions = {
      toggle: () => this.#player.toggle(),
      next: () => { this.#player.pause(); this.#player.next(); },
      prev: () => { this.#player.pause(); this.#player.prev(); },
      reset: () => { this.#player.pause(); this.#player.seek(-1); },
      shuffle: () => this.#shuffle(),
      example: () => this.#setInput(this.#algorithm.example),
      mascot: (button) => {
        const visible = button.getAttribute('aria-pressed') !== 'true';
        button.setAttribute('aria-pressed', String(visible));
        this.#views.mascot.setVisible(visible);
      },
    };
    $$('[data-action]', this.#root).forEach((button) =>
      button.addEventListener('click', () => actions[button.dataset.action]?.(button)));

    const { scrub, speed, size, speedOut } = this.#controls;
    scrub.addEventListener('input', () => { this.#player.pause(); this.#player.seek(Number(scrub.value)); });
    speed.addEventListener('input', () => {
      this.#player.setSpeed(Number(speed.value));
      speedOut.textContent = `${speed.value}×`;
    });
    size.addEventListener('change', () => this.#shuffle());

    document.addEventListener('keydown', (event) => this.#onKey(event));
  }

  #onKey(event) {
    const typing = event.target.closest?.('input, select, textarea, dialog')
      || (event.key === ' ' && event.target.closest?.('button, a'));
    const bounds = this.#root.getBoundingClientRect();
    const visible = bounds.top < window.innerHeight * 0.6 && bounds.bottom > window.innerHeight * 0.4;
    if (typing || !visible) return;

    const keys = {
      ' ': () => this.#player.toggle(),
      ArrowRight: () => { this.#player.pause(); this.#player.next(); },
      ArrowLeft: () => { this.#player.pause(); this.#player.prev(); },
    };
    if (!keys[event.key]) return;
    event.preventDefault();
    keys[event.key]();
  }
}
