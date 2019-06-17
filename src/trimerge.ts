import { Path } from './path';
import { CannotMerge } from './cannot-merge';

export type MergeFn = (
  orig: any,
  left: any,
  right: any,
  basePath: Path,
  mergeFn: MergeFn,
) => any | typeof CannotMerge;

type RootMergeFn = (
  orig: any,
  left: any,
  right: any,
  basePath?: Path,
  mergeFn?: MergeFn,
) => any | typeof CannotMerge;

export function combineMergers(...mergers: MergeFn[]): RootMergeFn {
  const combinedMerger: RootMergeFn = (
    orig,
    left,
    right,
    basePath = [],
    mergeFn = combinedMerger,
  ): any => {
    for (const merger of mergers) {
      const result = merger(orig, left, right, basePath, mergeFn);
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
): MergeFn {
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
