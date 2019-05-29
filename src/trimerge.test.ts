import { combineMergers, trimergeEquality } from './trimerge';
import { CannotMerge } from './cannot-merge';

describe('combineMergers()', () => {
  it('functions with a single basic merger', () => {
    const s1 = { state1: true };
    const s2 = { state2: true };
    const s3 = { state3: true };
    const merger1 = jest.fn((orig) => orig);
    const combinedMerge = combineMergers(merger1);
    expect(merger1.mock.calls).toHaveLength(0);
    expect(combinedMerge(s1, s2, s3)).toBe(s1);
    expect(merger1.mock.calls).toEqual([[s1, s2, s3, [], combinedMerge]]);
  });

  it('functions with two mergers', () => {
    const s1 = { state1: true };
    const s2 = { state2: true };
    const s3 = { state3: true };
    const merger1 = jest.fn(() => CannotMerge);
    const merger2 = jest.fn((orig) => orig);
    const combinedMerge = combineMergers(merger1, merger2);
    expect(merger1.mock.calls).toHaveLength(0);
    expect(merger2.mock.calls).toHaveLength(0);
    expect(combinedMerge(s1, s2, s3)).toBe(s1);
    expect(merger1.mock.calls).toEqual([[s1, s2, s3, [], combinedMerge]]);
    expect(merger2.mock.calls).toEqual([[s1, s2, s3, [], combinedMerge]]);
  });

  it('works recursively', () => {
    const s1 = [1];
    const s2 = [2];
    const s3 = [3];
    const merger1 = jest.fn((orig, left, right, _path, merge) => {
      if (Array.isArray(orig)) {
        return [merge(orig[0], left[0], right[0])];
      }
      return orig;
    });
    const combinedMerge = combineMergers(merger1);
    expect(merger1.mock.calls).toHaveLength(0);
    expect(combinedMerge(s1, s2, s3)).toEqual([1]);
    expect(merger1.mock.calls).toEqual([
      [s1, s2, s3, [], combinedMerge],
      [1, 2, 3, [], combinedMerge],
    ]);
  });

  it('fails if nothing can merge', () => {
    const s1 = { state1: true };
    const s2 = { state2: true };
    const s3 = { state3: true };
    const merger1 = jest.fn(() => CannotMerge);
    const combinedMerge = combineMergers(merger1);
    expect(merger1.mock.calls).toHaveLength(0);
    expect(() => combinedMerge(s1, s2, s3)).toThrow('conflict at /');
    expect(merger1.mock.calls).toEqual([[s1, s2, s3, [], combinedMerge]]);
  });
});

describe('trimergeEquality()', () => {
  it('merges left === right', () => {
    const s1 = { state: 1 };
    const s2 = { state: 2 };
    const initialmerger = jest.fn(() => CannotMerge);
    const merger = combineMergers(initialmerger, trimergeEquality);
    expect(merger(s1, s2, s2)).toBe(s2);
    expect(initialmerger.mock.calls).toEqual([[s1, s2, s2, [], merger]]);
  });
  it('merges orig === left', () => {
    const s1 = { state: 1 };
    const s2 = { state: 2 };
    const merger = combineMergers(trimergeEquality);
    expect(merger(s1, s1, s2)).toBe(s2);
  });
  it('merges orig === right', () => {
    const s1 = { state: 1 };
    const s2 = { state: 2 };
    const merger = combineMergers(trimergeEquality);
    expect(merger(s1, s2, s1)).toBe(s2);
  });
});
