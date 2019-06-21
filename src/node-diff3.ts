// Based on https://github.com/bhousel/node-diff3
// MIT License
// Changes:
// - Migrated to TypeScript, use let/const
// - Removed unused functions
// - Generalized for any array type
// -

export type ConflictIndex = [
  -1,
  number,
  number,
  number,
  number,
  number,
  number,
];
export type Side = 0 | 1 | 2;
export type SideIndex = [Side, number, number];
export type Index = ConflictIndex | SideIndex;

// Text diff algorithm following Hunt and McIlroy 1976.
// J. W. Hunt and M. D. McIlroy, An algorithm for differential file
// comparison, Bell Telephone Laboratories CSTR #41 (1976)
// http://www.cs.dartmouth.edu/~doug/
//
interface Candidate {
  aIndex: number;
  bIndex: number;
  chain: Candidate | null;
}

// Expects two arrays
export function LCS<T>(a: ArrayLike<T>, b: ArrayLike<T>): Candidate {
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

  const candidates: Candidate[] = [{ aIndex: -1, bIndex: -1, chain: null }];

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
  a: [number, number];
  b: [number, number];
}
// We apply the LCS to give a simple representation of the
// offsets and lengths of mismatched chunks in the input
// files. This is used by diff3MergeIndices below.
export function diffIndices<T>(
  a: ArrayLike<T>,
  b: ArrayLike<T>,
): DiffIndicesResult[] {
  const result: DiffIndicesResult[] = [];
  let tail1 = a.length;
  let tail2 = b.length;

  for (
    let candidate: Candidate | null = LCS(a, b);
    candidate !== null;
    candidate = candidate.chain
  ) {
    const mismatchLength1 = tail1 - candidate.aIndex - 1;
    const mismatchLength2 = tail2 - candidate.bIndex - 1;
    tail1 = candidate.aIndex;
    tail2 = candidate.bIndex;

    if (mismatchLength1 || mismatchLength2) {
      result.push({
        a: [tail1 + 1, mismatchLength1],
        b: [tail2 + 1, mismatchLength2],
      });
    }
  }

  result.reverse();
  return result;
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
  a: ArrayLike<T>,
  o: ArrayLike<T>,
  b: ArrayLike<T>,
): Index[] {
  const m1 = diffIndices(o, a);
  const m2 = diffIndices(o, b);

  type Hunk = [number, 0 | 2, number, number, number];
  const hunks: Hunk[] = [];
  function addHunk(h: DiffIndicesResult, side: 0 | 2) {
    hunks.push([h.a[0], side, h.a[1], h.b[0], h.b[1]]);
  }
  for (let i = 0; i < m1.length; i++) {
    addHunk(m1[i], 0);
  }
  for (let i = 0; i < m2.length; i++) {
    addHunk(m2[i], 2);
  }
  hunks.sort((x, y) => x[0] - y[0]);

  const result: Index[] = [];
  let commonOffset = 0;
  function copyCommon(targetOffset: number) {
    if (targetOffset > commonOffset) {
      result.push([1, commonOffset, targetOffset - commonOffset]);
      commonOffset = targetOffset;
    }
  }

  for (let hunkIndex = 0; hunkIndex < hunks.length; hunkIndex++) {
    const firstHunkIndex = hunkIndex;
    let hunk = hunks[hunkIndex];
    const regionLhs = hunk[0];
    let regionRhs = regionLhs + hunk[2];
    while (hunkIndex < hunks.length - 1) {
      const maybeOverlapping = hunks[hunkIndex + 1];
      const maybeLhs = maybeOverlapping[0];
      if (maybeLhs > regionRhs) {
        break;
      }
      regionRhs = Math.max(regionRhs, maybeLhs + maybeOverlapping[2]);
      hunkIndex++;
    }

    copyCommon(regionLhs);
    if (firstHunkIndex === hunkIndex) {
      // The 'overlap' was only one hunk long, meaning that
      // there's no conflict here. Either a and o were the
      // same, or b and o were the same.
      if (hunk[4] > 0) {
        result.push([hunk[1], hunk[3], hunk[4]]);
      }
    } else {
      // A proper conflict. Determine the extents of the
      // regions involved from a, o and b. Effectively merge
      // all the hunks on the left into one giant hunk, and
      // do the same for the right; then, correct for skew
      // in the regions of o that each side changed, and
      // report appropriate spans for the three sides.
      const regions = {
        0: [a.length, -1, o.length, -1],
        2: [b.length, -1, o.length, -1],
      };
      for (let i = firstHunkIndex; i <= hunkIndex; i++) {
        hunk = hunks[i];
        const side = hunk[1];
        const r = regions[side];
        const oLhs = hunk[0];
        const oRhs = oLhs + hunk[2];
        const abLhs = hunk[3];
        const abRhs = abLhs + hunk[4];
        r[0] = Math.min(abLhs, r[0]);
        r[1] = Math.max(abRhs, r[1]);
        r[2] = Math.min(oLhs, r[2]);
        r[3] = Math.max(oRhs, r[3]);
      }
      const aLhs = regions[0][0] + (regionLhs - regions[0][2]);
      const aRhs = regions[0][1] + (regionRhs - regions[0][3]);
      const bLhs = regions[2][0] + (regionLhs - regions[2][2]);
      const bRhs = regions[2][1] + (regionRhs - regions[2][3]);
      result.push([
        -1,
        aLhs,
        aRhs - aLhs,
        regionLhs,
        regionRhs - regionLhs,
        bLhs,
        bRhs - bLhs,
      ]);
    }
    commonOffset = regionRhs;
  }

  copyCommon(o.length);
  return result;
}
