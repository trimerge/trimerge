import { Path, PathKey } from './path';
import { CannotMerge } from './cannot-merge';
import { MergeFn } from './trimerge';
import { diff3Keys } from './diff3-keys';

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
    diff3Keys(
      Array.from(orig.keys()),
      Array.from(left.keys()),
      Array.from(right.keys()),
      (key) => {
        newMap.set(
          key,
          merge(
            orig.get(key),
            left.get(key),
            right.get(key),
            [...path, key],
            merge,
          ),
        );
      },
      allowOrderConflicts,
    );
    return newMap;
  };
}

export const trimergeMap = trimergeMapCreator(false);
