import { Path } from './path';
import { CannotMerge } from './cannot-merge';
import { AnyMerge } from './trimerge';

/* eslint-disable @typescript-eslint/no-explicit-any */
function* iterateKeys<K>(...maps: Map<K, any>[]): IterableIterator<K> {
  for (const map of maps) {
    yield* map.keys();
  }
}

export function trimergeMap(
  orig: any,
  left: any,
  right: any,
  path: Path,
  merge: AnyMerge,
): Map<any, any> | typeof CannotMerge {
  if (
    !(orig instanceof Map) ||
    !(left instanceof Map) ||
    !(right instanceof Map)
  ) {
    return CannotMerge;
  }
  const newMap = new Map<any, any>();
  const keys = new Set<string>(iterateKeys(orig, left, right));
  keys.forEach((key) => {
    const merged = merge(
      orig.get(key),
      left.get(key),
      right.get(key),
      [...path, key],
      merge,
    );
    if (merged !== undefined) {
      newMap.set(key, merged);
    }
  });
  return newMap;
}
