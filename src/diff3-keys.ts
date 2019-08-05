import { diff3MergeIndices, Index, upperBound } from './node-diff3';

export function diff3Keys<T>(
  origKeys: ArrayLike<T>,
  leftKeys: ArrayLike<T>,
  rightKeys: ArrayLike<T>,
  callback: (key: T) => void,
  allowOrderConflicts: boolean = false,
): void {
  const indices: Index[] = diff3MergeIndices(origKeys, leftKeys, rightKeys);
  const seenKeys = new Set<T>();
  function emit(key: T) {
    if (seenKeys.has(key)) {
      if (!allowOrderConflicts) {
        throw new Error('order conflict');
      }
    } else {
      seenKeys.add(key);
      callback(key);
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

      const rightSlice = new Set<T>();
      for (let i = rightStart; i < rightEnd; i++) {
        rightSlice.add(rightKeys[i]);
      }
      const origSlice = new Set<T>();
      for (let i = origStart; i < origEnd; i++) {
        origSlice.add(origKeys[i]);
      }
      for (let j = leftStart; j < leftEnd; j++) {
        const key = leftKeys[j];
        if (rightSlice.has(key) || !origSlice.has(key)) {
          emit(key);
        }
      }
      for (let j = rightStart; j < rightEnd; j++) {
        const key = rightKeys[j];
        // Added by right
        if (!origSlice.has(key)) {
          emit(key);
        }
      }
    } else {
      const start = index.type === 'okA' ? index.aIndex : index.bIndex;
      const arr = index.type === 'okA' ? leftKeys : rightKeys;
      const end = start + index.length;
      for (let j = start; j < end; j++) {
        emit(arr[j]);
      }
    }
  }
}
