import { MergeFn } from './trimerge';
import { Path } from './path';
import { CannotMerge } from './cannot-merge';
import { internalTrimergeOrderedMap } from './trimerge-ordered-map';
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
  ): any[] | typeof CannotMerge => {
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

    const mergedArray: any[] = [];
    switch (
      internalTrimergeOrderedMap(
        origMap,
        leftMap,
        rightMap,
        path,
        mergeFn,
        allowOrderConflicts,
        (_key, merged) => mergedArray.push(merged),
      )
    ) {
      case 'left':
        return left;
      case 'right':
        return right;
      default:
        return mergedArray;
    }
  };
}
