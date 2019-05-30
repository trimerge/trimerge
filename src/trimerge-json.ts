import { JSONArray, JSONObject, JSONValue } from './json';
import { Path } from './path';
import { diff3MergeIndices, Index } from 'node-diff3';
import { CannotMerge } from './cannot-merge';
import deepEqual from './json-equal';
import { type } from './type';
import { AnyMerge, MergeFn, trimergeEqualityCreator } from './trimerge';

type ArrayKeyFn = (item: any, index: number, arrayPath: Path) => string;

export const trimergeJsonDeepEqual = trimergeEqualityCreator(deepEqual);

function jsonSameType(
  orig: JSONValue,
  left: JSONValue,
  right: JSONValue,
): typeof orig | 'array' | 'null' | typeof CannotMerge {
  const typeo = type(orig);
  const typea = type(left);
  const typeb = type(right);
  if (typea !== typeb || typea !== typeo) {
    return CannotMerge;
  }
  return typea;
}

export function trimergeArrayCreator(
  getArrayItemKey: ArrayKeyFn,
): MergeFn<any> {
  return (
    orig: JSONValue[],
    left: JSONValue[],
    right: JSONValue[],
    path: Path,
    mergeFn: AnyMerge,
  ): JSONValue[] | typeof CannotMerge => {
    if (jsonSameType(orig, left, right) !== 'array') {
      return CannotMerge;
    }
    return internalTrimergeArray(
      orig as JSONArray,
      left as JSONArray,
      right as JSONArray,
      path,
      mergeFn,
      getArrayItemKey,
    );
  };
}

function internalTrimergeArray(
  orig: JSONValue[],
  left: JSONValue[],
  right: JSONValue[],
  path: Path,
  mergeFn: AnyMerge,
  getArrayItemKey: ArrayKeyFn,
): JSONValue[] {
  const origMap: JSONObject = {};
  const leftMap: JSONObject = {};
  const rightMap: JSONObject = {};
  const origKeys = orig.map(
    (item, index): string => {
      const key = getArrayItemKey(item, index, path);
      if (key in origMap) {
        throw new Error(`Duplicate array key '${key}' at /${path}`);
      }
      origMap[key] = item;
      return key;
    },
  );
  const leftKeys = left.map(
    (item, index): string => {
      const key = getArrayItemKey(item, index, path);
      if (key in leftMap) {
        throw new Error(`Duplicate array key '${key}' at /${path}`);
      }
      leftMap[key] = item;
      return key;
    },
  );
  const rightKeys = right.map(
    (item, index): string => {
      const key = getArrayItemKey(item, index, path);
      if (key in rightMap) {
        throw new Error(`Duplicate array key '${key}' at /${path}`);
      }
      rightMap[key] = item;
      return key;
    },
  );

  const obj = internalTrimergeJsonObject(
    origMap,
    leftMap,
    rightMap,
    origKeys,
    leftKeys,
    rightKeys,
    path,
    mergeFn,
  );

  const result: JSONValue[] = [];
  const sides: string[][] = [leftKeys, origKeys, rightKeys];
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
      // const leftSlice = new Set(leftKeys.slice(leftStart, leftEnd));
      const rightSlice = new Set(rightKeys.slice(rightStart, rightEnd));
      const origSlice = new Set(origKeys.slice(origStart, origEnd));
      for (let j = leftStart; j < leftEnd; j++) {
        const key = leftKeys[j];
        if (rightSlice.has(key) || !origSlice.has(key)) {
          result.push(obj[key]);
        }
      }
      for (let j = rightStart; j < rightEnd; j++) {
        const key = rightKeys[j];
        if (!origSlice.has(key)) {
          result.push(obj[key]);
        }
      }
    } else {
      const [side, start, length] = index;
      const arr = sides[side];
      const end = start + length;
      for (let j = start; j < end; j++) {
        result.push(obj[arr[j]]);
      }
    }
  }
  return result;
}

export function trimergeJsonObject(
  orig: JSONObject,
  left: JSONObject,
  right: JSONObject,
  path: Path,
  mergeFn: AnyMerge,
): JSONObject | typeof CannotMerge {
  if (jsonSameType(orig, left, right) !== 'object') {
    return CannotMerge;
  }
  return internalTrimergeJsonObject(
    orig,
    left,
    right,
    Object.keys(orig),
    Object.keys(left),
    Object.keys(right),
    path,
    mergeFn,
  );
}

function internalTrimergeJsonObject(
  orig: JSONObject,
  left: JSONObject,
  right: JSONObject,
  origKeys: string[],
  leftKeys: string[],
  rightKeys: string[],
  path: Path,
  merge: AnyMerge,
): JSONObject {
  const newObject: JSONObject = {};
  const keys = new Set<string>(origKeys);
  leftKeys.forEach(keys.add, keys);
  rightKeys.forEach(keys.add, keys);
  keys.forEach((key) => {
    const merged = merge(
      orig[key],
      left[key],
      right[key],
      [...path, key],
      merge,
    );
    if (merged !== undefined) {
      newObject[key] = merged;
    }
  });
  return newObject;
}
