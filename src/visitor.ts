import { Path, PathKey } from './path';
import { type } from './type';

export type VisitFn = (
  value: any,
  path: Path,
) => IterableIterator<[any, PathKey]>;

/**
 * This is a function that returns a function that iterates through an directed tree graph
 *
 * For each node in the tree, the visit function is called to decide what to do with the
 *
 * @param visitFn
 */
export function visitor(visitFn: VisitFn) {
  const visit = (value: any, path: Path = []) => {
    for (const [child, key] of visitFn(value, path)) {
      visit(child, [...path, key]);
    }
  };
  return visit;
}

const hasOwnProperty = Object.prototype.hasOwnProperty;
export function* defaultVisit(
  value: any,
): IterableIterator<[any, string | number]> {
  switch (type(value)) {
    case 'object':
      for (const key in value) {
        if (hasOwnProperty.call(value, key)) {
          yield [value[key], key];
        }
      }
      break;

    case 'array':
      for (let i = 0; i < value.length; i++) {
        yield [value[i], i];
      }
      break;
    default:
      break;
  }
}

export function* visitObject(
  object: Record<string, any>,
): IterableIterator<[any, string]> {
  for (const key in object) {
    if (hasOwnProperty.call(object, key)) {
      yield [object[key], key];
    }
  }
}

export function* visitArray(array: any[]): IterableIterator<[any, number]> {
  for (let i = 0; i < array.length; i++) {
    yield [array[i], i];
  }
}

export function* visitIdArray(
  array: any[],
  keyPropName: string = 'id',
): IterableIterator<[any, string]> {
  const seenKeys = new Set<string>();
  for (let i = 0; i < array.length; i++) {
    const item = array[i];
    if (!(keyPropName in item)) {
      throw new Error(`no ${keyPropName} in array item ${i}`);
    }
    const key = item[keyPropName];
    if (seenKeys.has(key)) {
      throw new Error(`Duplicate array key '${key}' at ${i}`);
    }
    yield [item, key];
  }
}
