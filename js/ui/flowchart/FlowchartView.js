import { gsap, prefersReducedMotion } from '../../lib/gsap.js';
import { s, uniqueId } from '../../utils/dom.js';
import { EASE, DURATION, STAGGER } from '../../lib/motion.js';
import { layoutFlowchart, edgeKey } from './layout.js';

const TEXT_LINE = 18;

/** Dibuja el diagrama en SVG y anima la "ficha" de ejecución entre nodos. */
export class FlowchartView {
  #root;
  #svg = null;
  #layout = null;
  #nodes = new Map();
  #edges = new Map();
  #token = null;
  #active = null;
  #hotEdge = null;

  constructor(root) {
    this.#root = root;
  }

  render(flowchart, { title = 'Diagrama de flujo' } = {}) {
    this.#layout = layoutFlowchart(flowchart);
    this.#nodes.clear();
    this.#edges.clear();
    this.#active = null;
    this.#hotEdge = null;

    const { x, y, width, height } = this.#layout.bounds;
    const markerId = uniqueId('arrow');

    const edgesLayer = s('g', { class: 'flow__edges' }, this.#layout.edges.map((edge) => this.#renderEdge(edge, markerId)));
    const nodesLayer = s('g', { class: 'flow__nodes' }, this.#layout.nodes.map((node) => this.#renderNode(node)));
    this.#token = s('g', { class: 'flow__token', opacity: 0 }, [
      s('circle', { r: 15, class: 'flow__token-halo' }),
      s('circle', { r: 6, class: 'flow__token-core' }),
    ]);

    this.#svg = s('svg', {
      class: 'flow',
      viewBox: `${x} ${y} ${width} ${height}`,
      role: 'img',
      'aria-label': title,
      style: `min-width:${Math.round(width * 0.78)}px`,
    }, [this.#defs(markerId), edgesLayer, nodesLayer, this.#token]);

    this.#root.replaceChildren(this.#svg);
    this.#root.scrollTo({ top: 0, left: 0 });
    this.#animateIn();
  }

  /** Mueve la ficha al nodo `at`; si existe la flecha desde `from`, viaja por ella. */
  goTo(at, from = null, { duration = 0.45 } = {}) {
    const element = this.#nodes.get(at);
    if (!element) {
      this.clear();
      return;
    }

    this.#setActive(element);
    this.#hotEdge?.classList.remove('is-hot');
    gsap.killTweensOf(this.#token);

    const node = element.__layout;
    const edge = from ? this.#edges.get(edgeKey(from, at)) : null;
    const animate = edge && duration > 0.06 && !prefersReducedMotion;

    if (animate) {
      this.#hotEdge = edge;
      edge.classList.add('is-hot');
      gsap.set(this.#token, { opacity: 1 });
      gsap.to(this.#token, {
        duration,
        ease: EASE.inOut,
        motionPath: { path: edge.querySelector('.flow-edge__line') },
      });
    } else {
      gsap.set(this.#token, { x: node.cx, y: node.top, opacity: 1 });
    }

    this.#pulse(element, duration);
    this.#follow(node);
  }

  clear() {
    this.#active?.classList.remove('is-active');
    this.#active = null;
    this.#hotEdge?.classList.remove('is-hot');
    this.#nodes.forEach((element) => element.classList.remove('is-visited'));
    if (this.#token) gsap.set(this.#token, { opacity: 0 });
  }

  // ── Render ──────────────────────────────────────────────

  #defs(markerId) {
    return s('defs', {}, [
      s('marker', {
        id: markerId, viewBox: '0 0 10 10', refX: 9, refY: 5,
        markerWidth: 8, markerHeight: 8, orient: 'auto-start-reverse',
      }, [s('path', { d: 'M 0 0 L 10 5 L 0 10 z', class: 'flow__arrow' })]),
    ]);
  }

  #renderEdge(edge, markerId) {
    const group = s('g', { class: 'flow-edge', 'data-edge': edge.key }, [
      s('path', { d: edge.d, class: 'flow-edge__line', 'marker-end': `url(#${markerId})` }),
      s('path', { d: edge.d, class: 'flow-edge__flow' }),
      edge.labelPos && s('text', {
        x: edge.labelPos.x, y: edge.labelPos.y, 'text-anchor': edge.labelPos.anchor,
        class: `flow-edge__label ${edge.label === 'Sí' ? 'is-yes' : 'is-no'}`,
        text: edge.label,
      }),
    ]);
    this.#edges.set(edge.key, group);
    return group;
  }

  #renderNode(node) {
    const group = s('g', { class: 'flow-node', 'data-type': node.type, 'data-node': node.id }, [
      this.#shape(node, 'flow-node__halo'),
      this.#shape(node, 'flow-node__shape'),
      ...(node.type === 'call' ? this.#callBars(node) : []),
      this.#label(node),
    ]);
    group.__layout = node;
    this.#nodes.set(node.id, group);
    return group;
  }

  #shape(node, className, extra = {}) {
    const attrs = { class: className, ...extra };
    switch (node.type) {
      case 'decision':
        return s('polygon', {
          ...attrs,
          points: `${node.cx},${node.top} ${node.right},${node.cy} ${node.cx},${node.bottom} ${node.left},${node.cy}`,
        });
      case 'terminal':
        return s('rect', { ...attrs, x: node.left, y: node.top, width: node.width, height: node.height, rx: node.height / 2 });
      default:
        return s('rect', { ...attrs, x: node.left, y: node.top, width: node.width, height: node.height, rx: 10 });
    }
  }

  #callBars(node) {
    return [node.left + 14, node.right - 14].map((x) =>
      s('line', { x1: x, x2: x, y1: node.top, y2: node.bottom, class: 'flow-node__bar' }));
  }

  #label(node) {
    const firstY = node.cy - ((node.lines.length - 1) * TEXT_LINE) / 2;
    return s('text', { class: 'flow-node__text', x: node.cx, y: firstY, 'text-anchor': 'middle', 'dominant-baseline': 'central' },
      node.lines.map((line, index) => s('tspan', { x: node.cx, y: firstY + index * TEXT_LINE, text: line })));
  }

  // ── Animación ───────────────────────────────────────────

  #animateIn() {
    const nodes = [...this.#nodes.values()];
    const lines = [...this.#edges.values()].map((edge) => edge.querySelector('.flow-edge__line'));
    const labels = this.#svg.querySelectorAll('.flow-edge__label');
    if (prefersReducedMotion) return;

    lines.forEach((line) => {
      const length = line.getTotalLength();
      gsap.set(line, { strokeDasharray: length, strokeDashoffset: length });
    });

    gsap.timeline()
      .from(nodes, {
        opacity: 0, scale: 0.96, y: -6, transformOrigin: '50% 50%',
        duration: DURATION.ui, stagger: STAGGER.tight, ease: EASE.out,
      })
      .to(lines, {
        strokeDashoffset: 0, duration: DURATION.reveal, stagger: STAGGER.tight, ease: EASE.inOut,
        onComplete: () => gsap.set(lines, { clearProps: 'strokeDasharray,strokeDashoffset' }),
      }, '-=0.2')
      .from(labels, { opacity: 0, duration: DURATION.ui, stagger: STAGGER.tight }, '-=0.3');
  }

  #setActive(element) {
    if (this.#active && this.#active !== element) this.#active.classList.remove('is-active');
    element.classList.add('is-active', 'is-visited');
    this.#active = element;
  }

  #pulse(element, duration) {
    if (prefersReducedMotion) return;
    const halo = element.querySelector('.flow-node__halo');
    // Al terminar se limpian los estilos inline para que el CSS (.is-active) decida el brillo.
    gsap.fromTo(halo, { opacity: 0.95, scale: 1 }, {
      opacity: 0.3, scale: 1.04, transformOrigin: '50% 50%',
      duration: Math.max(DURATION.ui, duration), ease: EASE.out, delay: duration * 0.7,
      onComplete: () => gsap.set(halo, { clearProps: 'opacity,transform' }),
      onInterrupt: () => gsap.set(halo, { clearProps: 'opacity,transform' }),
    });
  }

  /** Mantiene visible el nodo activo dentro del panel con scroll. */
  #follow(node) {
    const panel = this.#root;
    const { bounds } = this.#layout;
    const scale = this.#svg.getBoundingClientRect().width / bounds.width;
    const nodeY = (node.cy - bounds.y) * scale;
    const nodeX = (node.cx - bounds.x) * scale;
    const target = {};

    if (nodeY < panel.scrollTop + panel.clientHeight * 0.2 || nodeY > panel.scrollTop + panel.clientHeight * 0.8) {
      target.scrollTop = nodeY - panel.clientHeight / 2;
    }
    if (panel.scrollWidth > panel.clientWidth &&
      (nodeX < panel.scrollLeft + panel.clientWidth * 0.15 || nodeX > panel.scrollLeft + panel.clientWidth * 0.85)) {
      target.scrollLeft = nodeX - panel.clientWidth / 2;
    }
    if (Object.keys(target).length) gsap.to(panel, { ...target, duration: DURATION.modal, ease: EASE.out, overwrite: true });
  }
}
