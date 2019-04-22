import { diff3MergeIndices, Index } from 'node-diff3';
import { JSONArray, JSONObject, JSONValue } from './json';
import deepEqual from './json-equal';
import { Path } from './path';
import { type } from './type';

type ArrayKeyFn = (item: JSONValue, index: number, arrayPath: Path) => string;
type MergeFn<T> = (orig: T, a: T, b: T, path: Path, mergeFn: AnyMerge) => T;
type AnyMerge = MergeFn<any>;

export function makeMerger(merger: AnyMerge) {
  return (orig: any, left: any, right: any, basePath: Path = []) => {
    return merger(orig, left, right, basePath, merger);
  };
}
export class ConflictError extends Error {
  constructor(
    public readonly origValue: any,
    public readonly leftValue: any,
    public readonly rightValue: any,
    public readonly path: Path,
    message: string = 'conflict',
  ) {
    super(`${message} at ${path.join('/')}`);
  }
}
export const jsonMerge = (getArrayItemKey: ArrayKeyFn) => (
  orig: JSONValue,
  left: JSONValue,
  right: JSONValue,
  basePath: Path = [],
  mergeFn: MergeFn<JSONValue>,
): JSONValue => {
  if (deepEqual(left, right)) {
    // Merging to same thing
    return left;
  }
  if (deepEqual(orig, left)) {
    // Only right changed
    return right;
  }
  if (deepEqual(orig, right)) {
    // Only left changed
    return left;
  }

  const typeo = type(orig);
  const typea = type(left);
  const typeb = type(right);
  if (typea !== typeb || typea !== typeo) {
    throw new ConflictError(
      orig,
      left,
      right,
      basePath,
      `mismatched types (${typeo}, ${typea}, ${typeb})`,
    );
  }
  if (typea === 'array') {
    return diff3Array(
      orig as JSONArray,
      left as JSONArray,
      right as JSONArray,
      basePath,
      mergeFn,
      getArrayItemKey,
    );
  }
  if (typea === 'object') {
    return diff3Object(
      orig as JSONObject,
      left as JSONObject,
      right as JSONObject,
      basePath,
      mergeFn,
    );
  }
  throw new ConflictError(orig, left, right, basePath);
};

function diff3Array(
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
  const origKeys = orig.map((item, index) => {
    const key = getArrayItemKey(item, index, path);
    if (key in origMap) {
      throw new Error(`Duplicate array key '${key}' at /${path}`);
    }
    origMap[key] = item;
    return key;
  });
  const aKeys = a.map((item, index) => {
    const key = getArrayItemKey(item, index, path);
    if (key in aMap) {
      throw new Error(`Duplicate array key '${key}' at /${path}`);
    }
    aMap[key] = item;
    return key;
  });
  const bKeys = b.map((item, index) => {
    const key = getArrayItemKey(item, index, path);
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

function diff3Object(
  orig: JSONObject,
  a: JSONObject,
  b: JSONObject,
  path: Path,
  mergeFn: AnyMerge,
): JSONObject {
  return diff3ObjectInternal(
    orig,
    a,
    b,
    Object.keys(orig),
    Object.keys(a),
    Object.keys(b),
    path,
    mergeFn,
  );
}

function diff3ObjectInternal(
  orig: JSONObject,
  left: JSONObject,
  right: JSONObject,
  origKeys: string[],
  leftKeys: string[],
  rightKeys: string[],
  path: Path,
  mergeFn: AnyMerge,
): JSONObject {
  const newObject: JSONObject = {};
  const keys = new Set<string>(origKeys);
  leftKeys.forEach(keys.add, keys);
  rightKeys.forEach(keys.add, keys);
  keys.forEach((key) => {
    const merged = mergeFn(
      orig[key],
      left[key],
      right[key],
      [...path, key],
      mergeFn,
    );
    if (merged !== undefined) {
      newObject[key] = merged;
    }
  });
  return newObject;
}

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
