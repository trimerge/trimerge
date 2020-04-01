import { Path, PathKey } from './path';
import { CannotMerge } from './cannot-merge';
import { MergeFn } from './trimerge';
import { trimergeOrderedMap } from './trimerge-ordered-map';

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

export function trimergeMapCreator(
  allowOrderConflicts: boolean,
  keepUndefinedValues: boolean = true,
): MergeFn {
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
    const { leftSame, rightSame } = trimergeOrderedMap(
      orig,
      left,
      right,
      path,
      mergeFn,
      allowOrderConflicts,
      (key, merged) => {
        if (merged !== undefined || keepUndefinedValues) {
          mergedMap.set(key, merged);
        }
      },
    );
    // Check if result is shallow equal to left or right
    if (leftSame && left.size === mergedMap.size) {
      return left;
    }
    if (rightSame && right.size === mergedMap.size) {
      return right;
    }
    return mergedMap;
  };
}

export const trimergeMap = trimergeMapCreator(false);
