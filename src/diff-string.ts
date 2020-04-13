import { Path } from './path';
import { DiffCallback, DiffResult } from './diff';
import fastDiff from 'fast-diff';

export function diffString(
  before: any,
  after: any,
  onDiff: DiffCallback,
  path: Path,
): DiffResult {
  if (typeof before !== 'string' || typeof after !== 'string') {
    return undefined;
  }
  let index = 0;
  const diffs = fastDiff(before, after);
  for (let i = 0; i < diffs.length; i++) {
    const [type, str] = diffs[i];
    if (type === fastDiff.EQUAL) {
      index += str.length;
      continue;
    }
    if (type === fastDiff.INSERT) {
      onDiff({ type: 'splice', path, index, insert: str });
      index += str.length;
    } else {
      // type === fastDiff.DELETE
      const [type2, str2] = diffs[i + 1] || [];
      if (type2 === fastDiff.INSERT) {
        onDiff({
          type: 'splice',
          path,
          index,
          remove: str.length,
          insert: str2,
        });
        index += str2.length;
        i++;
      } else {
        onDiff({ type: 'splice', path, index, remove: str.length });
      }
    }
  }
  return true;
}
