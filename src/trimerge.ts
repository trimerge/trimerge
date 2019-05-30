import { Path } from './path';
import { CannotMerge } from './cannot-merge';

/* eslint-disable @typescript-eslint/no-explicit-any */
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
    throw new CannotMergeError(basePath);
  };
  return combinedMerger;
}

export class CannotMergeError extends Error {
  public constructor(path: Path) {
    super(`cannot merge /${path.join('/')}`);
  }
}

export const trimergeEquality = trimergeEqualityCreator((a, b) => a === b);

export function trimergeEqualityCreator(
  equal: (a: any, b: any) => boolean,
): AnyMerge {
  return (orig, left, right) => {
    if (equal(left, right)) {
      // Merging to same thing
      return left;
    }
    if (equal(orig, left)) {
      // Only right changed
      return right;
    }
    if (equal(orig, right)) {
      // Only left changed
      return left;
    }
    return CannotMerge;
  };
}
