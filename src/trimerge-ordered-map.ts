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
  callback: (key: K, value: V | undefined) => void,
): 'left' | 'right' | undefined {
  const leftRightKeys = new Set(leftMap.keys());
  for (const key of rightMap.keys()) {
    leftRightKeys.add(key);
  }

  // Merge all values first (might restore some deleted values)
  const mergedValues = new Map<K, V>();
  const restoredInLeft = new Set<K>();
  const restoredInRight = new Set<K>();
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
    const inLeft = leftMap.has(key);
    const inRight = rightMap.has(key);
    if (
      merged !== undefined ||
      (inLeft && left === undefined) ||
      (inRight && right === undefined)
    ) {
      if (!inLeft) {
        restoredInLeft.add(key);
      } else if (!inRight) {
        restoredInRight.add(key);
      }
      mergedValues.set(key, merged);
    }
  }
  const orig = Array.from(origMap.keys());
  const left = restoreKeys(orig, leftMap, restoredInLeft);
  const right = restoreKeys(orig, rightMap, restoredInRight);
  let leftSame = true;
  let rightSame = true;
  const leftIterator = leftMap.entries();
  const rightIterator = rightMap.entries();
  diff3Keys(
    orig,
    left,
    right,
    (key) => {
      const merged = mergedValues.get(key);
      if (leftSame) {
        const left = leftIterator.next().value;
        if (!left || key !== left[0] || merged !== left[1]) {
          leftSame = false;
        }
      }
      if (rightSame) {
        const right = rightIterator.next().value;
        if (!right || key !== right[0] || merged !== right[1]) {
          rightSame = false;
        }
      }
      callback(key, merged);
    },
    allowOrderConflicts,
  );
  if (leftSame && leftIterator.next().done) {
    return 'left';
  }
  if (rightSame && rightIterator.next().done === true) {
    return 'right';
  }
  return undefined;
}

type SetOrMap<T> = ReadonlySet<T> | ReadonlyMap<T, any>;

/**
 * This function is used to get a version of B that has certain items restored
 * This is use by internalTrimergeOrderedMap to handle the scenario
 */
export function restoreKeys<T>(
  aArray: readonly T[],
  bMap: SetOrMap<T>,
  keys: SetOrMap<T>,
): readonly T[] {
  const bArray = Array.from(bMap.keys());
  if (keys.size === 0) {
    return bArray;
  }
  // check if B is missing any keys:
  let keyDeleted = false;
  for (const item of keys.keys()) {
    if (!bMap.has(item)) {
      keyDeleted = true;
      break;
    }
  }
  if (!keyDeleted) {
    // B doesn't delete any of the keys
    return bArray;
  }

  // Otherwise we need build a new B that inserts the missing keys as close to
  // their original locations as possible
  const newB: T[] = [];
  let bEnd = 0;
  for (const diff of diffIndices(aArray, bArray)) {
    const bStart = diff.b.location;
    if (bEnd < bStart) {
      // Add beginning of B (no edits)
      newB.push(...bArray.slice(bEnd, bStart));
    }

    // Add keys from A that were deleted in B
    const aStart = diff.a.location;
    const aEnd = aStart + diff.a.length;
    for (let i = aStart; i < aEnd; i++) {
      const item = aArray[i];
      if (keys.has(item) && !bMap.has(item)) {
        // Key was in A, but deleted in B
        newB.push(item);
      }
    }

    // Add diffed keys from B
    bEnd = bStart + diff.b.length;
    newB.push(...bArray.slice(bStart, bEnd));
  }
  if (bEnd < bArray.length) {
    // Add end of B
    newB.push(...bArray.slice(bEnd));
  }
  return newB;
}
