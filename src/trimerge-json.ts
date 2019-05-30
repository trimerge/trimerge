import { JSONArray, JSONObject, JSONValue } from './json';
import { Path } from './path';
import { diff3MergeIndices, Index } from 'node-diff3';
import { CannotMerge } from './cannot-merge';
import deepEqual from './json-equal';
import { type } from './type';
import { AnyMerge, MergeFn, trimergeEqualityCreator } from './trimerge';

type ArrayKeyFn = (item: JSONValue, index: number, arrayPath: Path) => string;

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
  a: JSONValue[],
  b: JSONValue[],
  path: Path,
  mergeFn: AnyMerge,
  getArrayItemKey: ArrayKeyFn,
): JSONValue[] {
  const origMap: JSONObject = {};
  const aMap: JSONObject = {};
  const bMap: JSONObject = {};
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
  const aKeys = a.map(
    (item, index): string => {
      const key = getArrayItemKey(item, index, path);
      if (key in aMap) {
        throw new Error(`Duplicate array key '${key}' at /${path}`);
      }
      aMap[key] = item;
      return key;
    },
  );
  const bKeys = b.map(
    (item, index): string => {
      const key = getArrayItemKey(item, index, path);
      if (key in bMap) {
        throw new Error(`Duplicate array key '${key}' at /${path}`);
      }
      bMap[key] = item;
      return key;
    },
  );

  const obj = interalTrimergeJsonObject(
    origMap,
    aMap,
    bMap,
    origKeys,
    aKeys,
    bKeys,
    path,
    mergeFn,
  );

  const result: JSONValue[] = [];
  const sides: string[][] = [aKeys, origKeys, bKeys];
  const indices: Index[] = diff3MergeIndices(aKeys, origKeys, bKeys);
  for (let i = 0; i < indices.length; i++) {
    const index: Index = indices[i];
    if (index[0] === -1) {
      const [, aStart, aLength, oStart, oLength, bStart, bLength] = index;
      const aEnd = aStart + aLength;
      const bEnd = bStart + bLength;
      const oEnd = oStart + oLength;
      // const aSlice = new Set(aKeys.slice(aStart, aEnd));
      const bSlice = new Set(bKeys.slice(bStart, bEnd));
      const oSlice = new Set(origKeys.slice(oStart, oEnd));
      for (let j = aStart; j < aEnd; j++) {
        const key = aKeys[j];
        if (bSlice.has(key) || !oSlice.has(key)) {
          result.push(obj[key]);
        }
      }
      for (let j = bStart; j < bEnd; j++) {
        const key = bKeys[j];
        if (!oSlice.has(key)) {
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
  return interalTrimergeJsonObject(
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

function interalTrimergeJsonObject(
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
