import { diff3MergeIndices, Index, upperBound } from './node-diff3';
import { MergeFn } from './trimerge';
import { Path } from './path';

export function trimergeOrderedMap<K, V>(
  origMap: Map<K, V>,
  leftMap: Map<K, V>,
  rightMap: Map<K, V>,
  path: Path,
  mergeFn: MergeFn,
  allowOrderConflicts: boolean,
  callback: (key: K, value: V) => void,
): { leftSame: boolean; rightSame: boolean } {
  const allKeys = new Set(leftMap.keys());
  for (const key of rightMap.keys()) {
    allKeys.add(key);
  }
  const mergedValues = new Map<K, V>();
  const restoredAfterLeftDeleted = new Set<K>();
  const restoredAfterRightDeleted = new Set<K>();
  for (const key of allKeys) {
    const inLeft = leftMap.has(key);
    const inRight = rightMap.has(key);
    if (!inLeft && !inRight) {
      continue;
    }
    const merged = mergeFn(
      origMap.get(key),
      leftMap.get(key),
      rightMap.get(key),
      [...path, key as any],
      mergeFn,
    );

    if (origMap.has(key)) {
      if (!inLeft) {
        restoredAfterLeftDeleted.add(key);
      } else if (!inRight) {
        restoredAfterRightDeleted.add(key);
      }
    }
    mergedValues.set(key, merged);
  }
  const orig = Array.from(origMap.keys());
  const left = Array.from(leftMap.keys());
  const right = Array.from(rightMap.keys());
  const indices = diff3MergeIndices(orig, left, right);
  const seenKeys = new Set<K>();
  let leftSame = true;
  let rightSame = true;
  function emit(key: K) {
    if (seenKeys.has(key)) {
      if (!allowOrderConflicts) {
        throw new Error('order conflict');
      }
    } else {
      seenKeys.add(key);
      const value = mergedValues.get(key);

      const leftElement = leftMap.get(key);
      const rightElement = rightMap.get(key);
      if (value !== leftElement) {
        leftSame = false;
      }
      if (value !== rightElement) {
        rightSame = false;
      }
      if (value !== undefined) {
        callback(key, value);
      }
    }
  }
  for (let i = 0; i < indices.length; i++) {
    const index: Index = indices[i];
    if (index.type === 'conflict') {
      const leftStart = index.aRange.location;
      const leftEnd = upperBound(index.aRange);
      const origStart = index.oRange.location;
      const origEnd = upperBound(index.oRange);
      const rightStart = index.bRange.location;
      const rightEnd = upperBound(index.bRange);

      const rightSlice = new Set<K>();
      for (let i = rightStart; i < rightEnd; i++) {
        rightSlice.add(right[i]);
      }
      const origSlice = new Set<K>();
      for (let i = origStart; i < origEnd; i++) {
        origSlice.add(orig[i]);
      }
      for (let j = leftStart; j < leftEnd; j++) {
        const key = left[j];
        if (rightSlice.has(key) || !origSlice.has(key)) {
          emit(key);
        }
      }
      for (let j = rightStart; j < rightEnd; j++) {
        const key = right[j];
        // Added by right
        if (!origSlice.has(key)) {
          emit(key);
        }
      }
    } else {
      const start = index.type === 'okA' ? index.aIndex : index.bIndex;
      const arr = index.type === 'okA' ? left : right;
      const end = start + index.length;
      for (let j = start; j < end; j++) {
        emit(arr[j]);
      }
    }
  }

  return { leftSame, rightSame };
}
