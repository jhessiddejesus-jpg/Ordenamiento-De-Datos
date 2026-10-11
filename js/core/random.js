export const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

export const randomArray = (length, { min = 5, max = 99 } = {}) =>
  Array.from({ length }, () => randomInt(min, max));
