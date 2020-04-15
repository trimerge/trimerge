import { basicDiff, combineDiffers } from './diff';
import { patch, PatchOperation } from './patch';
import { diffArray } from './diff-array';

describe('diffArray', () => {
  function test(s1: any[], s2: any[], expected: PatchOperation[]) {
    const diff = combineDiffers(diffArray, basicDiff);
    const onDiff = jest.fn();
    expect(diff(s1, s2, onDiff)).toBe(expected.length > 0);
    expect(onDiff.mock.calls.map((args) => args[0])).toEqual(expected);
    expect(patch(s1, expected)).toEqual(s2);
  }

  it('no change', () => {
    test(['hello'], ['hello'], []);
  });
  it('adds text', () => {
    test(
      ['hello'],
      ['hello', 'cool', 'world'],
      [{ index: 1, insert: ['cool', 'world'], path: [], type: 'splice' }],
    );
  });
  it('adds text in two places', () => {
    test(
      ['hello', 'world'],
      ['hello', 'cool', 'world', 'sup?'],
      [
        { index: 1, insert: ['cool'], path: [], type: 'splice' },
        { index: 3, insert: ['sup?'], path: [], type: 'splice' },
      ],
    );
  });
  it('handles repeated words', () => {
    test(
      ['hello', 'hello', 'hello'],
      ['hello', 'hello', 'cool', 'hello'],
      [{ index: 2, insert: ['cool'], path: [], type: 'splice' }],
    );
  });
  it('changes text', () => {
    test(
      ['hello', 'world'],
      ['sup', 'world'],
      [{ index: 0, insert: ['sup'], path: [], remove: 1, type: 'splice' }],
    );
  });
  it('removes word', () => {
    test(
      ['hello', 'world'],
      ['hello'],
      [{ index: 1, path: [], remove: 1, type: 'splice' }],
    );
  });
  it('removes and changes word', () => {
    test(
      ['hello', 'world', 'sup'],
      ['sup', 'world'],
      [
        { index: 0, path: [], remove: 2, type: 'splice' },
        { index: 1, path: [], insert: ['world'], type: 'splice' },
      ],
    );
  });
  it('adds and changes word', () => {
    test(
      ['hello', 'world'],
      ['yo', 'world', 'sup?'],
      [
        { index: 0, insert: ['yo'], path: [], remove: 1, type: 'splice' },
        { index: 2, insert: ['sup?'], path: [], type: 'splice' },
      ],
    );
  });
  it('adds and removes word', () => {
    test(
      ['hello', 'world'],
      ['world', 'time'],
      [
        { index: 0, path: [], remove: 1, type: 'splice' },
        { index: 1, insert: ['time'], path: [], type: 'splice' },
      ],
    );
  });
  it('skips if before is not a string', () => {
    const diff = combineDiffers(diffArray);
    const onDiff = jest.fn();
    expect(diff([], 'string', onDiff)).toBe(undefined);
    expect(onDiff).not.toHaveBeenCalled();
  });
  it('skips if after is not a string', () => {
    const diff = combineDiffers(diffArray);
    const onDiff = jest.fn();
    expect(diff('string', [], onDiff)).toBe(undefined);
    expect(onDiff).not.toHaveBeenCalled();
  });
});
