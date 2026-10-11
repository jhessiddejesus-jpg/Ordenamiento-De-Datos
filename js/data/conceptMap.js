/**
 * Estructura del mapa conceptual.
 * - `link`: palabra de enlace desde el padre (propia de los mapas conceptuales).
 * - `algorithm`: id del registro; la tarjeta toma de ahí nombre, descripción, Big O y eficiencia.
 */
export const conceptMap = {
  label: 'Ordenación',
  text: 'Poner datos en orden: de menor a mayor, de mayor a menor o alfabético',
  kind: 'root',
  children: [
    {
      link: 'puede ser',
      label: 'Interna',
      text: 'Arrays en la memoria principal. Es rápida',
      kind: 'category',
      children: [
        {
          link: 'con métodos',
          label: 'Directos',
          text: 'Sencillos; ordenan dentro del mismo array',
          kind: 'group',
          children: [
            { link: 'por intercambio', algorithm: 'bubble' },
            { link: 'por selección', algorithm: 'selection' },
            { link: 'por inserción', algorithm: 'insertion' },
          ],
        },
        {
          link: 'con métodos',
          label: 'Avanzados',
          text: 'Rinden mejor cuando hay muchos datos',
          kind: 'group',
          children: [
            { link: 'mejora la inserción', algorithm: 'shell' },
            { link: 'divide y vencerás', algorithm: 'quick' },
          ],
        },
        {
          link: 'se amplía con',
          label: 'Sin comparaciones',
          text: 'Ordenan sin comparar un elemento con otro',
          kind: 'group group--new',
          children: [{ link: 'por dígitos', algorithm: 'radix' }],
        },
      ],
    },
    {
      link: 'puede ser',
      label: 'Externa',
      text: 'Archivos en disco o en la nube. Es más lenta',
      kind: 'category',
      children: [
        {
          link: 'se apoya en',
          label: 'Intercalación (mezcla)',
          text: 'Une listas ya ordenadas en una sola',
          kind: 'leaf',
        },
      ],
    },
  ],
};
