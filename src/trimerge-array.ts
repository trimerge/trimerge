import { MergeFn } from './trimerge';
import { Path } from './path';
import { JSONValue } from './json';
import { CannotMerge } from './cannot-merge';
import { trimergeOrderedMap } from './trimerge-ordered-map';
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

    function arrayToMap(array: any[]): Map<string, any> {
      const map = new Map<string, any>();
      array.forEach((item, index) => {
        const key = getArrayItemKey(item, index, path);
        if (map.has(key)) {
          throw new Error(`Duplicate array key '${key}' at /${path}`);
        }
        map.set(key, item);
      });
      return map;
    }

    const origMap = arrayToMap(orig);
    const leftMap = arrayToMap(left);
    const rightMap = arrayToMap(right);


    const mergedArray: JSONValue[] = [];
    let leftSame = true;
    let rightSame = true;
    trimergeOrderedMap(
      origMap,
      leftMap,
      rightMap,
      path,
      mergeFn,
      allowOrderConflicts,
      (_, merged) => {
        // Compare merge result with same array index in left
        if (leftSame && merged !== left[mergedArray.length]) {
          leftSame = false;
        }
        // Compare merge result with same array index in right
        if (rightSame && merged !== right[mergedArray.length]) {
          rightSame = false;
        }
        if (merged !== undefined) {
          mergedArray.push(merged);
        }
      },
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
