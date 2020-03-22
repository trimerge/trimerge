import { CannotMerge } from './cannot-merge';
import { combineMergers } from './trimerge';
import { trimergeJsonDeepEqual } from './trimerge-json-equal';

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
