import { CannotMerge } from './cannot-merge';
import { diff3MergeStrings } from './diff3-string';

export function trimergeString(
  orig: any = '',
  left: any = '',
  right: any = '',
): string | typeof CannotMerge {
  if (
    typeof orig !== 'string' ||
    typeof left !== 'string' ||
    typeof right !== 'string'
  ) {
    return CannotMerge;
  }
  return diff3MergeStrings(orig, left, right);
}
