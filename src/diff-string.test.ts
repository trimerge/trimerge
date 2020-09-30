import { basicDiff, combineDiffers } from './diff';
import { diffString } from './diff-string';
import { patch, PatchOperation } from './patch';

describe('diffString', () => {
  function test(s1: string, s2: string, expected: PatchOperation[]) {
    const diff = combineDiffers(diffString, basicDiff);
    const onDiff = jest.fn();
    expect(diff(s1, s2, onDiff)).toBe(expected.length > 0);
    expect(onDiff.mock.calls.map((args) => args[0])).toEqual(expected);
    expect(patch(s1, expected)).toEqual(s2);
  }
  it('no change', () => {
    test('hello', 'hello', []);
  });
  it('adds text', () => {
    test('hello', 'hello cool world', [
      { index: 5, insert: ' cool world', path: [], type: 'splice' },
    ]);
  });
  it('adds text in two places', () => {
    test('hello world', 'hello cool world, sup?', [
      { index: 6, insert: 'cool ', path: [], type: 'splice' },
      { index: 16, insert: ', sup?', path: [], type: 'splice' },
    ]);
  });
  it('changes text', () => {
    test('hello world', 'sup world', [
      { index: 0, insert: 'sup', path: [], remove: 5, type: 'splice' },
    ]);
  });
  it('removes word', () => {
    test('hello world', 'hello', [
      { index: 5, path: [], remove: 6, type: 'splice' },
    ]);
  });
  it('removes and changes word', () => {
    test('hello world, sup?', 'sup world', [
      { index: 0, insert: 'sup', path: [], remove: 5, type: 'splice' },
      { index: 9, path: [], remove: 6, type: 'splice' },
    ]);
  });
  it('adds and changes word', () => {
    test('hello world', 'yo world, sup?', [
      { index: 0, insert: 'y', path: [], remove: 4, type: 'splice' },
      { index: 8, insert: ', sup?', path: [], type: 'splice' },
    ]);
  });
  it('adds and removes word', () => {
    test('hello world', 'world time', [
      { index: 0, path: [], remove: 6, type: 'splice' },
      { index: 5, insert: ' time', path: [], type: 'splice' },
    ]);
  });
  it('skips if before is not a string', () => {
    const diff = combineDiffers(diffString);
    const onDiff = jest.fn();
    expect(diff('hello', false, onDiff)).toBe(undefined);
    expect(onDiff).not.toHaveBeenCalled();
  });
  it('skips if after is not a string', () => {
    const diff = combineDiffers(diffString);
    const onDiff = jest.fn();
    expect(diff(false, 'hello', onDiff)).toBe(undefined);
    expect(onDiff).not.toHaveBeenCalled();
  });
});
