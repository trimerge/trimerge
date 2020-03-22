import { MergeFn } from './trimerge';
import { Path } from './path';
import { JSONObject, JSONValue } from './json';
import { CannotMerge } from './cannot-merge';
import { diff3Keys } from './diff3-keys';
import { jsSameType } from './js-same-type';

type ArrayKeyFn = (item: any, index: number, arrayPath: Path) => string;

export function trimergeArrayCreator(
  getArrayItemKey: ArrayKeyFn,
  allowOrderConflicts: boolean = false,
): MergeFn {
  return (
    orig: any[],
    left: any[],
    right: any[],
    path: Path,
    mergeFn: MergeFn,
  ): JSONValue[] | typeof CannotMerge => {
    if (jsSameType(orig, left, right) !== 'array') {
      return CannotMerge;
    }
    const origMap: JSONObject = {};
    const leftMap: JSONObject = {};
    const rightMap: JSONObject = {};
    const origKeys = orig.map((item, index): string => {
      const key = getArrayItemKey(item, index, path);
      if (key in origMap) {
        throw new Error(`Duplicate array key '${key}' at /${path}`);
      }
      origMap[key] = item;
      return key;
    });
    const leftKeys = left.map((item, index): string => {
      const key = getArrayItemKey(item, index, path);
      if (key in leftMap) {
        throw new Error(`Duplicate array key '${key}' at /${path}`);
      }
      leftMap[key] = item;
      return key;
    });
    const rightKeys = right.map((item, index): string => {
      const key = getArrayItemKey(item, index, path);
      if (key in rightMap) {
        throw new Error(`Duplicate array key '${key}' at /${path}`);
      }
      rightMap[key] = item;
      return key;
    });

    const mergedArray: JSONValue[] = [];
    let leftSame = true;
    let rightSame = true;
    diff3Keys(
      origKeys,
      leftKeys,
      rightKeys,
      (key) => {
        const leftElement = leftMap[key];
        const rightElement = rightMap[key];
        const merged = mergeFn(
          origMap[key],
          leftElement,
          rightElement,
          [...path, key],
          mergeFn,
        );
        if (merged !== left[mergedArray.length]) {
          leftSame = false;
        }
        if (merged !== right[mergedArray.length]) {
          rightSame = false;
        }
        mergedArray.push(merged);
      },
      allowOrderConflicts,
    );

    // Check if result is shallow equal to left or right
    if (leftSame && left.length === mergedArray.length) {
      return left;
    }
    if (rightSame && right.length === mergedArray.length) {
      return right;
    }
    return mergedArray;
  };
}
