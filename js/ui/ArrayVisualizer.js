import { gsap, prefersReducedMotion } from '../lib/gsap.js';
import { h } from '../utils/dom.js';
import { digitsHtml } from '../utils/digits.js';
import { EASE } from '../lib/motion.js';

const BUCKETS = 10;
const GEOMETRY = {
  barsHeight: 270,
  headroom: 60, // espacio libre arriba para que Bit pueda pararse sobre la barra más alta
  liftOffset: 34,
  minBar: 26,
  gap: 6,
  bucketGap: 34,
  bucketHeight: 200,
  chipHeight: 26,
  bucketLabel: 22,
};

/**
 * Visualiza el vector como barras. Cada operación (Op) sólo modifica el estado;
 * `#layout()` calcula la geometría y `render()` la aplica (con o sin animación).
 */
export class ArrayVisualizer {
  #root;
  #stage;
  #indexRow;
  #bucketRow;
  #items = [];
  #slots = [];
  #buckets = null;
  #state = this.#emptyState();
  #max = 1;
  #digits = 1;
  #observer;

  constructor(root) {
    this.#root = root;
    this.#stage = h('div', { class: 'viz__stage' });
    this.#indexRow = h('div', { class: 'viz__indices', 'aria-hidden': 'true' });
    this.#bucketRow = h('div', { class: 'viz__buckets', 'aria-hidden': 'true' });
    this.#stage.append(this.#indexRow, this.#bucketRow);
    root.replaceChildren(this.#stage);
    this.#observer = new ResizeObserver(() => this.render({ animate: false }));
    this.#observer.observe(root);
  }

  load(values, { buckets = false } = {}) {
    this.#items.forEach((item) => item.el.remove());
    this.#state = this.#emptyState();
    this.#items = values.map((value, id) => ({ id, value, el: this.#createBar(value) }));
    this.#items.forEach((item) => this.#stage.append(item.el));
    this.#slots = [...this.#items];
    this.#buckets = buckets ? Array.from({ length: BUCKETS }, () => []) : null;
    this.#max = Math.max(...values, 1);
    this.#digits = String(this.#max).length;
    this.#renderIndexRow();
    this.#renderBucketRow();
    this.render({ animate: false });
  }

  /** Aplica las operaciones de un paso. */
  apply(ops = [], { animate = true, duration = 0.4, render = true } = {}) {
    this.#state.comparing.clear();
    this.#state.hopping.clear();
    this.#state.focus = null;
    this.#state.activeBucket = null;
    for (const op of ops) this.#handlers[op.type]?.(op);
    if (render) this.render({ animate, duration });
  }

  /**
   * Elemento protagonista del último paso y una pista breve de qué le pasó
   * (la usa la guía animada). `box` es su posición de destino.
   */
  get focus() {
    return this.#describe(this.#state.focus);
  }

  /** Último protagonista hasta ahora (para reubicar la guía al saltar o retroceder). */
  get lastFocus() {
    return this.#describe(this.#state.lastFocus);
  }

  #describe(focus) {
    return focus?.item?.box ? { box: focus.item.box, cue: focus.cue } : null;
  }

  /** Caja actual de la posición `index` del vector (o null si está vacía). */
  boxAt(index) {
    return this.#slots[index]?.box ?? null;
  }

  render({ animate = true, duration = 0.4 } = {}) {
    if (!this.#items.length) return;
    const layout = this.#layout();
    const smooth = animate && !prefersReducedMotion;
    this.#stage.style.height = `${layout.stageHeight}px`;

    for (const item of this.#items) {
      const box = layout.boxes.get(item);
      this.#paintState(item, box);
      const previous = item.box;
      item.box = box;
      if (!smooth) {
        gsap.set(item.el, { x: box.x, y: box.y, width: box.width, height: box.height });
        continue;
      }
      gsap.to(item.el, { x: box.x, duration, ease: EASE.inOut, overwrite: 'auto' });
      // width/height provocan layout: sólo se animan cuando de verdad cambian (barra ↔ ficha de cubeta).
      if (!previous || previous.width !== box.width || previous.height !== box.height) {
        gsap.to(item.el, { width: box.width, height: box.height, duration, ease: EASE.inOut, overwrite: 'auto' });
      }
      if (this.#state.hopping.has(item)) {
        const current = gsap.getProperty(item.el, 'y');
        gsap.to(item.el, {
          keyframes: { y: [current, Math.min(current, box.y) - 28, box.y], easeEach: 'sine.inOut' },
          duration,
          overwrite: 'auto',
        });
      } else {
        gsap.to(item.el, { y: box.y, duration, ease: EASE.inOut, overwrite: 'auto' });
      }
    }
  }

  // ── Estado ──────────────────────────────────────────────

  #emptyState() {
    return {
      comparing: new Set(),
      hopping: new Set(),
      lifted: new Set(),
      sorted: new Set(),
      roles: { min: null, pivot: null },
      range: null,
      exp: null,
      focus: null,
      lastFocus: null,
      activeBucket: null,
    };
  }

  #focusOn(item, cue) {
    if (!item) return;
    this.#state.focus = { item, cue };
    this.#state.lastFocus = this.#state.focus;
  }

  #handlers = {
    compare: ({ a, b }) => {
      [a, b].filter((index) => index !== null).forEach((index) => this.#state.comparing.add(this.#slots[index]));
      this.#focusOn(this.#slots[a], '¿?');
    },
    swap: ({ a, b }) => {
      if (a === b) return;
      [this.#slots[a], this.#slots[b]] = [this.#slots[b], this.#slots[a]];
      this.#state.hopping.add(this.#slots[a]).add(this.#slots[b]);
      this.#focusOn(this.#slots[b], '⇄'); // viaja montada en el que avanza a la derecha
    },
    lift: ({ i }) => {
      this.#state.lifted.add(this.#slots[i]);
      this.#focusOn(this.#slots[i], 'aux');
    },
    drop: ({ i }) => {
      this.#state.lifted.delete(this.#slots[i]);
      this.#focusOn(this.#slots[i], '↓');
    },
    mark: ({ i, role }) => {
      this.#state.roles[role] = this.#slots[i];
      this.#focusOn(this.#slots[i], role === 'min' ? 'mín' : 'pivote');
    },
    unmark: ({ role }) => { this.#state.roles[role] = null; },
    range: ({ lo, hi }) => { this.#state.range = { lo, hi }; },
    sorted: ({ indices }) => {
      indices.forEach((index) => this.#state.sorted.add(this.#slots[index]));
      this.#focusOn(this.#slots[indices.at(-1)], '✓');
    },
    digit: ({ exp }) => { this.#state.exp = exp; },
    toBucket: ({ i, bucket }) => {
      const item = this.#slots[i];
      this.#slots[i] = null;
      this.#buckets[bucket].push(item);
      this.#state.hopping.add(item);
      this.#state.activeBucket = bucket;
      this.#focusOn(item, String(bucket)); // el dígito leído = la cubeta destino
    },
    collect: ({ bucket, k }) => {
      const item = this.#buckets[bucket].shift();
      this.#slots[k] = item;
      this.#state.hopping.add(item);
      this.#state.activeBucket = bucket;
      this.#focusOn(item, `A[${k + 1}]`);
    },
  };

  // ── Geometría ───────────────────────────────────────────

  #layout() {
    const width = this.#root.clientWidth;
    const n = this.#items.length;
    const { barsHeight, gap, minBar, liftOffset, headroom } = GEOMETRY;
    const barWidth = (width - gap * (n - 1)) / n;
    const boxes = new Map();

    this.#slots.forEach((item, index) => {
      if (!item) return;
      const height = minBar + (item.value / this.#max) * (barsHeight - minBar - liftOffset - headroom);
      const lift = this.#state.lifted.has(item) ? liftOffset : 0;
      boxes.set(item, { x: index * (barWidth + gap), y: barsHeight - height - lift, width: barWidth, height, slot: index });
    });

    let stageHeight = barsHeight + 26;
    if (this.#buckets) {
      const top = barsHeight + GEOMETRY.bucketGap;
      const bucketWidth = (width - gap * (BUCKETS - 1)) / BUCKETS;
      const longest = Math.max(1, ...this.#buckets.map((queue) => queue.length));
      const usable = GEOMETRY.bucketHeight - GEOMETRY.bucketLabel - 8;
      const chip = Math.min(GEOMETRY.chipHeight, usable / longest - 3);
      this.#buckets.forEach((queue, bucket) => {
        queue.forEach((item, position) => {
          boxes.set(item, {
            x: bucket * (bucketWidth + gap) + 3,
            y: top + usable - (position + 1) * (chip + 3),
            width: bucketWidth - 6,
            height: chip,
            slot: null,
          });
        });
      });
      stageHeight = top + GEOMETRY.bucketHeight;
      this.#positionBucketRow(top, bucketWidth);
    }

    this.#positionIndexRow(barWidth);
    return { boxes, stageHeight };
  }

  // ── Pintado ─────────────────────────────────────────────

  #paintState(item, box) {
    const state = this.#state;
    const inRange = !state.range || (box.slot !== null && box.slot >= state.range.lo && box.slot <= state.range.hi);
    const classes = {
      'is-compare': state.comparing.has(item),
      'is-lifted': state.lifted.has(item),
      'is-sorted': state.sorted.has(item),
      'is-min': state.roles.min === item,
      'is-pivot': state.roles.pivot === item,
      'is-dim': !inRange,
      'is-chip': box.slot === null,
    };
    Object.entries(classes).forEach(([name, on]) => item.el.classList.toggle(name, on));
    item.el.querySelector('.bar__label').innerHTML = this.#labelHtml(item.value);
  }

  #labelHtml(value) {
    return this.#buckets ? digitsHtml(value, this.#digits, this.#state.exp) : String(value);
  }

  #createBar(value) {
    return h('div', { class: 'bar', role: 'img', 'aria-label': String(value) }, [h('span', { class: 'bar__label', text: value })]);
  }

  #renderIndexRow() {
    this.#indexRow.replaceChildren(...this.#items.map((_, index) => h('span', { text: index + 1 })));
  }

  #positionIndexRow(barWidth) {
    [...this.#indexRow.children].forEach((label, index) => {
      label.style.transform = `translateX(${index * (barWidth + GEOMETRY.gap)}px)`;
      label.style.width = `${barWidth}px`;
    });
    this.#indexRow.style.top = `${GEOMETRY.barsHeight + 6}px`;
  }

  #renderBucketRow() {
    this.#bucketRow.hidden = !this.#buckets;
    this.#bucketRow.replaceChildren(...(this.#buckets ? this.#buckets.map((_, d) => h('div', { class: 'bucket' }, [h('span', { text: d })])) : []));
  }

  #positionBucketRow(top, bucketWidth) {
    this.#bucketRow.style.top = `${top}px`;
    this.#bucketRow.style.height = `${GEOMETRY.bucketHeight}px`;
    [...this.#bucketRow.children].forEach((bucket, index) => {
      bucket.style.transform = `translateX(${index * (bucketWidth + GEOMETRY.gap)}px)`;
      bucket.style.width = `${bucketWidth}px`;
      bucket.classList.toggle('is-active', index === this.#state.activeBucket);
    });
  }
}
