import { Path } from './path';
import { PatchOperation } from './patch';

export type DiffCallback = (op: PatchOperation) => void;
export type DiffResult = true | false | undefined;
export type DiffFn = (
  before: any,
  after: any,
  onDiff: DiffCallback,
  basePath: Path,
  diffFn: DiffFn,
) => DiffResult;

type RootDiffFn = (
  before: any,
  after: any,
  onDiff: DiffCallback,
  basePath?: Path,
  diffFn?: DiffFn,
) => DiffResult;

export function combineDiffers(...differs: DiffFn[]): RootDiffFn {
  const combined: RootDiffFn = (
    before,
    after,
    onDiff,
    basePath = [],
    diffFn = combined,
  ) => {
    if (before === after) {
      return false;
    }
    for (const diff of differs) {
      const differs = diff(before, after, onDiff, basePath, diffFn);
      if (differs !== undefined) {
        return differs;
      }
    }
    return undefined;
  };
  return combined;
}

export const basicDiff: DiffFn = (_before, after, onDiff, path) => {
  onDiff({ type: 'set', path, value: after });
  return true;
};
