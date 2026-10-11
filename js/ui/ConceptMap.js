import { gsap, ScrollTrigger, prefersReducedMotion } from '../lib/gsap.js';
import { EASE, DURATION, STAGGER } from '../lib/motion.js';
import { h, s, offsetWithin } from '../utils/dom.js';
import { efficiencyMeter, complexityBadge } from './components.js';

const LABEL_T = 0.62; // posición de la palabra de enlace sobre la curva (0 = padre, 1 = hijo)
const MIN_SCALE = 0.7;

/** Punto de una curva cúbica de Bézier vertical entre p y c. */
function bezierPoint(p, c, t) {
  const midY = (p.y + c.y) / 2;
  const points = [p, { x: p.x, y: midY }, { x: c.x, y: midY }, c];
  const u = 1 - t;
  const weights = [u ** 3, 3 * u * u * t, 3 * u * t * t, t ** 3];
  return points.reduce((acc, point, k) => ({ x: acc.x + point.x * weights[k], y: acc.y + point.y * weights[k] }), { x: 0, y: 0 });
}

/**
 * Renderiza el mapa como árbol HTML (el texto se acomoda solo) y dibuja
 * los conectores en un SVG superpuesto calculado a partir del layout.
 */
export class ConceptMap {
  #root;
  #canvas;
  #svg;
  #labels;
  #links = [];
  #resolve;
  #onSelect;

  constructor(root, { tree, resolveAlgorithm, onSelect }) {
    this.#root = root;
    this.#resolve = resolveAlgorithm;
    this.#onSelect = onSelect;

    this.#svg = s('svg', { class: 'cmap__links', 'aria-hidden': 'true' });
    this.#labels = h('div', { class: 'cmap__labels', 'aria-hidden': 'true' });
    this.#canvas = h('div', { class: 'cmap__canvas' }, [
      this.#svg,
      this.#labels,
      h('ul', { class: 'cmap__tree' }, [this.#renderBranch(tree, null)]),
    ]);
    root.replaceChildren(this.#canvas);
    this.#relayout();

    const observer = new ResizeObserver(() => this.#relayout());
    observer.observe(root);
    observer.observe(this.#canvas);
    document.fonts?.ready.then(() => this.#relayout());
  }

  /** Animación de entrada al hacer scroll hasta el mapa. */
  animateIn() {
    if (prefersReducedMotion) return;
    const cards = this.#canvas.querySelectorAll('.cnode');
    const labels = this.#labels.children;
    gsap.set(cards, { opacity: 0, y: 16, scale: 0.96 });
    gsap.set(labels, { opacity: 0 });
    gsap.set(this.#svg, { opacity: 0 });

    ScrollTrigger.create({
      trigger: this.#root,
      start: 'top 75%',
      once: true,
      onEnter: () => {
        const paths = [...this.#svg.querySelectorAll('path')];
        paths.forEach((path) => {
          const length = path.getTotalLength();
          gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
        });
        gsap.set(this.#svg, { opacity: 1 });
        gsap.timeline()
          .to(cards, { opacity: 1, y: 0, scale: 1, duration: DURATION.reveal, ease: EASE.out, stagger: STAGGER.normal })
          .to(paths, {
            strokeDashoffset: 0, duration: DURATION.reveal, ease: EASE.inOut, stagger: STAGGER.tight,
            onComplete: () => gsap.set(paths, { clearProps: 'strokeDasharray,strokeDashoffset' }),
          }, 0.2)
          .to(labels, { opacity: 1, duration: DURATION.ui, stagger: STAGGER.tight }, '-=0.4');
      },
    });
  }

  // ── Construcción ────────────────────────────────────────

  #renderBranch(node, parentCard) {
    const card = node.algorithm ? this.#algorithmCard(this.#resolve(node.algorithm)) : this.#conceptCard(node);
    if (parentCard) this.#links.push({ from: parentCard, to: card, label: node.link });

    const children = node.children ?? [];
    return h('li', {}, [
      card,
      children.length ? h('ul', {}, children.map((child) => this.#renderBranch(child, card))) : null,
    ]);
  }

  #conceptCard({ label, text, kind }) {
    return h('div', { class: `cnode cnode--${kind.split(' ').join(' cnode--')}` }, [
      h('strong', { class: 'cnode__title', text: label }),
      text && h('span', { class: 'cnode__text', text }),
    ]);
  }

  #algorithmCard(algorithm) {
    return h('button', {
      class: `cnode cnode--algo${algorithm.isNew ? ' cnode--new' : ''}`,
      type: 'button',
      'aria-haspopup': 'dialog',
      onclick: () => this.#onSelect(algorithm.id),
    }, [
      h('span', { class: 'cnode__family', text: algorithm.family }),
      h('strong', { class: 'cnode__title', text: algorithm.name }),
      h('span', { class: 'cnode__text', text: algorithm.summary }),
      h('span', { class: 'cnode__o' }, [h('small', { text: 'Big O' }), complexityBadge(algorithm.complexity.average)]),
      efficiencyMeter(algorithm.efficiency),
    ]);
  }

  // ── Layout de conectores ────────────────────────────────

  #relayout() {
    this.#fitToWidth();
    const width = this.#canvas.offsetWidth;
    const height = this.#canvas.offsetHeight;
    this.#svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    this.#svg.setAttribute('width', width);
    this.#svg.setAttribute('height', height);

    const existingPaths = this.#svg.children;
    const existingLabels = this.#labels.children;
    this.#links.forEach(({ from, to, label }, index) => {
      const a = offsetWithin(from, this.#canvas);
      const b = offsetWithin(to, this.#canvas);
      const p = { x: a.x + a.width / 2, y: a.y + a.height };
      const c = { x: b.x + b.width / 2, y: b.y };
      const midY = (p.y + c.y) / 2;
      const d = `M ${p.x} ${p.y} C ${p.x} ${midY} ${c.x} ${midY} ${c.x} ${c.y}`;

      const path = existingPaths[index] ?? this.#svg.appendChild(s('path', {}));
      path.setAttribute('d', d);

      const pill = existingLabels[index] ?? this.#labels.appendChild(h('span', { class: 'cmap__label', text: label }));
      const point = bezierPoint(p, c, LABEL_T);
      pill.style.left = `${point.x}px`;
      pill.style.top = `${point.y}px`;
    });
  }

  /** Escala el mapa para que quepa; por debajo de MIN_SCALE se usa scroll horizontal. */
  #fitToWidth() {
    this.#canvas.style.transform = '';
    this.#root.style.height = '';
    const natural = this.#canvas.offsetWidth;
    const style = getComputedStyle(this.#root);
    const available = this.#root.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const scale = Math.min(1, available / natural);
    const scaled = scale < 1 && scale >= MIN_SCALE;

    this.#root.classList.toggle('is-scaled', scaled);
    this.#root.classList.toggle('is-scrollable', !scaled && natural > available);
    if (scaled) {
      const offset = (available - natural * scale) / 2;
      this.#canvas.style.transform = `translateX(${offset}px) scale(${scale})`;
      this.#root.style.height = `${this.#canvas.offsetHeight * scale}px`;
    }
  }
}
