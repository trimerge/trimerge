import { Path } from './path';
import { DiffCallback, DiffFn, DiffResult } from './diff';
import { type } from './type';

export function diffObject(
  orig: any,
  value: any,
  onDiff: DiffCallback,
  path: Path,
  diffFn: DiffFn,
): DiffResult {
  if (type(orig) !== 'object' || type(value) !== 'object') {
    return undefined;
  }
  const origKeys = Object.keys(orig);
  const valueKeys = Object.keys(value);
  const keys = new Set<string>(origKeys);
  valueKeys.forEach(keys.add, keys);
  let anyDiffers = false;
  keys.forEach((key) => {
    if (diffFn(orig[key], value[key], onDiff, [...path, key], diffFn)) {
      anyDiffers = true;
    }
  });
  return anyDiffers;
}
