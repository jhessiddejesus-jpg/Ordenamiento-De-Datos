import { gsap } from '../lib/gsap.js';
import { EASE, DURATION } from '../lib/motion.js';
import { h, escapeHtml } from '../utils/dom.js';

const KEYWORDS = /\b(procedimiento|fin_procedimiento|desde|hasta_que|hasta|hacer|fin_desde|mientras|fin_mientras|repetir|si|entonces|fin_si|y|no|verdadero|falso|div|mod)\b/g;

const highlightSyntax = (text) =>
  escapeHtml(text)
    .replace(KEYWORDS, '<span class="kw">$1</span>')
    .replace(/(←)/g, '<span class="op">$1</span>');

/** Lista numerada de pseudocódigo; resalta las líneas asociadas al nodo activo. */
export class PseudocodeView {
  #root;
  #lines = [];

  constructor(root) {
    this.#root = root;
  }

  render(pseudocode) {
    this.#lines = pseudocode.map(([node, text]) =>
      h('li', { class: 'code__line', dataset: node ? { node } : {}, html: highlightSyntax(text) }));
    this.#root.replaceChildren(...this.#lines);
    // Evita el salto brusco de contenido al cambiar de algoritmo (sólo opacidad: apto con movimiento reducido).
    gsap.fromTo(this.#root, { opacity: 0 }, { opacity: 1, duration: DURATION.fast, ease: EASE.out });
  }

  highlight(nodeId) {
    let first = null;
    for (const line of this.#lines) {
      const active = Boolean(nodeId) && line.dataset.node === nodeId;
      line.classList.toggle('is-active', active);
      if (active && !first) first = line;
    }
    if (first) this.#keepVisible(first);
  }

  #keepVisible(line) {
    const panel = this.#root; // posicionado (position: relative) → offsetTop es relativo al panel
    const top = line.offsetTop;
    if (top < panel.scrollTop || top + line.offsetHeight > panel.scrollTop + panel.clientHeight) {
      gsap.to(panel, { scrollTop: top - panel.clientHeight / 3, duration: DURATION.ui, ease: EASE.out, overwrite: true });
    }
  }
}
