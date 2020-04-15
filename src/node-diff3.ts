// Based on https://github.com/bhousel/node-diff3
// MIT License
// Changes:
// - Migrated to TypeScript, use let/const
// - Removed unused functions
// - Generalized for any array type

import fastDiff, { DELETE, EQUAL, INSERT } from 'fast-diff';

interface Range {
  location: number;
  length: number;
}

interface Sliceable {
  slice(begin: number, end?: number): this;
}

export type SliceableArrayLike<T> = ArrayLike<T> & Sliceable;

export function makeRange(location: number, length: number): Range {
  return { location, length };
}

export function upperBound({ location, length }: Range): number {
  return location + length;
}

export interface ConflictIndex {
  type: 'conflict';
  aRange: Range;
  oRange: Range;
  bRange: Range;
}

export interface OkIndexA {
  type: 'okA';
  length: number;
  aIndex: number;
  oIndex: number | undefined;
  bIndex: number | undefined;
}

export interface OkIndexB {
  type: 'okB';
  length: number;
  aIndex: number | undefined;
  oIndex: number | undefined;
  bIndex: number;
}

export type OkIndex = OkIndexA | OkIndexB;

export type Index = ConflictIndex | OkIndex;

// Text diff algorithm following Hunt and McIlroy 1976.
// J. W. Hunt and M. D. McIlroy, An algorithm for differential file
// comparison, Bell Telephone Laboratories CSTR #41 (1976)
// http://www.cs.dartmouth.edu/~doug/
//
export interface Candidate {
  aIndex: number;
  bIndex: number;
  chain: Candidate | undefined;
}

function arrayLikeShallowEqual<T>(a: ArrayLike<T>, b: ArrayLike<T>) {
  if (a === b) {
    return false;
  }
  const length = a.length;
  if (length !== b.length) {
    return false;
  }
  for (let i = 0; i < length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

// Expects two arrays
export function LCS<T>(
  a: ArrayLike<T>,
  b: ArrayLike<T>,
): Candidate | undefined {
  // short circuit in case of equality to prevent time-consuming LCS call
  if (arrayLikeShallowEqual(a, b)) {
    return undefined;
  }

  const equivalenceClasses = new Map<T, number[]>();
  for (let j = 0; j < b.length; j++) {
    const line = b[j];
    const equivalenceClass = equivalenceClasses.get(line);
    if (equivalenceClass) {
      equivalenceClass.push(j);
    } else {
      equivalenceClasses.set(line, [j]);
    }
  }

  const candidates: Candidate[] = [
    { aIndex: -1, bIndex: -1, chain: undefined },
  ];

  for (let i = 0; i < a.length; i++) {
    const line = a[i];
    const bIndices = equivalenceClasses.get(line) || [];

    let r = 0;
    let c = candidates[0];

    for (let jX = 0; jX < bIndices.length; jX++) {
      const j = bIndices[jX];

      let s;
      for (s = r; s < candidates.length; s++) {
        if (
          candidates[s].bIndex < j &&
          (s === candidates.length - 1 || candidates[s + 1].bIndex > j)
        ) {
          break;
        }
      }

      if (s < candidates.length) {
        const newCandidate: Candidate = {
          aIndex: i,
          bIndex: j,
          chain: candidates[s],
        };
        candidates[r] = c;
        r = s + 1;
        c = newCandidate;
        if (r === candidates.length) {
          break; // no point in examining further (j)s
        }
      }
    }

    candidates[r] = c;
  }

  // At this point, we know the LCS: it's in the reverse of the
  // linked-list through .chain of candidates[candidates.length - 1].
  return candidates[candidates.length - 1];
}

interface DiffIndicesResult {
  a: Range;
  b: Range;
}

export function diffIndicesString(a: string, b: string): DiffIndicesResult[] {
  const diffResult = fastDiff(a, b);

  let aIndex = 0;
  let bIndex = 0;

  let lastA = 0;
  let lastB = 0;

  const result: DiffIndicesResult[] = [];

  function flush() {
    if (aIndex > lastA || bIndex > lastB) {
      result.push({
        a: makeRange(lastA, aIndex - lastA),
        b: makeRange(lastB, bIndex - lastB),
      });
    }
  }

  for (const [type, str] of diffResult) {
    switch (type) {
      case EQUAL: {
        flush();
        aIndex += str.length;
        bIndex += str.length;
        lastA = aIndex;
        lastB = bIndex;
        break;
      }
      case INSERT: {
        bIndex += str.length;
        break;
      }
      case DELETE: {
        aIndex += str.length;
        break;
      }
    }
  }
  flush();

  return result;
}
export function diffRangesFastDiffString(a: string, b: string): Diff2Range[] {
  let aIndex = 0;
  let bIndex = 0;

  let lastA = 0;
  let lastB = 0;

  const result: Diff2Range[] = [];

  const diffs = fastDiff(a, b);
  for (let i = 0; i < diffs.length; i++) {
    const [type, str] = diffs[i];
    switch (type) {
      case EQUAL: {
        aIndex += str.length;
        bIndex += str.length;
        break;
      }
      case INSERT: {
        const next = diffs[i + 1];
        bIndex += str.length;
        if (next && next[0] === DELETE) {
          aIndex += next[1].length;
          i++;
        }
        break;
      }
      case DELETE: {
        aIndex += str.length;
        const next = diffs[i + 1];
        if (next && next[0] === INSERT) {
          bIndex += next[1].length;
          i++;
        }
        break;
      }
    }
    result.push({
      same: type === EQUAL,
      a: { min: lastA, max: aIndex },
      b: { min: lastB, max: bIndex },
    });
    lastA = aIndex;
    lastB = bIndex;
  }

  return result;
}

// We apply the LCS to give a simple representation of the
// offsets and lengths of mismatched chunks in the input
// files. This is used by diff3MergeIndices below.
export function diffIndicesLCS<T>(
  a: ArrayLike<T>,
  b: ArrayLike<T>,
): DiffIndicesResult[] {
  const result: DiffIndicesResult[] = [];

  let tail1 = a.length;
  let tail2 = b.length;

  for (
    let candidate: Candidate | undefined = LCS(a, b);
    candidate !== undefined;
    candidate = candidate.chain
  ) {
    const mismatchLength1 = tail1 - candidate.aIndex - 1;
    const mismatchLength2 = tail2 - candidate.bIndex - 1;
    tail1 = candidate.aIndex;
    tail2 = candidate.bIndex;

    if (mismatchLength1 || mismatchLength2) {
      result.push({
        a: makeRange(tail1 + 1, mismatchLength1),
        b: makeRange(tail2 + 1, mismatchLength2),
      });
    }
  }

  result.reverse();
  return result;
}

// We apply the LCS to give a simple representation of the
// offsets and lengths of mismatched chunks in the input
export type Diff2Range = { same: boolean; a: MinMaxRange; b: MinMaxRange };
type MinMaxRange = { min: number; max: number };

function addToMinMax(range: MinMaxRange, value: number) {
  if (value < range.min) {
    range.min = value;
  } else if (value + 1 > range.max) {
    range.max = value + 1;
  }
}

function minMax(value: number): MinMaxRange {
  return { min: value, max: value };
}

function hasRange(range: MinMaxRange) {
  return range.min < range.max;
}

// files. This is used by diff3MergeIndices below.
export function diffRangesLCS<T>(
  a: ArrayLike<T>,
  b: ArrayLike<T>,
): readonly Diff2Range[] {
  const result: Diff2Range[] = [];
  let tailA = a.length;
  let tailB = b.length;
  let commonA = minMax(tailA);
  let commonB = minMax(tailB);

  function processCommon() {
    if (hasRange(commonA)) {
      result.push({ same: true, a: commonA, b: commonB });
    }
  }

  for (let candidate = LCS(a, b); candidate; candidate = candidate.chain) {
    const { aIndex, bIndex } = candidate;
    const diffA = minMax(tailA);
    const diffB = minMax(tailB);

    if (tailA > aIndex + 1) {
      addToMinMax(diffA, aIndex + 1);
    }
    if (tailB > bIndex + 1) {
      addToMinMax(diffB, bIndex + 1);
    }
    tailA = aIndex;
    tailB = bIndex;

    if (hasRange(diffA) || hasRange(diffB)) {
      processCommon();
      result.push({ same: false, a: diffA, b: diffB });
      commonA = minMax(tailA);
      commonB = minMax(tailB);
    }

    if (tailA >= 0) {
      addToMinMax(commonA, tailA);
      addToMinMax(commonB, tailB);
    }
  }

  processCommon();

  result.reverse();
  return result;
}

export function diffIndices<T>(
  a: ArrayLike<T>,
  b: ArrayLike<T>,
): DiffIndicesResult[] {
  if (typeof a === 'string' && typeof b === 'string') {
    return diffIndicesString(a, b);
  }
  return diffIndicesLCS(a, b);
}

export function diffRanges<T extends any[] | string>(
  a: T,
  b: T,
): readonly Diff2Range[] {
  if (typeof a === 'string' && typeof b === 'string') {
    return diffRangesFastDiffString(a, b);
  }
  return diffRangesLCS(a, b);
}

// Given three files, A, O, and B, where both A and B are
// independently derived from O, returns a fairly complicated
// internal representation of merge decisions it's taken. The
// interested reader may wish to consult
//
// Sanjeev Khanna, Keshav Kunal, and Benjamin C. Pierce.
// 'A Formal Investigation of ' In Arvind and Prasad,
// editors, Foundations of Software Technology and Theoretical
// Computer Science (FSTTCS), December 2007.
//
// (http://www.cis.upenn.edu/~bcpierce/papers/diff3-short.pdf)
export function diff3MergeIndices<T>(
  o: ArrayLike<T>,
  a: ArrayLike<T>,
  b: ArrayLike<T>,
): Index[] {
  const m1 = diffIndices(o, a);
  const m2 = diffIndices(o, b);

  interface Hunk {
    side: 'a' | 'b';
    oRange: Range;
    sideRange: Range;
  }

  const hunks: Hunk[] = [];
  function addHunk(h: DiffIndicesResult, side: 'a' | 'b') {
    hunks.push({
      side,
      oRange: h.a,
      sideRange: h.b,
    });
  }
  for (let i = 0; i < m1.length; i++) {
    addHunk(m1[i], 'a');
  }
  for (let i = 0; i < m2.length; i++) {
    addHunk(m2[i], 'b');
  }
  hunks.sort((x, y) => x.oRange.location - y.oRange.location);

  const result: Index[] = [];
  let oOffset = 0;
  let aOffset = 0;
  let bOffset = 0;
  function copyCommon(targetOffset: number) {
    const delta = targetOffset - oOffset;
    if (delta > 0) {
      result.push({
        type: 'okA',
        length: delta,
        aIndex: aOffset,
        oIndex: oOffset,
        bIndex: bOffset,
      });
      aOffset += delta;
      bOffset += delta;
      oOffset += delta;
    }
  }

  for (let hunkIndex = 0; hunkIndex < hunks.length; hunkIndex++) {
    const firstHunkIndex = hunkIndex;
    let hunk = hunks[hunkIndex];
    const regionLhs = hunk.oRange.location;
    let regionRhs = upperBound(hunk.oRange);
    while (hunkIndex < hunks.length - 1) {
      const maybeOverlapping = hunks[hunkIndex + 1];
      const maybeLhs = maybeOverlapping.oRange.location;
      if (maybeLhs > regionRhs) {
        break;
      }
      regionRhs = Math.max(regionRhs, upperBound(maybeOverlapping.oRange));
      hunkIndex++;
    }

    copyCommon(regionLhs);
    if (firstHunkIndex === hunkIndex) {
      // The 'overlap' was only one hunk long, meaning that
      // there's no conflict here. Either a and o were the
      // same, or b and o were the same.
      if (hunk.sideRange.length > 0) {
        if (hunk.side === 'a') {
          result.push({
            type: 'okA',
            length: hunk.sideRange.length,
            oIndex: undefined,
            aIndex: hunk.sideRange.location,
            bIndex: undefined,
          });
        } else {
          result.push({
            type: 'okB',
            length: hunk.sideRange.length,
            oIndex: undefined,
            aIndex: undefined,
            bIndex: hunk.sideRange.location,
          });
        }
      }

      const delta = regionRhs - oOffset;
      oOffset = regionRhs;
      aOffset =
        hunk.side === 'a' ? upperBound(hunk.sideRange) : aOffset + delta;
      bOffset =
        hunk.side === 'b' ? upperBound(hunk.sideRange) : bOffset + delta;
    } else {
      // A proper conflict. Determine the extents of the
      // regions involved from a, o and b. Effectively merge
      // all the hunks on the left into one giant hunk, and
      // do the same for the right; then, correct for skew
      // in the regions of o that each side changed, and
      // report appropriate spans for the three sides.
      const regions = {
        a: [a.length, -1, o.length, -1],
        b: [b.length, -1, o.length, -1],
      };
      for (let i = firstHunkIndex; i <= hunkIndex; i++) {
        hunk = hunks[i];
        const side = hunk.side;
        const r = regions[side];
        const oLhs = hunk.oRange.location;
        const oRhs = upperBound(hunk.oRange);
        const abLhs = hunk.sideRange.location;
        const abRhs = upperBound(hunk.sideRange);
        r[0] = Math.min(abLhs, r[0]);
        r[1] = Math.max(abRhs, r[1]);
        r[2] = Math.min(oLhs, r[2]);
        r[3] = Math.max(oRhs, r[3]);
      }
      const aLhs = regions.a[0] + (regionLhs - regions.a[2]);
      const aRhs = regions.a[1] + (regionRhs - regions.a[3]);
      const bLhs = regions.b[0] + (regionLhs - regions.b[2]);
      const bRhs = regions.b[1] + (regionRhs - regions.b[3]);
      result.push({
        type: 'conflict',
        aRange: makeRange(aLhs, aRhs - aLhs),
        oRange: makeRange(regionLhs, regionRhs - regionLhs),
        bRange: makeRange(bLhs, bRhs - bLhs),
      });

      oOffset = regionRhs;
      aOffset = aRhs;
      bOffset = bRhs;
    }
  }

  copyCommon(o.length);
  return result;
}
