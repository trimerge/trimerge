import { diff3Keys } from './diff3-keys';
import { MergeFn } from './trimerge';
import { Path } from './path';
import { diffIndices } from './node-diff3';

export function internalTrimergeOrderedMap<K, V>(
  origMap: Map<K, V>,
  leftMap: Map<K, V>,
  rightMap: Map<K, V>,
  path: Path,
  mergeFn: MergeFn,
  allowOrderConflicts: boolean,
  callback: (key: K, value: V) => void,
): 'left' | 'right' | undefined {
  const leftRightKeys = new Set(leftMap.keys());
  for (const key of rightMap.keys()) {
    leftRightKeys.add(key);
  }

  // Merge all values first (might restore some deleted values)
  const mergedValues = new Map<K, V>();

  // Keys that have been removed from left or right but were restored by mergeFn
  const restoreLeft = new Set<K>();
  const restoreRight = new Set<K>();

  for (const key of leftRightKeys) {
    const left = leftMap.get(key);
    const right = rightMap.get(key);
    const merged = mergeFn(
      origMap.get(key),
      left,
      right,
      [...path, key as any],
      mergeFn,
    );
    if (merged !== undefined) {
      if (!leftMap.has(key)) {
        restoreLeft.add(key);
      } else if (!rightMap.has(key)) {
        restoreRight.add(key);
      }
      mergedValues.set(key, merged);
    }
  }
  const orig = Array.from(origMap.keys());
  const left = restoreDeletedKeys(orig, leftMap, restoreLeft);
  const right = restoreDeletedKeys(orig, rightMap, restoreRight);

  // While merging, we want to detect if the merged result is identical to
  // either left or right, i.e. same key/value pairs in the same order
  let leftSame = true;
  let rightSame = true;

  // To track order, we need to iterate over the map
  const leftIterator = leftMap.entries();
  const rightIterator = rightMap.entries();

  diff3Keys(
    orig,
    left,
    right,
    (key) => {
      const merged = mergedValues.get(key);
      if (merged !== undefined) {
        if (leftSame) {
          // Check that next key and value match
          const left = leftIterator.next().value;
          if (!left || key !== left[0] || merged !== left[1]) {
            leftSame = false;
          }
        }
        if (rightSame) {
          // Check that next key and value match
          const right = rightIterator.next().value;
          if (!right || key !== right[0] || merged !== right[1]) {
            rightSame = false;
          }
        }
        callback(key, merged);
      }
    },
    allowOrderConflicts,
  );

  // If everything so far is the same, we need to also check there aren't still
  // items in left (e.g. left.size > result.size)
  if (leftSame && leftIterator.next().done) {
    return 'left';
  }
  // Ditto right
  if (rightSame && rightIterator.next().done) {
    return 'right';
  }
  return undefined;
}

type SetOrMap<T> = ReadonlySet<T> | ReadonlyMap<T, any>;

/**
 * Used by internalTrimergeOrderedMap to add back keys from `a` that were
 * removed in `b`, but need to be added back in their original location.
 *
 * @param a base array of items
 * @param bMap map of items (either left or right, in trimerge terms)
 * @param keysToRestore set of items from `a` that were removed in `bMap` and need
 *  to be added back. this should NOT include anything from bMap
 */
export function restoreDeletedKeys<T>(
  a: readonly T[],
  bMap: SetOrMap<T>,
  keysToRestore: SetOrMap<T>,
): readonly T[] {
  const b = Array.from(bMap.keys());
  if (keysToRestore.size === 0) {
    return b;
  }

  // Otherwise we need build a new B that inserts the missing keys as close to
  // their original locations as possible
  const newB: T[] = [];
  let bEnd = 0;
  for (const diff of diffIndices(a, b)) {
    const bStart = diff.b.location;
    if (bEnd < bStart) {
      // Add beginning of B (no edits)
      newB.push(...b.slice(bEnd, bStart));
    }

    // Add keys from A that were deleted in B
    const aStart = diff.a.location;
    const aEnd = aStart + diff.a.length;
    for (let i = aStart; i < aEnd; i++) {
      const item = a[i];
      if (keysToRestore.has(item)) {
        // Key was in A, but deleted in B
        newB.push(item);
      }
    }

    // Add diffed keys from B
    bEnd = bStart + diff.b.length;
    newB.push(...b.slice(bStart, bEnd));
  }
  if (bEnd < b.length) {
    // Add end of B
    newB.push(...b.slice(bEnd));
  }
  return newB;
}
