import { Path } from './path';
import { DiffCallback, DiffResult } from './diff';
import { diffRanges } from './node-diff3';

export function diffArrayLike<T>(
  before: T[] | string,
  after: T[] | string,
  onDiff: DiffCallback,
  path: Path,
) {
  let index = 0;
  let changed = false;
  for (const { same, a, b } of diffRanges(before, after)) {
    const aLen = a.max - a.min;
    if (same) {
      index += aLen;
      continue;
    }
    const insert = b.min < b.max ? after.slice(b.min, b.max) : undefined;
    onDiff({
      type: 'splice',
      path,
      index,
      remove: aLen > 0 ? aLen : undefined,
      insert,
    });
    changed = true;
    if (insert) {
      index += insert.length;
    }
  }
  return changed;
}

export function diffArray(
  before: any,
  after: any,
  onDiff: DiffCallback,
  path: Path,
): DiffResult {
  if (!Array.isArray(before) || !Array.isArray(after)) {
    return undefined;
  }
  return diffArrayLike(before, after, onDiff, path);
}
