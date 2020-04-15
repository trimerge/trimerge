import { Path } from './path';
import { DiffCallback, DiffResult } from './diff';
import { diffArrayLike } from './diff-array';

export function diffString(
  before: any,
  after: any,
  onDiff: DiffCallback,
  path: Path,
): DiffResult {
  if (typeof before !== 'string' || typeof after !== 'string') {
    return undefined;
  }
  return diffArrayLike(before, after, onDiff, path);
}
