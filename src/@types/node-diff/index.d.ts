declare module 'node-diff3' {
  export function diffIndices(a: string, b: string): number[][];
  export function diffIndices(a: string[], b: string[]): number[][];

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

  export function diff3Merge(
    a: string[],
    original: string[],
    b: string[],
    excludeFalseConflicts: boolean,
  ): (
    | { ok: string[] }
    | {
        conflict: {
          a: string[];
          aIndex: number;
          o: string[];
          oIndex: number;
          b: string[];
          bIndex: number;
        };
      })[];
}
