import { CannotMerge } from './cannot-merge';
import { type } from './type';

export function jsSameType(
  orig: any,
  left: any,
  right: any,
): ReturnType<typeof type> | typeof CannotMerge {
  const origType = type(orig);
  const leftType = type(left);
  const rightType = type(right);
  if (leftType !== rightType || leftType !== origType) {
    return CannotMerge;
  }
  return leftType;
}
