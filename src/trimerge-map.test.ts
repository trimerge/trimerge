import {
  CannotMergeError,
  combineMergers,
  MergeFn,
  trimergeEquality,
} from './trimerge';
import { Path } from './path';
import { CannotMerge } from './cannot-merge';
import {
  trimergeMap,
  trimergeMapCreator,
  trimergeUnorderedMap,
} from './trimerge-map';

function mockPathTrackingMerger(paths: Path[]): MergeFn {
  return (_orig, _left, _right, path = []): typeof CannotMerge => {
    paths.push(path);
    return CannotMerge;
  };
}

describe('trimergeMap', () => {
  it('adds field', () => {
    const s1 = new Map([
      ['hello', 1],
      ['world', 2],
    ]);
    const s2 = new Map([
      ['hello', 1],
      ['world', 2],
      ['there', 3],
    ]);
    const s3 = new Map([
      ['hello', 1],
      ['world', 2],
    ]);
    const paths: Path[] = [];
    const merger = combineMergers(
      mockPathTrackingMerger(paths),
      trimergeEquality,
      trimergeMap,
    );
    expect(merger(s1, s2, s3)).toBe(s2);
    expect(paths).toEqual([[], ['hello'], ['world'], ['there']]);
    // try reverse
    expect(merger(s1, s3, s2)).toBe(s2);
  });
  it('adds two fields', () => {
    const s1 = new Map([
      ['hello', 1],
      ['world', 2],
    ]);
    const s2 = new Map([
      ['hello', 1],
      ['world', 2],
      ['there', 3],
    ]);
    const s3 = new Map([
      ['hello', 1],
      ['world', 2],
      ['here', 4],
    ]);
    const paths: Path[] = [];
    const merger = combineMergers(
      mockPathTrackingMerger(paths),
      trimergeEquality,
      trimergeMap,
    );
    expect(merger(s1, s2, s3)).toEqual(
      new Map([
        ['hello', 1],
        ['world', 2],
        ['there', 3],
        ['here', 4],
      ]),
    );
    expect(paths).toEqual([[], ['hello'], ['world'], ['there'], ['here']]);

    // try reverse
    expect(merger(s1, s3, s2)).toEqual(
      new Map([
        ['hello', 1],
        ['world', 2],
        ['there', 3],
        ['here', 4],
      ]),
    );
  });
  it('changes field', () => {
    const s1 = new Map([
      ['hello', 1],
      ['world', 2],
    ]);
    const s2 = new Map([
      ['hello', 1],
      ['world', 2],
    ]);
    const s3 = new Map([
      ['hello', 1],
      ['world', 3],
    ]);
    const paths: Path[] = [];
    const merger = combineMergers(
      mockPathTrackingMerger(paths),
      trimergeEquality,
      trimergeMap,
    );
    expect(merger(s1, s2, s3)).toBe(s3);
    expect(paths).toEqual([[], ['hello'], ['world']]);
    // try reverse
    expect(merger(s1, s3, s2)).toBe(s3);
  });
  it('moves field 1', () => {
    const s1 = new Map([
      ['hello', 1],
      ['world', 2],
    ]);
    const s2 = new Map([
      ['hello', 1],
      ['world', 3],
    ]);
    const s3 = new Map([
      ['world', 2],
      ['hello', 1],
    ]);
    const paths: Path[] = [];
    const merger = combineMergers(
      mockPathTrackingMerger(paths),
      trimergeEquality,
      trimergeMap,
    );
    expect(merger(s1, s2, s3)).toEqual(
      new Map([
        ['world', 3],
        ['hello', 1],
      ]),
    );
    expect(paths).toEqual([[], ['hello'], ['world']]);
  });
  it('moves field 2', () => {
    const s1 = new Map([
      ['a', 1],
      ['b', 2],
      ['c', 3],
      ['d', 4],
      ['e', 5],
      ['f', 6],
    ]);
    const s2 = new Map([
      ['a', 1],
      ['e', 5],
      ['b', 2],
      ['c', 3],
      ['d', 4],
      ['f', 6],
    ]);
    const s3 = new Map([
      ['b', 2],
      ['c', 3],
      ['d', 4],
      ['a', 1],
      ['e', 5],
      ['f', 6],
    ]);
    const paths: Path[] = [];
    const merger = combineMergers(
      mockPathTrackingMerger(paths),
      trimergeEquality,
      trimergeMap,
    );
    expect(merger(s1, s2, s3)).toEqual(
      new Map([
        ['e', 5],
        ['b', 2],
        ['c', 3],
        ['d', 4],
        ['a', 1],
        ['f', 6],
      ]),
    );
    expect(paths).toEqual([[], ['a'], ['e'], ['b'], ['c'], ['d'], ['f']]);
  });
  it('removes field', () => {
    const s1 = new Map([
      ['hello', 1],
      ['world', 2],
    ]);
    const s2 = new Map([['hello', 1]]);
    const s3 = new Map([
      ['hello', 1],
      ['world', 2],
    ]);
    const paths: Path[] = [];
    const merger = combineMergers(
      mockPathTrackingMerger(paths),
      trimergeEquality,
      trimergeMap,
    );
    expect(merger(s1, s2, s3)).toEqual(new Map([['hello', 1]]));
    expect(paths).toEqual([[], ['hello'], ['world']]);
  });

  it('handles both remove', () => {
    const s1 = new Map([
      ['x', 1],
      ['y', 2],
      ['z', 3],
    ]);
    const s2 = new Map([['y', 2]]);
    const s3 = new Map([
      ['x', 1],
      ['y', 2],
    ]);
    const paths: Path[] = [];
    const merger = combineMergers(
      mockPathTrackingMerger(paths),
      trimergeEquality,
      trimergeMap,
    );
    expect(merger(s1, s2, s3)).toEqual(new Map([['y', 2]]));
  });

  it('handles double remove', () => {
    const s1 = new Map([
      ['x', 1],
      ['y', 2],
      ['z', 3],
    ]);
    const s2 = new Map([
      ['y', 2],
      ['z', 3],
    ]);
    const s3 = new Map([
      ['x', 1],
      ['y', 2],
    ]);
    const paths: Path[] = [];
    const merger = combineMergers(
      mockPathTrackingMerger(paths),
      trimergeEquality,
      trimergeMap,
    );
    expect(merger(s1, s2, s3)).toEqual(new Map([['y', 2]]));
  });

  it('handles double remove at end', () => {
    const s1 = new Map([
      ['x', 1],
      ['y', 2],
      ['z', 3],
    ]);
    const s2 = new Map([
      ['x', 1],
      ['y', 2],
    ]);
    const s3 = new Map([
      ['x', 1],
      ['z', 3],
    ]);
    const paths: Path[] = [];
    const merger = combineMergers(
      mockPathTrackingMerger(paths),
      trimergeEquality,
      trimergeMap,
    );
    expect(merger(s1, s2, s3)).toEqual(new Map([['x', 1]]));
  });

  it('removes and changes field', () => {
    const s1 = new Map([
      ['hello', 1],
      ['world', 2],
    ]);
    const s2 = new Map([['hello', 1]]);
    const s3 = new Map([
      ['hello', 1],
      ['world', 3],
    ]);
    const paths: Path[] = [];
    const merger = combineMergers(
      mockPathTrackingMerger(paths),
      trimergeEquality,
      trimergeMap,
    );
    expect(() => merger(s1, s2, s3)).toThrowError(CannotMergeError);
    expect(paths).toEqual([[], ['hello'], ['world']]);
  });
  it('removes and changes field, force delete', () => {
    const s1 = new Map([
      ['hello', 1],
      ['world', 2],
    ]);
    const s2 = new Map([['hello', 1]]);
    const s3 = new Map([
      ['hello', 1],
      ['world', 3],
    ]);
    const paths: Path[] = [];
    const merger = combineMergers(
      mockPathTrackingMerger(paths),
      trimergeEquality,
      trimergeMap,
      () => undefined,
    );
    expect(merger(s1, s2, s3)).toBe(s2);
    expect(paths).toEqual([[], ['hello'], ['world']]);
  });
  it('removes and changes field, force keep', () => {
    const s1 = new Map([
      ['hello', 1],
      ['world', 2],
    ]);
    const s2 = new Map([['hello', 1]]);
    const s3 = new Map([
      ['hello', 1],
      ['world', 3],
    ]);
    const paths: Path[] = [];
    const merger = combineMergers(
      mockPathTrackingMerger(paths),
      trimergeEquality,
      trimergeMap,
      (_, l, r) => l ?? r,
    );
    expect(merger(s1, s2, s3)).toBe(s3);
    expect(paths).toEqual([[], ['hello'], ['world']]);
  });
  it('removes and changes field, return new value', () => {
    const s1 = new Map([
      ['hello', 1],
      ['world', 2],
    ]);
    const s2 = new Map([['hello', 1]]);
    const s3 = new Map([
      ['hello', 1],
      ['world', 3],
    ]);
    const paths: Path[] = [];
    const merger = combineMergers(
      mockPathTrackingMerger(paths),
      trimergeEquality,
      trimergeMap,
      () => 'hahaha, conflict!',
    );
    expect(merger(s1, s2, s3)).toEqual(
      new Map<string, any>([
        ['hello', 1],
        ['world', 'hahaha, conflict!'],
      ]),
    );
    expect(paths).toEqual([[], ['hello'], ['world']]);
  });
  it('adds and changes field', () => {
    const s1 = new Map([
      ['hello', 1],
      ['world', 2],
    ]);
    const s2 = new Map([
      ['hello', 1],
      ['world', 2],
      ['there', 2],
    ]);
    const s3 = new Map([
      ['hello', 1],
      ['world', 3],
    ]);
    const paths: Path[] = [];
    const merger = combineMergers(
      mockPathTrackingMerger(paths),
      trimergeEquality,
      trimergeMap,
    );
    expect(merger(s1, s2, s3)).toEqual(
      new Map([
        ['hello', 1],
        ['world', 3],
        ['there', 2],
      ]),
    );
    expect(paths).toEqual([[], ['hello'], ['world'], ['there']]);
  });
  it('adds and removes field', () => {
    const s1 = new Map([
      ['hello', 1],
      ['world', 2],
    ]);
    const s2 = new Map([
      ['hello', 1],
      ['world', 2],
      ['there', 2],
    ]);
    const s3 = new Map([['hello', 1]]);
    const paths: Path[] = [];
    const merger = combineMergers(
      mockPathTrackingMerger(paths),
      trimergeEquality,
      trimergeMap,
    );
    expect(merger(s1, s2, s3)).toEqual(
      new Map([
        ['hello', 1],
        ['there', 2],
      ]),
    );
    expect(paths).toEqual([[], ['hello'], ['world'], ['there']]);
  });
  it('does not merge if not all Maps 1', () => {
    const s1 = false;
    const s2 = new Map();
    const s3 = new Map();
    const merger = combineMergers(trimergeMap);
    expect(() => merger(s1, s2, s3)).toThrowError(CannotMergeError);
  });
  it('does not merge if not all Maps 2 ', () => {
    const s1 = new Map();
    const s2 = false;
    const s3 = new Map();
    const merger = combineMergers(trimergeMap);
    expect(() => merger(s1, s2, s3)).toThrowError(CannotMergeError);
  });
  it('does not merge if not all Maps 3', () => {
    const s1 = new Map();
    const s2 = new Map();
    const s3 = false;
    const merger = combineMergers(trimergeMap);
    expect(() => merger(s1, s2, s3)).toThrowError(CannotMergeError);
  });
  it('does not merge if none are Maps', () => {
    const s1 = false;
    const s2 = false;
    const s3 = false;
    const merger = combineMergers(trimergeMap);
    expect(() => merger(s1, s2, s3)).toThrowError(CannotMergeError);
  });
});

describe('trimergeUnorderedMap', () => {
  it('adds field', () => {
    const s1 = new Map([
      ['hello', 1],
      ['world', 2],
    ]);
    const s2 = new Map([
      ['hello', 1],
      ['world', 2],
      ['there', 3],
    ]);
    const s3 = new Map([
      ['hello', 1],
      ['world', 2],
    ]);
    const paths: Path[] = [];
    const merger = combineMergers(
      mockPathTrackingMerger(paths),
      trimergeEquality,
      trimergeUnorderedMap,
    );
    expect(merger(s1, s2, s3)).toEqual(
      new Map([
        ['hello', 1],
        ['world', 2],
        ['there', 3],
      ]),
    );
    expect(paths).toEqual([[], ['hello'], ['world'], ['there']]);
  });
  it('adds two fields', () => {
    const s1 = new Map([
      ['hello', 1],
      ['world', 2],
    ]);
    const s2 = new Map([
      ['hello', 1],
      ['world', 2],
      ['there', 3],
    ]);
    const s3 = new Map([
      ['hello', 1],
      ['world', 2],
      ['here', 4],
    ]);
    const paths: Path[] = [];
    const merger = combineMergers(
      mockPathTrackingMerger(paths),
      trimergeEquality,
      trimergeUnorderedMap,
    );
    expect(merger(s1, s2, s3)).toEqual(
      new Map([
        ['hello', 1],
        ['world', 2],
        ['there', 3],
        ['here', 4],
      ]),
    );
    expect(paths).toEqual([[], ['hello'], ['world'], ['there'], ['here']]);
  });
  it('changes field', () => {
    const s1 = new Map([
      ['hello', 1],
      ['world', 2],
    ]);
    const s2 = new Map([
      ['hello', 1],
      ['world', 2],
    ]);
    const s3 = new Map([
      ['hello', 1],
      ['world', 3],
    ]);
    const paths: Path[] = [];
    const merger = combineMergers(
      mockPathTrackingMerger(paths),
      trimergeEquality,
      trimergeUnorderedMap,
    );
    expect(merger(s1, s2, s3)).toEqual(
      new Map([
        ['hello', 1],
        ['world', 3],
      ]),
    );
    expect(paths).toEqual([[], ['hello'], ['world']]);
  });
  it('removes field', () => {
    const s1 = new Map([
      ['hello', 1],
      ['world', 2],
    ]);
    const s2 = new Map([['hello', 1]]);
    const s3 = new Map([
      ['hello', 1],
      ['world', 2],
    ]);
    const paths: Path[] = [];
    const merger = combineMergers(
      mockPathTrackingMerger(paths),
      trimergeEquality,
      trimergeUnorderedMap,
    );
    expect(merger(s1, s2, s3)).toEqual(new Map([['hello', 1]]));
    expect(paths).toEqual([[], ['hello'], ['world']]);
  });
  it('adds and changes field', () => {
    const s1 = new Map([
      ['hello', 1],
      ['world', 2],
    ]);
    const s2 = new Map([
      ['hello', 1],
      ['world', 2],
      ['there', 2],
    ]);
    const s3 = new Map([
      ['hello', 1],
      ['world', 3],
    ]);
    const paths: Path[] = [];
    const merger = combineMergers(
      mockPathTrackingMerger(paths),
      trimergeEquality,
      trimergeUnorderedMap,
    );
    expect(merger(s1, s2, s3)).toEqual(
      new Map([
        ['hello', 1],
        ['world', 3],
        ['there', 2],
      ]),
    );
    expect(paths).toEqual([[], ['hello'], ['world'], ['there']]);
  });
  it('adds and removes field', () => {
    const s1 = new Map([
      ['hello', 1],
      ['world', 2],
    ]);
    const s2 = new Map([
      ['hello', 1],
      ['world', 2],
      ['there', 2],
    ]);
    const s3 = new Map([['hello', 1]]);
    const paths: Path[] = [];
    const merger = combineMergers(
      mockPathTrackingMerger(paths),
      trimergeEquality,
      trimergeUnorderedMap,
    );
    expect(merger(s1, s2, s3)).toEqual(
      new Map([
        ['hello', 1],
        ['there', 2],
      ]),
    );
    expect(paths).toEqual([[], ['hello'], ['world'], ['there']]);
  });
  it('removes and changes field', () => {
    const s1 = new Map([
      ['hello', 1],
      ['world', 2],
    ]);
    const s2 = new Map([['hello', 1]]);
    const s3 = new Map([
      ['hello', 1],
      ['world', 3],
    ]);
    const paths: Path[] = [];
    const merger = combineMergers(
      mockPathTrackingMerger(paths),
      trimergeEquality,
      trimergeUnorderedMap,
    );
    expect(() => merger(s1, s2, s3)).toThrowError(CannotMergeError);
    expect(paths).toEqual([[], ['hello'], ['world']]);
  });
  it('fails on order conflict', () => {
    const s1 = new Map([
      ['hello', 1],
      ['world', 1],
      ['there', 1],
    ]);
    const s2 = new Map([
      ['hello', 1],
      ['there', 1],
      ['world', 1],
    ]);
    const s3 = new Map([
      ['there', 1],
      ['world', 1],
      ['hello', 1],
    ]);
    const merger = combineMergers(trimergeEquality, trimergeMap);
    expect(() => merger(s1, s2, s3)).toThrowError('order conflict');
  });
  it('does not merge if not all Maps 1', () => {
    const s1 = false;
    const s2 = new Map();
    const s3 = new Map();
    const merger = combineMergers(trimergeUnorderedMap);
    expect(() => merger(s1, s2, s3)).toThrowError(CannotMergeError);
  });
  it('does not merge if not all Maps 2 ', () => {
    const s1 = new Map();
    const s2 = false;
    const s3 = new Map();
    const merger = combineMergers(trimergeUnorderedMap);
    expect(() => merger(s1, s2, s3)).toThrowError(CannotMergeError);
  });
  it('does not merge if not all Maps 3', () => {
    const s1 = new Map();
    const s2 = new Map();
    const s3 = false;
    const merger = combineMergers(trimergeUnorderedMap);
    expect(() => merger(s1, s2, s3)).toThrowError(CannotMergeError);
  });
  it('does not merge if none are Maps', () => {
    const s1 = false;
    const s2 = false;
    const s3 = false;
    const merger = combineMergers(trimergeUnorderedMap);
    expect(() => merger(s1, s2, s3)).toThrowError(CannotMergeError);
  });
});
describe('trimergeMapCreator', () => {
  it('trimergeMapCreator(true) allows order conflict', () => {
    const s1 = new Map([
      ['hello', 1],
      ['world', 1],
      ['there', 1],
    ]);
    const s2 = new Map([
      ['hello', 1],
      ['there', 1],
      ['world', 1],
    ]);
    const s3 = new Map([
      ['there', 1],
      ['world', 1],
      ['hello', 1],
    ]);
    const merger = combineMergers(trimergeEquality, trimergeMapCreator(true));
    expect(merger(s1, s2, s3)).toEqual(
      new Map([
        ['hello', 1],
        ['there', 1],
        ['world', 1],
      ]),
    );
  });
  it('removes undefined values', () => {
    const s1 = new Map([
      ['hello', 1],
      ['world', 2],
    ]);
    const s2 = new Map([
      ['hello', 1],
      ['world', undefined],
    ]);
    const s3 = new Map([
      ['hello', undefined],
      ['world', 2],
    ]);
    const paths: Path[] = [];
    const merger = combineMergers(
      mockPathTrackingMerger(paths),
      trimergeEquality,
      trimergeMap,
    );
    expect(merger(s1, s2, s3)).toEqual(new Map([]));
    expect(paths).toEqual([[], ['hello'], ['world']]);
  });

  it('removes undefined values 2', () => {
    const s1 = new Map([
      ['hello', 1],
      ['world', 2],
    ]);
    const s2 = new Map([
      ['hello', 1],
      ['world', undefined],
    ]);
    const s3 = new Map([
      ['hello', 2],
      ['world', undefined],
    ]);
    const paths: Path[] = [];
    const merger = combineMergers(
      mockPathTrackingMerger(paths),
      trimergeEquality,
      trimergeMap,
    );
    expect(merger(s1, s2, s3)).toEqual(new Map([['hello', 2]]));
    expect(paths).toEqual([[], ['hello'], ['world']]);
  });

  it('handles undefined value in base', () => {
    const s1 = new Map([
      ['hello', 1],
      ['world', undefined],
    ]);
    const s2 = new Map([
      ['hello', 1],
      ['world', 2],
    ]);
    const s3 = new Map([
      ['hello', 2],
      ['world', undefined],
    ]);
    const paths: Path[] = [];
    const merger = combineMergers(
      mockPathTrackingMerger(paths),
      trimergeEquality,
      trimergeMap,
    );
    expect(merger(s1, s2, s3)).toEqual(
      new Map([
        ['hello', 2],
        ['world', 2],
      ]),
    );
    expect(paths).toEqual([[], ['hello'], ['world']]);
  });

  it('handles delete of undefined value', () => {
    const s1 = new Map([
      ['hello', 1],
      ['world', undefined],
    ]);
    const s2 = new Map([['hello', 1]]);
    const s3 = new Map([
      ['hello', 2],
      ['world', undefined],
    ]);
    const paths: Path[] = [];
    const merger = combineMergers(
      mockPathTrackingMerger(paths),
      trimergeEquality,
      trimergeMap,
    );
    expect(merger(s1, s2, s3)).toEqual(new Map([['hello', 2]]));
    expect(paths).toEqual([[], ['hello'], ['world']]);
  });
});
