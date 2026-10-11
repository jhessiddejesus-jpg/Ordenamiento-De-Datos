const SVG_NS = 'http://www.w3.org/2000/svg';

function applyAttributes(el, attrs) {
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'text') el.textContent = value;
    else if (key === 'html') el.innerHTML = value;
    else if (key === 'dataset') Object.assign(el.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2), value);
    else el.setAttribute(key, value === true ? '' : value);
  }
  return el;
}

function appendChildren(el, children) {
  for (const child of [children].flat()) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
}

/** Crea un elemento HTML: h('div', { class: 'x' }, [hijos]) */
export function h(tag, attrs = {}, children = []) {
  return appendChildren(applyAttributes(document.createElement(tag), attrs), children);
}

/** Crea un elemento SVG con la misma firma que h(). */
export function s(tag, attrs = {}, children = []) {
  return appendChildren(applyAttributes(document.createElementNS(SVG_NS, tag), attrs), children);
}

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

export function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/** Posición de `el` relativa a `ancestor` en coordenadas de layout (ignora transforms). */
export function offsetWithin(el, ancestor) {
  let x = 0;
  let y = 0;
  let node = el;
  while (node && node !== ancestor) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent;
  }
  return { x, y, width: el.offsetWidth, height: el.offsetHeight };
}

let uid = 0;
export const uniqueId = (prefix = 'id') => `${prefix}-${++uid}`;
