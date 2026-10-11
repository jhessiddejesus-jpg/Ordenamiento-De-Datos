/**
 * HTML de un número con ceros a la izquierda atenuados y, opcionalmente,
 * el dígito de la posición `exp` (1, 10, 100…) resaltado. Lo usan el visualizador y la sección Radix.
 */
export function digitsHtml(value, width, exp = null) {
  const text = String(value).padStart(width, '0');
  const active = exp ? text.length - 1 - Math.log10(exp) : -1;
  const leading = text.length - String(value).length;
  return [...text].map((char, index) => {
    const classes = [index < leading && 'digit--pad', index === active && 'digit--active'].filter(Boolean).join(' ');
    return classes ? `<span class="${classes}">${char}</span>` : char;
  }).join('');
}
