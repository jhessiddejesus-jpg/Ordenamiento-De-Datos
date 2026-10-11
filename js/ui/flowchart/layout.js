/**
 * Layout puro (sin DOM) de un diagrama de flujo.
 *
 * Cada nodo ocupa su propia fila en el orden en que se declara; `col` lo desplaza a la derecha.
 * Las aristas se enrutan de forma ortogonal según `route`:
 *  - 'down'   (por defecto): sale por abajo y entra por arriba (con quiebre si cambia de columna).
 *  - 'branch': sale por un costado y baja a la parte superior del destino.
 *  - 'around': sale por un costado, recorre un carril exterior (`lane`) y entra por arriba.
 *              Sirve para los bucles (hacia arriba) y para las salidas largas (hacia abajo).
 */

const SHAPES = {
  terminal: { width: 210, height: () => 48 },
  process: { width: 270, height: (lines) => 24 + lines * 19 },
  call: { width: 270, height: (lines) => 24 + lines * 19 },
  decision: { width: 250, height: (lines) => 78 + (lines - 1) * 18 },
};

const GAP_Y = 58;
const COLUMN_GAP = 320;
const MERGE = 24;
const LANE_START = 34;
const LANE_STEP = 24;
const CORNER = 10;
const PADDING = 36;

export const edgeKey = (from, to) => `${from}->${to}`;

function placeNodes(nodes) {
  const placed = new Map();
  let y = 0;
  for (const node of nodes) {
    const shape = SHAPES[node.type] ?? SHAPES.process;
    const lines = node.text.split('\n');
    const width = shape.width;
    const height = shape.height(lines.length);
    const cx = (node.col ?? 0) * COLUMN_GAP;
    placed.set(node.id, {
      ...node,
      lines,
      width,
      height,
      cx,
      cy: y + height / 2,
      top: y,
      bottom: y + height,
      left: cx - width / 2,
      right: cx + width / 2,
    });
    y += height + GAP_Y;
  }
  return placed;
}

const PORTS = {
  top: (n) => ({ x: n.cx, y: n.top }),
  bottom: (n) => ({ x: n.cx, y: n.bottom }),
  left: (n) => ({ x: n.left, y: n.cy }),
  right: (n) => ({ x: n.right, y: n.cy }),
};

const ROUTES = {
  down(src, tgt) {
    const s = PORTS.bottom(src);
    const t = PORTS.top(tgt);
    if (s.x === t.x) return [s, t];
    return [s, { x: s.x, y: t.y - MERGE }, { x: t.x, y: t.y - MERGE }, t];
  },
  branch(src, tgt, { side = 'right' }) {
    const s = PORTS[side](src);
    const t = PORTS.top(tgt);
    return [s, { x: t.x, y: s.y }, t];
  },
  around(src, tgt, { side = 'left', lane = 0 }, lanes) {
    const s = PORTS[side](src);
    const t = PORTS.top(tgt);
    const x = side === 'left' ? lanes.left - lane * LANE_STEP : lanes.right + lane * LANE_STEP;
    return [s, { x, y: s.y }, { x, y: t.y - MERGE }, { x: t.x, y: t.y - MERGE }, t];
  },
};

const distance = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);

function towards(from, to, length) {
  const total = distance(from, to);
  if (total === 0) return from;
  return { x: from.x + ((to.x - from.x) / total) * length, y: from.y + ((to.y - from.y) / total) * length };
}

/** Polilínea ortogonal con esquinas redondeadas. */
function roundedPath(points) {
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let k = 1; k < points.length - 1; k += 1) {
    const [prev, corner, next] = [points[k - 1], points[k], points[k + 1]];
    const radius = Math.min(CORNER, distance(prev, corner) / 2, distance(corner, next) / 2);
    const a = towards(corner, prev, radius);
    const b = towards(corner, next, radius);
    d += ` L ${a.x} ${a.y} Q ${corner.x} ${corner.y} ${b.x} ${b.y}`;
  }
  const last = points.at(-1);
  return `${d} L ${last.x} ${last.y}`;
}

/** Posición de la etiqueta (Sí/No) junto al punto de salida. */
function labelPosition([start, next]) {
  if (start.y === next.y) {
    const direction = Math.sign(next.x - start.x) || 1;
    return { x: start.x + direction * 12, y: start.y - 8, anchor: direction > 0 ? 'start' : 'end' };
  }
  return { x: start.x + 10, y: start.y + 17, anchor: 'start' };
}

function computeBounds(nodes, edges) {
  const xs = [];
  const ys = [];
  for (const node of nodes) xs.push(node.left, node.right), ys.push(node.top, node.bottom);
  for (const edge of edges) for (const point of edge.points) xs.push(point.x), ys.push(point.y);
  const minX = Math.min(...xs) - PADDING;
  const minY = Math.min(...ys) - PADDING;
  return { x: minX, y: minY, width: Math.max(...xs) + PADDING - minX, height: Math.max(...ys) + PADDING - minY };
}

export function layoutFlowchart({ nodes, edges }) {
  const placed = placeNodes(nodes);
  const all = [...placed.values()];
  const lanes = {
    left: Math.min(...all.map((n) => n.left)) - LANE_START,
    right: Math.max(...all.map((n) => n.right)) + LANE_START,
  };

  const routed = edges.map((edge) => {
    const src = placed.get(edge.from);
    const tgt = placed.get(edge.to);
    if (!src || !tgt) throw new Error(`Arista inválida: ${edge.from} → ${edge.to}`);
    const points = ROUTES[edge.route ?? 'down'](src, tgt, edge, lanes);
    return {
      ...edge,
      key: edgeKey(edge.from, edge.to),
      points,
      d: roundedPath(points),
      labelPos: edge.label ? labelPosition(points) : null,
    };
  });

  return { nodes: all, edges: routed, bounds: computeBounds(all, routed) };
}
