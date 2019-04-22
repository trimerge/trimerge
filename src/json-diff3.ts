import { diff3MergeIndices, Index } from 'node-diff3';
import { JSONArray, JSONObject, JSONValue } from './json';
import deepEqual from './json-equal';
import { Path } from './path';
import { type } from './type';

export interface Handler {
  getArrayItemKey(item: JSONValue, index: number, arrayPath: Path): string;
  handleMerge(
    o: JSONValue | undefined,
    a: JSONValue,
    b: JSONValue,
    path: Path,
  ): JSONValue;
}
export function getArrayItemKeyStringValue(item: JSONValue): string {
  return String(item);
}
export function throwingMerge(
  _o: JSONValue,
  _a: JSONValue,
  _b: JSONValue,
  path: Path,
): JSONValue {
  throw new Error(`Conflict at /${path.join('/')}`);
}

type MergeFn<T> = (orig: T, a: T, b: T, path: Path, merger: AnyMerge) => T;
type AnyMerge = MergeFn<any>;

export function diff3(
  orig: JSONValue,
  a: JSONValue,
  b: JSONValue,
  basePath: Path = [],
  diffFn: Merger,
): JSONValue {
  if (deepEqual(a, b)) {
    // Merging to same thing
    return a;
  }
  if (deepEqual(orig, a)) {
    // Only b changed
    return b;
  }
  if (deepEqual(orig, b)) {
    // Only a changed
    return a;
  }

  const typeo = type(orig);
  const typea = type(a);
  const typeb = type(b);
  if (typea === typeb && typea === typeo) {
    if (typea === 'array') {
      return diff3Array(
        orig as JSONArray,
        a as JSONArray,
        b as JSONArray,
        basePath,
        merger,
      );
    }
    if (typea === 'object') {
      return diff3Object(
        orig as JSONObject,
        a as JSONObject,
        b as JSONObject,
        basePath,
        merger,
      );
    }
  }
  return merger(orig, a, b, basePath, merger);
}

function diff3Array(
  orig: JSONValue[],
  a: JSONValue[],
  b: JSONValue[],
  handler: Handler,
  path: Path,
): JSONValue[] {
  const origMap: JSONObject = {};
  const aMap: JSONObject = {};
  const bMap: JSONObject = {};
  const origKeys = orig.map((item, index) => {
    const key = handler.getArrayItemKey(item, index, path);
    if (key in origMap) {
      throw new Error(`Duplicate array key '${key}' at /${path}`);
    }
    origMap[key] = item;
    return key;
  });
  const aKeys = a.map((item, index) => {
    const key = handler.getArrayItemKey(item, index, path);
    if (key in aMap) {
      throw new Error(`Duplicate array key '${key}' at /${path}`);
    }
    aMap[key] = item;
    return key;
  });
  const bKeys = b.map((item, index) => {
    const key = handler.getArrayItemKey(item, index, path);
    if (key in bMap) {
      throw new Error(`Duplicate array key '${key}' at /${path}`);
    }
    bMap[key] = item;
    return key;
  });

  const obj = diff3ObjectInternal(
    origMap,
    aMap,
    bMap,
    origKeys,
    aKeys,
    bKeys,
    handler,
    path,
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

function diff3Object(
  orig: JSONObject,
  a: JSONObject,
  b: JSONObject,
  handler: Handler,
  path: Path,
): JSONObject {
  return diff3ObjectInternal(
    orig,
    a,
    b,
    Object.keys(orig),
    Object.keys(a),
    Object.keys(b),
    handler,
    path,
  );
}

function diff3ObjectInternal(
  orig: JSONObject,
  a: JSONObject,
  b: JSONObject,
  origKeys: string[],
  aKeys: string[],
  bKeys: string[],
  handler: Handler,
  path: Path,
): JSONObject {
  const newObject: JSONObject = {};
  const origKeySet = new Set(origKeys);
  const remainingBKeySet = new Set(bKeys);
  // possibilities:
  // key in: a          --- use a
  // key in: b          --- use b
  // key in: a, b, orig --- if a === orig, use b,
  //                        if b === orig, use a,
  //                        else conflict
  // key in: a, orig    --- if a === orig, use none
  //                        else conflict
  // key in: b, orig    --- if b === orig, use none
  //                        else conflict
  // key in: a, b       --- conflict
  // key in: orig       --- use none
  aKeys.forEach((key) => {
    const inOrig = origKeySet.has(key);
    const inB = remainingBKeySet.has(key);
    if (!inB && !inOrig) {
      // key is new in a
      newObject[key] = a[key];
    } else {
      // Possible conflict
      const merged = diff3(orig[key], a[key], b[key], handler, [...path, key]);
      if (merged !== undefined) {
        newObject[key] = merged;
      }
      if (inB) {
        remainingBKeySet.delete(key);
      }
    }
  });
  // Remaining b keys that weren't in a
  remainingBKeySet.forEach((key) => {
    const inOrig = origKeySet.has(key);
    if (inOrig) {
      const merged = diff3(orig[key], a[key], b[key], handler, [...path, key]);
      if (merged !== undefined) {
        newObject[key] = merged;
      }
    } else {
      // key is new in b
      newObject[key] = b[key];
    }
  });
  return newObject;
}
