declare module 'node-diff3' {
  export type ConflictIndex = [
    -1,
    number,
    number,
    number,
    number,
    number,
    number
  ];
  export type Side = 0 | 1 | 2;
  export type SideIndex = [Side, number, number];
  export type Index = ConflictIndex | SideIndex;
  export function diff3MergeIndices(
    a: string,
    original: string,
    b: string,
  ): Index[];
  export function diff3MergeIndices(
    a: string[],
    original: string[],
    b: string[],
  ): Index[];
}
