/* eslint-disable @typescript-eslint/no-explicit-any */
import { Path } from './path';
import { CannotMerge } from './cannot-merge';
import { JSONValue } from './json';

export type MergeFn<T> = (
  orig: T,
  left: T,
  right: T,
  path: Path,
  mergeFn: AnyMerge,
) => T;
export type AnyMerge = MergeFn<any>;

export type Merger = (orig: any, left: any, right: any, basePath?: Path) => any;

export function combineMergers(...mergers: AnyMerge[]): Merger {
  const combinedMerger: Merger = (orig, left, right, basePath = []): any => {
    for (const merger of mergers) {
      const result = merger(orig, left, right, basePath, combinedMerger);
      if (result !== CannotMerge) {
        return result;
      }
    }
    throw new ConflictError(orig, left, right, basePath);
  };
  return combinedMerger;
}

export class ConflictError extends Error {
  public constructor(
    public readonly origValue: any,
    public readonly leftValue: any,
    public readonly rightValue: any,
    public readonly path: Path,
    message: string = 'conflict',
  ) {
    super(`${message} at /${path.join('/')}`);
  }
}

export function trimergeEquality(
  orig: JSONValue,
  left: JSONValue,
  right: JSONValue,
): JSONValue | typeof CannotMerge {
  if (left === right) {
    return left;
  }
  if (orig === right) {
    return left;
  }
  if (orig === left) {
    return right;
  }
  return CannotMerge;
}
