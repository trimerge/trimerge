import { CannotMerge } from './cannot-merge';
import { type } from './type';

export function jsSameType(
  orig: any,
  left: any,
  right: any,
): typeof orig | 'array' | 'null' | typeof CannotMerge {
  const typeo = type(orig);
  const typea = type(left);
  const typeb = type(right);
  if (typea !== typeb || typea !== typeo) {
    return CannotMerge;
  }
  return typea;
}
