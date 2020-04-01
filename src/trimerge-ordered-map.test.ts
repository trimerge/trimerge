import { trimergeOrderedMap } from './trimerge-ordered-map';

describe('diff3Keys', () => {
  it('does nothing for no keys', () => {
    const callback = jest.fn();
    trimergeOrderedMap([], [], [], callback);
    expect(callback.mock.calls).toEqual([]);
  });
  it('merges added keys', () => {
    const callback = jest.fn();
    trimergeOrderedMap([], ['a'], ['b'], callback);
    expect(callback.mock.calls).toEqual([['a'], ['b']]);
  });
  it('merges removed keys', () => {
    const callback = jest.fn();
    trimergeOrderedMap(['a', 'b', 'c'], ['a', 'b'], ['b', 'c'], callback);
    expect(callback.mock.calls).toEqual([['b']]);
  });
  it('merges added and removed keys', () => {
    const callback = jest.fn();
    trimergeOrderedMap(
      ['a', 'b', 'c'],
      ['a', 'b'],
      ['a', 'b', 'c', 'd'],
      callback,
    );
    expect(callback.mock.calls).toEqual([['a'], ['b'], ['d']]);
  });
  it('merges moved keys', () => {
    const callback = jest.fn();
    trimergeOrderedMap(
      ['a', 'b', 'c'],
      ['c', 'a', 'b'],
      ['b', 'a', 'c'],
      callback,
    );
    expect(callback.mock.calls).toEqual([['c'], ['b'], ['a']]);
  });
  it('restores deleted key', () => {
    const callback = jest.fn();
    trimergeOrderedMap(
      ['a', 'b', 'c'],
      ['a', 'b'],
      ['a', 'b', 'c'],
      callback,
      true,
    );
    expect(callback.mock.calls).toEqual([['a'], ['b'], ['c']]);
  });
  it('handles conflicting move when allowed', () => {
    const callback = jest.fn();
    trimergeOrderedMap(
      ['a', 'b', 'c', 'd'],
      ['c', 'a', 'b', 'd'],
      ['a', 'b', 'd', 'c'],
      callback,
      true,
    );
    expect(callback.mock.calls).toEqual([['c'], ['a'], ['b'], ['d']]);
  });
  it('handles conflicting move when allowed 2', () => {
    const callback = jest.fn();
    trimergeOrderedMap(
      ['a', 'b', 'c', 'd'],
      ['a', 'b', 'd', 'c'],
      ['c', 'a', 'b', 'd'],
      callback,
      true,
    );
    expect(callback.mock.calls).toEqual([['c'], ['a'], ['b'], ['d']]);
  });

  it('throws on conflicting move', () => {
    const callback = jest.fn();
    expect(() =>
      trimergeOrderedMap(
        ['a', 'b', 'c', 'd'],
        ['a', 'b', 'd', 'c'],
        ['c', 'a', 'b', 'd'],
        callback,
      ),
    ).toThrow('order conflict');
    expect(callback.mock.calls).toEqual([['c'], ['a'], ['b'], ['d']]);
  });
});
