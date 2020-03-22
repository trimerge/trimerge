import { JSONObject } from './json';
import { Path } from './path';
import { CannotMerge } from './cannot-merge';
import { MergeFn } from './trimerge';
import { jsSameType } from './js-same-type';

export function trimergeObject(
  orig: any = {},
  left: any,
  right: any,
  path: Path,
  mergeFn: MergeFn,
): object | typeof CannotMerge {
  if (jsSameType(orig, left, right) !== 'object') {
    return CannotMerge;
  }
  const origKeys = Object.keys(orig);
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  const mergedObject: JSONObject = {};
  const keys = new Set<string>(origKeys);
  leftKeys.forEach(keys.add, keys);
  rightKeys.forEach(keys.add, keys);
  let leftSame = true; //leftKeys.length === keys.size;
  let rightSame = true; //rightKeys.length === keys.size;
  let count = 0;
  keys.forEach((key) => {
    const leftElement = left[key];
    const rightElement = right[key];
    const merged = mergeFn(
      orig[key],
      leftElement,
      rightElement,
      [...path, key],
      mergeFn,
    );
    if (leftElement !== merged) {
      leftSame = false;
    }
    if (rightElement !== merged) {
      rightSame = false;
    }
    if (merged !== undefined) {
      count++;
      mergedObject[key] = merged;
    }
  });

  // Check if result is shallow equal to left or right
  if (leftSame && leftKeys.length === count) {
    return left;
  }
  if (rightSame && rightKeys.length === count) {
    return right;
  }
  return mergedObject;
}
