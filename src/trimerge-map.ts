import { Path, PathKey } from './path';
import { CannotMerge } from './cannot-merge';
import { MergeFn } from './trimerge';
import { internalTrimergeOrderedMap } from './trimerge-ordered-map';

function* iterateKeys<K>(...maps: Map<K, any>[]): IterableIterator<K> {
  for (const map of maps) {
    yield* map.keys();
  }
}

export function trimergeUnorderedMap(
  orig: any,
  left: any,
  right: any,
  path: Path,
  merge: MergeFn,
): Map<any, any> | typeof CannotMerge {
  if (
    !(orig instanceof Map) ||
    !(left instanceof Map) ||
    !(right instanceof Map)
  ) {
    return CannotMerge;
  }
  const newMap = new Map<any, any>();
  const keys = new Set<PathKey>(iterateKeys(orig, left, right));
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

export function trimergeMapCreator(allowOrderConflicts: boolean): MergeFn {
  return function trimergeMap(
    orig: any,
    left: any,
    right: any,
    path: Path,
    mergeFn: MergeFn,
  ): Map<any, any> | typeof CannotMerge {
    if (
      !(orig instanceof Map) ||
      !(left instanceof Map) ||
      !(right instanceof Map)
    ) {
      return CannotMerge;
    }
    const mergedMap = new Map<any, any>();
    switch (
      internalTrimergeOrderedMap(
        orig,
        left,
        right,
        path,
        mergeFn,
        allowOrderConflicts,
        (key, merged) => mergedMap.set(key, merged),
      )
    ) {
      case 'left':
        return left;
      case 'right':
        return right;
      default:
        return mergedMap;
    }
  };
}

export const trimergeMap = trimergeMapCreator(false);
