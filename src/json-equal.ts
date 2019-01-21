// Based on https://www.npmjs.com/package/fast-deep-equal
// - Converted to TypeScript
// - Remove support for Date and RegExp (not available in JSON)
// - Accept undefined values as same as missing keys

const isArray = Array.isArray;
const keyList = Object.keys;
const hasProp = Object.prototype.hasOwnProperty;

export default function equal(a: any, b: any) {
  if (a === b) return true;

  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const aIsArray = isArray(a);
    const bIsArray = isArray(b);

    if (aIsArray && bIsArray) {
      const length = a.length;
      if (length !== b.length) {
        return false;
      }
      for (let i = length; i-- !== 0; ) {
        if (!equal(a[i], b[i])) {
          return false;
        }
      }
      return true;
    }

    if (aIsArray !== bIsArray) {
      return false;
    }

    // Strip out keys where the value is undefined (since JSON treats this as a non-existent field)
    const aKeys = keyList(a).filter((key) => a[key] !== undefined);
    const bKeys = keyList(b).filter((key) => b[key] !== undefined);
    const aKeysLength = aKeys.length;
    if (aKeysLength !== bKeys.length) {
      return false;
    }
    for (let i = aKeysLength; i-- !== 0; ) {
      if (!hasProp.call(b, aKeys[i])) {
        return false;
      }
    }

    for (let i = aKeysLength; i-- !== 0; ) {
      const key = aKeys[i];
      if (!equal(a[key], b[key])) {
        return false;
      }
    }

    return true;
  }

  return a !== a && b !== b;
}
