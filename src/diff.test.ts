import { basicDiff, combineDiffers, DiffFn } from './diff';

describe('combineDiffers()', () => {
  it('handles equal values', () => {
    const s1 = { state1: true };
    const s2 = s1;
    const differ = jest.fn();
    const diff = combineDiffers(differ);
    expect(differ).toHaveBeenCalledTimes(0);
    const onDiff = jest.fn();
    expect(diff(s1, s2, onDiff)).toBe(false);
    expect(differ).toHaveBeenCalledTimes(0);
    expect(onDiff).not.toHaveBeenCalled();
  });
  it('functions with a differ that does nothing', () => {
    const s1 = { state1: true };
    const s2 = { state2: true };
    const differ = jest.fn();
    const diff = combineDiffers(differ);
    expect(differ).toHaveBeenCalledTimes(0);
    const onDiff = jest.fn();
    expect(diff(s1, s2, onDiff)).toBe(undefined);
    expect(differ.mock.calls).toEqual([[s1, s2, onDiff, [], diff]]);
    expect(onDiff).not.toHaveBeenCalled();
  });
  it('functions with a differ that says no diff', () => {
    const s1 = { state1: true };
    const s2 = { state2: true };
    const differ = jest.fn(() => false);
    const diff = combineDiffers(differ);
    expect(differ).toHaveBeenCalledTimes(0);
    const onDiff = jest.fn();
    expect(diff(s1, s2, onDiff)).toBe(false);
    expect(differ.mock.calls).toEqual([[s1, s2, onDiff, [], diff]]);
    expect(onDiff).not.toHaveBeenCalled();
  });
  it('functions with a single basic differ 2', () => {
    const s1 = { state1: true };
    const s2 = { state2: true };
    const differImpl: DiffFn = (_orig, _left, onDiff) => {
      onDiff({ type: 'set', path: ['state1'] });
      onDiff({ type: 'set', path: ['state2'], value: true });
      return true;
    };
    const differ = jest.fn(differImpl);
    const diff = combineDiffers(differ);
    expect(differ).toHaveBeenCalledTimes(0);
    const onDiff = jest.fn();
    expect(diff(s1, s2, onDiff)).toEqual(true);
    expect(differ.mock.calls).toEqual([[s1, s2, onDiff, [], diff]]);
    expect(onDiff.mock.calls).toEqual([
      [{ type: 'set', path: ['state1'] }],
      [{ type: 'set', path: ['state2'], value: true }],
    ]);
  });
});

describe('basicDiff()', () => {
  it('adds', () => {
    const s1 = undefined;
    const s2 = { hello: 1, there: 3 };
    const diff = combineDiffers(basicDiff);
    const onDiff = jest.fn();
    expect(diff(s1, s2, onDiff)).toBe(true);
    expect(onDiff.mock.calls).toEqual([
      [{ path: [], type: 'set', value: { hello: 1, there: 3 } }],
    ]);
  });
  it('removes', () => {
    const s1 = { hello: 1, there: 3 };
    const s2 = undefined;
    const diff = combineDiffers(basicDiff);
    const onDiff = jest.fn();
    expect(diff(s1, s2, onDiff)).toBe(true);
    expect(onDiff.mock.calls).toEqual([
      [{ path: [], type: 'set', value: undefined }],
    ]);
  });
});
