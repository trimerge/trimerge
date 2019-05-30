import {
  AnyMerge,
  combineMergers,
  CannotMergeError,
  trimergeEquality,
} from './trimerge';
import { Path } from './path';
import { CannotMerge } from './cannot-merge';
import {
  trimergeArrayCreator,
  trimergeJsonDeepEqual,
  trimergeJsonObject,
} from './trimerge-json';

describe('trimergeJsonDeepEqual', () => {
  it('merges left === right', () => {
    const s1 = { state: 1 };
    const s2 = { state: 3 };
    const s3 = { state: 3 };
    const initialmerger = jest.fn(() => CannotMerge);
    const merger = combineMergers(initialmerger, trimergeJsonDeepEqual);
    expect(merger(s1, s2, s3)).toBe(s2); // defaults to left
    expect(initialmerger.mock.calls).toEqual([[s1, s2, s3, [], merger]]);
  });
  it('merges orig === left', () => {
    const s1 = { state: 1 };
    const s2 = { state: 1 };
    const s3 = { state: 3 };
    const merger = combineMergers(trimergeJsonDeepEqual);
    expect(merger(s1, s2, s3)).toBe(s3);
  });
  it('merges orig === right', () => {
    const s1 = { state: 1 };
    const s2 = { state: 2 };
    const s3 = { state: 1 };
    const merger = combineMergers(trimergeJsonDeepEqual);
    expect(merger(s1, s2, s3)).toBe(s2);
  });
});

function mockPathTrackingMerger(paths: Path[]): AnyMerge {
  return (_orig, _left, _right, path): typeof CannotMerge => {
    paths.push(path);
    return CannotMerge;
  };
}

describe('trimergeJsonObject', () => {
  it('adds field', () => {
    const s1 = { hello: 1, world: 2 };
    const s2 = { hello: 1, world: 2, there: 3 };
    const s3 = { hello: 1, world: 2 };
    const paths: Path[] = [];
    const merger = combineMergers(
      mockPathTrackingMerger(paths),
      trimergeEquality,
      trimergeJsonObject,
    );
    expect(merger(s1, s2, s3)).toEqual({ hello: 1, world: 2, there: 3 });
    expect(paths).toEqual([[], ['hello'], ['world'], ['there']]);
  });
  it('adds two fields', () => {
    const s1 = { hello: 1, world: 2 };
    const s2 = { hello: 1, world: 2, there: 3 };
    const s3 = { hello: 1, world: 2, here: 4 };
    const paths: Path[] = [];
    const merger = combineMergers(
      mockPathTrackingMerger(paths),
      trimergeEquality,
      trimergeJsonObject,
    );
    expect(merger(s1, s2, s3)).toEqual({
      hello: 1,
      world: 2,
      there: 3,
      here: 4,
    });
    expect(paths).toEqual([[], ['hello'], ['world'], ['there'], ['here']]);
  });
  it('changes field', () => {
    const s1 = { hello: 1, world: 2 };
    const s2 = { hello: 1, world: 2 };
    const s3 = { hello: 1, world: 3 };
    const paths: Path[] = [];
    const merger = combineMergers(
      mockPathTrackingMerger(paths),
      trimergeEquality,
      trimergeJsonObject,
    );
    expect(merger(s1, s2, s3)).toEqual({ hello: 1, world: 3 });
    expect(paths).toEqual([[], ['hello'], ['world']]);
  });
  it('removes field', () => {
    const s1 = { hello: 1, world: 2 };
    const s2 = { hello: 1 };
    const s3 = { hello: 1, world: 2 };
    const paths: Path[] = [];
    const merger = combineMergers(
      mockPathTrackingMerger(paths),
      trimergeEquality,
      trimergeJsonObject,
    );
    expect(merger(s1, s2, s3)).toEqual({ hello: 1 });
    expect(paths).toEqual([[], ['hello'], ['world']]);
  });
  it('adds and changes field', () => {
    const s1 = { hello: 1, world: 2 };
    const s2 = { hello: 1, world: 2, there: 2 };
    const s3 = { hello: 1, world: 3 };
    const paths: Path[] = [];
    const merger = combineMergers(
      mockPathTrackingMerger(paths),
      trimergeEquality,
      trimergeJsonObject,
    );
    expect(merger(s1, s2, s3)).toEqual({ hello: 1, world: 3, there: 2 });
    expect(paths).toEqual([[], ['hello'], ['world'], ['there']]);
  });
  it('adds and removes field', () => {
    const s1 = { hello: 1, world: 2 };
    const s2 = { hello: 1, world: 2, there: 2 };
    const s3 = { hello: 1 };
    const paths: Path[] = [];
    const merger = combineMergers(
      mockPathTrackingMerger(paths),
      trimergeEquality,
      trimergeJsonObject,
    );
    expect(merger(s1, s2, s3)).toEqual({ hello: 1, there: 2 });
    expect(paths).toEqual([[], ['hello'], ['world'], ['there']]);
  });
  it('does not merge if not all objects 1', () => {
    const s1 = false;
    const s2 = {};
    const s3 = {};
    const merger = combineMergers(trimergeJsonObject);
    expect(() => merger(s1, s2, s3)).toThrowError(CannotMergeError);
  });
  it('does not merge if not all objects 2', () => {
    const s1 = {};
    const s2 = false;
    const s3 = {};
    const merger = combineMergers(trimergeJsonObject);
    expect(() => merger(s1, s2, s3)).toThrowError(CannotMergeError);
  });
  it('does not merge if not all objects 3', () => {
    const s1 = {};
    const s2 = {};
    const s3 = false;
    const merger = combineMergers(trimergeJsonObject);
    expect(() => merger(s1, s2, s3)).toThrowError(CannotMergeError);
  });
  it('does not merge if none are objects', () => {
    const s1 = false;
    const s2 = false;
    const s3 = false;
    const merger = combineMergers(trimergeJsonObject);
    expect(() => merger(s1, s2, s3)).toThrowError(CannotMergeError);
  });
});

describe('arrays', () => {
  const basicArrayMerge = combineMergers(
    trimergeEquality,
    trimergeArrayCreator((item) => String(item)),
  );
  const idArrayMerge = combineMergers(
    trimergeJsonDeepEqual,
    trimergeArrayCreator((item: any) => String(item.id)),
  );
  it('does not merge if not arrays', () => {
    const s1 = false;
    const s2 = false;
    const s3 = false;
    const merger = combineMergers(trimergeArrayCreator((item) => String(item)));
    expect(() => merger(s1, s2, s3)).toThrowError(CannotMergeError);
  });
  it('handles array add', () => {
    const state1 = [1, 2, 3];
    const state2 = [1, 2, 3];
    const state3 = [1, 2, 4, 3];
    expect(basicArrayMerge(state1, state2, state3)).toEqual([1, 2, 4, 3]);
  });
  it('handles array add 2', () => {
    const state1 = [1, 2, 3];
    const state2 = [1, 2, 3];
    const state3 = [1, 2, 3, 4];
    expect(basicArrayMerge(state1, state2, state3)).toEqual([1, 2, 3, 4]);
  });
  it('handles array add and move', () => {
    const state1 = [1, 2, 3];
    const state2 = [2, 1, 3];
    const state3 = [1, 2, 3, 4];
    expect(basicArrayMerge(state1, state2, state3)).toEqual([2, 1, 3, 4]);
  });
  it('handles array simple moves', () => {
    const state1 = [1, 2, 3, 4, 5, 6];
    const state2 = [1, 2, 3, 4, 6, 5];
    const state3 = [2, 1, 3, 4, 5, 6];
    expect(basicArrayMerge(state1, state2, state3)).toEqual([2, 1, 3, 4, 6, 5]);
  });
  it('handles array complex move', () => {
    const state1 = [1, 2, 3, 4, 5, 6];
    const state2 = [1, 5, 2, 3, 4, 6];
    const state3 = [2, 3, 4, 1, 5, 6];
    expect(basicArrayMerge(state1, state2, state3)).toEqual([5, 2, 3, 4, 1, 6]);
  });
  it('handles array simple moves and delete', () => {
    const state1 = [1, 2, 3, 4, 5, 6];
    const state2 = [1, 3, 4, 5, 6];
    const state3 = [1, 2, 3, 4, 6, 5];
    expect(basicArrayMerge(state1, state2, state3)).toEqual([1, 3, 4, 6, 5]);
  });
  it('handles array simple moves and add', () => {
    const state1 = [1, 2, 3, 4, 5, 6];
    const state2 = [1, 7, 2, 3, 4, 5, 6];
    const state3 = [1, 2, 3, 4, 6, 5];
    expect(basicArrayMerge(state1, state2, state3)).toEqual([
      1,
      7,
      2,
      3,
      4,
      6,
      5,
    ]);
  });
  it('handles array complex move and delete', () => {
    const state1 = [1, 2, 3, 4, 5, 6];
    const state2 = [1, 5, 2, 4, 6];
    const state3 = [2, 3, 4, 1, 5, 6];
    expect(basicArrayMerge(state1, state2, state3)).toEqual([5, 2, 4, 1, 6]);
  });
  it('handles array removal', () => {
    const state1 = [1, 2, 3];
    const state2 = [1, 2, 3];
    const state3 = [1, 3];
    expect(basicArrayMerge(state1, state2, state3)).toEqual([1, 3]);
  });

  it('handles array double remove', () => {
    const state1 = [1, 2, 3];
    const state2 = [2, 3];
    const state3 = [1, 2];
    expect(basicArrayMerge(state1, state2, state3)).toEqual([2]);
  });

  it('handles array double remove at end', () => {
    const state1 = [1, 2, 3];
    const state2 = [1, 2];
    const state3 = [1, 3];
    expect(basicArrayMerge(state1, state2, state3)).toEqual([1]);
  });

  it('handles array add and remove', () => {
    const state1 = [1, 2, 3];
    const state2 = [2, 3];
    const state3 = [1, 2, 4, 3];
    expect(basicArrayMerge(state1, state2, state3)).toEqual([2, 4, 3]);
  });
  it('handles keyed object array', () => {
    const state1 = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const state2 = [{ id: 2 }, { id: 3 }];
    const state3 = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
    expect(idArrayMerge(state1, state2, state3)).toEqual([
      { id: 2 },
      { id: 3 },
      { id: 4 },
    ]);
  });
  it('handles keyed object array conflict', () => {
    const state1 = [{ id: 'foo' }, { id: 'bar' }];
    const state2 = [{ id: 'foo' }, { id: 'bar', value: 1 }];
    const state3 = [{ id: 'foo' }, { id: 'bar', value: 2 }];
    expect(() => idArrayMerge(state1, state2, state3)).toThrowError(
      'conflict at /bar',
    );
  });
  it('handles keyed object array with values', () => {
    const state1 = [
      { id: 1, value: 1 },
      { id: 2, value: 2 },
      { id: 3, value: 3 },
    ];
    const state2 = [{ id: 2, value: 10 }, { id: 3, value: 3 }];
    const state3 = [
      { id: 1, value: 1 },
      { id: 2, value: 2 },
      { id: 3, value: 3 },
      { id: 4, value: 4 },
    ];
    expect(idArrayMerge(state1, state2, state3)).toEqual([
      { id: 2, value: 10 },
      { id: 3, value: 3 },
      { id: 4, value: 4 },
    ]);
  });
  it('fails on duplicate array keys 1', () => {
    const state1 = [1, 2, 4, 5, 6, 2];
    const state2 = [1, 5, 2, 4, 6];
    const state3 = [2, 3, 4, 1, 5, 6];
    expect(() => basicArrayMerge(state1, state2, state3)).toThrowError(
      `Duplicate array key '2' at /`,
    );
  });
  it('fails on duplicate array keys 2', () => {
    const state1 = [1, 2, 4, 5, 6];
    const state2 = [1, 5, 2, 4, 6, 2];
    const state3 = [2, 3, 4, 1, 5, 6];
    expect(() => basicArrayMerge(state1, state2, state3)).toThrowError(
      `Duplicate array key '2' at /`,
    );
  });
  it('fails on duplicate array keys 3', () => {
    const state1 = [1, 2, 4, 5, 6];
    const state2 = [1, 5, 2, 4, 6];
    const state3 = [2, 3, 4, 1, 5, 6, 2];
    expect(() => basicArrayMerge(state1, state2, state3)).toThrowError(
      `Duplicate array key '2' at /`,
    );
  });
});
