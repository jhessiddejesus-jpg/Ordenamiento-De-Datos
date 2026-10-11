import { h } from '../utils/dom.js';

/** Muestra las variables del pseudocódigo y marca (destello CSS) las que cambian. */
export class VariablesView {
  #root;
  #previous = {};

  constructor(root) {
    this.#root = root;
  }

  render(vars = {}) {
    const chips = Object.entries(vars).map(([name, value]) => h('span', {
      class: `var${this.#previous[name] !== value ? ' is-changed' : ''}`,
    }, [h('span', { class: 'var__name', text: name }), h('span', { class: 'var__value', text: value })]));
    this.#root.replaceChildren(...chips);
    this.#previous = { ...vars };
  }
}
