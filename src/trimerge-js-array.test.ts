import { CannotMergeError, combineMergers, trimergeEquality } from './trimerge';
import { trimergeArrayCreator } from './trimerge-js-array';
import { trimergeJsonDeepEqual } from './trimerge-json-equal';

describe('trimergeArrayCreator', () => {
  const basicArrayMerge = combineMergers(
    trimergeEquality,
    trimergeArrayCreator((item) => String(item)),
  );
  const basicArrayMergeAllowOrderConflicts = combineMergers(
    trimergeEquality,
    trimergeArrayCreator((item) => String(item), true),
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
  it('throws on conflicting array move', () => {
    const state1 = [1, 2, 3, 4];
    const state2 = [3, 1, 2, 4];
    const state3 = [1, 2, 4, 3];
    expect(() => basicArrayMerge(state1, state2, state3)).toThrow(
      'order conflict',
    );
  });
  it('handles conflicting array move when allowed', () => {
    const state1 = [1, 2, 3, 4];
    const state2 = [3, 1, 2, 4];
    const state3 = [1, 2, 4, 3];
    expect(basicArrayMergeAllowOrderConflicts(state1, state2, state3)).toEqual([
      3,
      1,
      2,
      4,
    ]);
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
      'cannot merge /bar',
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
