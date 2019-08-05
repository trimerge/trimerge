import { diff3MergeIndices, Index, upperBound } from './node-diff3';

export interface Range<T> {
  start: number;
  end: number;
  value: T;
}
export function forEachSliceRanges<T>(
  ranges: Range<T>[],
  sliceStart: number,
  sliceEnd: number,
  offset: number,
  callback: (range: Range<T>) => void,
): void {
  ranges.forEach(({ start, end, value }) => {
    if (start > sliceEnd || end < sliceStart) {
      return;
    }
    callback({
      start: offset + Math.max(0, start - sliceStart),
      end: offset + Math.min(sliceEnd - sliceStart, end - sliceStart),
      value,
    });
  });
}
export function sliceRanges<T>(
  ranges: Range<T>[],
  sliceStart: number,
  sliceEnd: number,
  offset: number = 0,
) {
  const sliced: Range<T>[] = [];
  forEachSliceRanges<T>(ranges, sliceStart, sliceEnd, offset, (range) =>
    sliced.push(range),
  );
  return sliced;
}

export function diff3MergeStringRanges<T>(
  base: string,
  left: string,
  right: string,
  baseRanges: Range<T>[] = [],
  leftRanges: Range<T>[] = [],
  rightRanges: Range<T>[] = [],
): { text: string; ranges: Range<T>[] } {
  let result = '';
  const ranges: Range<T>[] = [];
  const indices: Index[] = diff3MergeIndices(base, left, right);

  const addRange = (range: Range<T>) => ranges.push(range);

  for (let i = 0; i < indices.length; i++) {
    const index: Index = indices[i];
    if (index.type === 'conflict') {
      const {
        aRange: { location: leftStart, length: leftLength },
        oRange: { location: baseStart, length: baseLength },
        bRange: { location: rightStart, length: rightLength },
      } = index;
      const leftEnd = upperBound(index.aRange);
      const baseEnd = upperBound(index.oRange);
      const rightEnd = upperBound(index.bRange);

      const leftSlice = left.slice(leftStart, leftEnd);
      const baseSlice = base.slice(baseStart, baseEnd);
      const rightSlice = right.slice(rightStart, rightEnd);
      forEachSliceRanges(
        leftRanges,
        leftStart,
        leftEnd,
        result.length,
        addRange,
      );
      forEachSliceRanges(
        rightRanges,
        rightStart,
        rightEnd,
        result.length,
        addRange,
      );
      if (baseLength) {
        // If left/right slice starts/ends with base slice,
        // then it was removed from the other slice, so don't include it
        if (leftSlice.startsWith(baseSlice)) {
          result += leftSlice.slice(baseLength);
          result += rightSlice;
        } else if (rightSlice.startsWith(baseSlice)) {
          result += leftSlice;
          result += rightSlice.slice(baseLength);
        } else if (leftSlice.endsWith(baseSlice)) {
          result += leftSlice.slice(0, leftLength - baseLength);
          result += rightSlice;
        } else if (rightSlice.endsWith(baseSlice)) {
          result += leftSlice;
          result += rightSlice.slice(0, rightLength - baseLength);
        } else {
          result += leftSlice;
          result += rightSlice;
        }
      } else {
        result += leftSlice;
        result += rightSlice;
      }
    } else {
      const start = index.type === 'okA' ? index.aIndex : index.bIndex;
      const end = start + index.length;
      const str = index.type === 'okA' ? left : right;

      if (index.aIndex !== undefined) {
        forEachSliceRanges(
          leftRanges,
          index.aIndex,
          index.aIndex + index.length,
          result.length,
          addRange,
        );
      }
      if (index.bIndex !== undefined) {
        forEachSliceRanges(
          rightRanges,
          index.bIndex,
          index.bIndex + index.length,
          result.length,
          addRange,
        );
      }
      if (index.oIndex !== undefined) {
        forEachSliceRanges(
          baseRanges,
          index.oIndex,
          index.oIndex + index.length,
          result.length,
          addRange,
        );
      }

      result += str.slice(start, end);
    }
  }
  return { text: result, ranges };
}

export function diff3MergeStrings(base: string, left: string, right: string) {
  return diff3MergeStringRanges(base, left, right).text;
}
