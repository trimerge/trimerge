import { combineMergers } from './trimerge';
import { trimergeString } from './trimerge-string';

describe('trimergeString', () => {
  it('replaces and adds', () => {
    const s1 = 'hello';
    const s2 = 'world';
    const s3 = 'hello, sup';
    const merger = combineMergers(trimergeString);
    expect(merger(s1, s2, s3)).toEqual('world, sup');
  });
  it('handles undefined 1', () => {
    const s1 = undefined;
    const s2 = '2';
    const s3 = '3';
    const merger = combineMergers(trimergeString);
    expect(merger(s1, s2, s3)).toEqual('23');
  });
  it('handles undefined 2', () => {
    const s1 = '1';
    const s2 = undefined;
    const s3 = '3';
    const merger = combineMergers(trimergeString);
    expect(merger(s1, s2, s3)).toEqual('3');
  });
  it('handles undefined 3', () => {
    const s1 = '1';
    const s2 = '2';
    const s3 = undefined;
    const merger = combineMergers(trimergeString);
    expect(merger(s1, s2, s3)).toEqual('2');
  });
  it('fails on non-string 1', () => {
    const s1 = false;
    const s2 = 'word';
    const s3 = 'word';
    const merger = combineMergers(trimergeString);
    expect(() => merger(s1, s2, s3)).toThrowError('cannot merge /');
  });
  it('fails on non-string 2', () => {
    const s1 = 'word';
    const s2 = false;
    const s3 = 'word';
    const merger = combineMergers(trimergeString);
    expect(() => merger(s1, s2, s3)).toThrowError('cannot merge /');
  });
  it('fails on non-string 3', () => {
    const s1 = 'word';
    const s2 = 'word';
    const s3 = false;
    const merger = combineMergers(trimergeString);
    expect(() => merger(s1, s2, s3)).toThrowError('cannot merge /');
  });
});
