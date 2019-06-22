import { diff3MergeIndices, Index } from './node-diff3';

export function diff3Keys<T>(
  leftKeys: ArrayLike<T>,
  origKeys: ArrayLike<T>,
  rightKeys: ArrayLike<T>,
  callback: (key: T) => void,
): void {
  const sides: ArrayLike<T>[] = [leftKeys, origKeys, rightKeys];
  const indices: Index[] = diff3MergeIndices(leftKeys, origKeys, rightKeys);
  for (let i = 0; i < indices.length; i++) {
    const index: Index = indices[i];
    if (index[0] === -1) {
      const [
        ,
        leftStart,
        leftLength,
        origStart,
        origLength,
        rightStart,
        rightLength,
      ] = index;
      const origEnd = origStart + origLength;
      const leftEnd = leftStart + leftLength;
      const rightEnd = rightStart + rightLength;
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
          callback(key);
        }
      }
      for (let j = rightStart; j < rightEnd; j++) {
        const key = rightKeys[j];
        if (!origSlice.has(key)) {
          callback(key);
        }
      }
    } else {
      const [side, start, length] = index;
      const arr = sides[side];
      const end = start + length;
      for (let j = start; j < end; j++) {
        callback(arr[j]);
      }
    }
  }
}
