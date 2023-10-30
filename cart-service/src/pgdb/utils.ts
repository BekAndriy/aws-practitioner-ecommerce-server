/* eslint-disable @typescript-eslint/ban-types */
export const toCamelCase = (value: string): string => value.split('_')
  .map((word, idx) => (idx === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
  .join('');

const objKeysChange = <T extends object, D extends object>(
  obj: D,
  callback: (string: string) => string,
  keys: (keyof D)[] = [],
): T => Object.fromEntries(
  Object.entries(obj).map(([key, value]) => [
    keys.length && !keys.includes(key as keyof D) ? key : callback(key), value]),
) as T;

export const objKeysToCamelCase = <T extends object, D extends object = object>(
  obj: D,
  keys: (keyof D)[] = [],
): T => objKeysChange<T, D>(obj, toCamelCase, keys);