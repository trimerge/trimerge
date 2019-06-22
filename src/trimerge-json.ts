import { JSONArray, JSONObject, JSONValue } from './json';
import { Path } from './path';
import { CannotMerge } from './cannot-merge';
import deepEqual from './json-equal';
import { type } from './type';
import { MergeFn, trimergeEqualityCreator } from './trimerge';
import { diff3Keys } from './diff3-keys';

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

export function trimergeArrayCreator(getArrayItemKey: ArrayKeyFn): MergeFn {
  return (
    orig: any,
    left: any,
    right: any,
    path: Path,
    mergeFn: MergeFn,
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
  mergeFn: MergeFn,
  getArrayItemKey: ArrayKeyFn,
): JSONValue[] {
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
  diff3Keys(leftKeys, origKeys, rightKeys, (key) => {
    result.push(obj[key]);
  });
  return result;
}

export function trimergeJsonObject(
  orig: any,
  left: any,
  right: any,
  path: Path,
  mergeFn: MergeFn,
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
  merge: MergeFn,
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
