import { diff3MergeIndices, diffIndices, LCS } from './node-diff3';

describe('diff3MergeIndices', () => {
  it('works with one-sided change', () => {
    expect(diff3MergeIndices('', 'hello', '')).toEqual([
      [-1, 0, 0, 0, 5, 0, 0],
    ]);
  });
  it('merges non-conflicting adds', () => {
    expect(diff3MergeIndices('word.', 'hello. word.', 'word. bye.')).toEqual([
      [-1, 0, 0, 0, 7, 0, 0],
      [1, 7, 5],
      [2, 5, 5],
    ]);
  });
  it('merges conflicting adds', () => {
    expect(diff3MergeIndices('', 'hello', 'world')).toEqual([
      [-1, 0, 0, 0, 5, 0, 5],
    ]);
  });
  it('merges non-conflicting deletes', () => {
    expect(diff3MergeIndices('one two three', 'one two', 'two three')).toEqual([
      [1, 4, 3],
      [-1, 7, 6, 7, 0, 3, 6],
    ]);
  });
  it('merges conflicting deletes 1', () => {
    expect(
      diff3MergeIndices('one two three', 'one three', 'two three'),
    ).toEqual([[2, 0, 2], [1, 0, 1], [1, 3, 2], [0, 5, 4], [1, 5, 4]]);
  });
  it('merges conflicting deletes 2', () => {
    expect(diff3MergeIndices('one two three', 'one two', 'two three')).toEqual([
      [1, 4, 3],
      [-1, 7, 6, 7, 0, 3, 6],
    ]);
  });
  it('merges conflicting edits 1', () => {
    expect(diff3MergeIndices('two', 'one', 'two three')).toEqual([
      [-1, 0, 2, 0, 0, 0, 2],
      [1, 0, 1],
      [-1, 3, 0, 1, 2, 3, 6],
    ]);
  });
});

describe('diffIndices', () => {
  it('zero to something', () => {
    expect(diffIndices('', 'hello')).toEqual([{ a: [0, 0], b: [0, 5] }]);
  });
  it('add in front', () => {
    expect(diffIndices('word.', 'hello. word.')).toEqual([
      { a: [0, 0], b: [0, 7] },
    ]);
  });
  it('add in back', () => {
    expect(diffIndices('word.', 'word. bye.')).toEqual([
      { a: [5, 0], b: [5, 5] },
    ]);
  });
  it('replace all', () => {
    expect(diffIndices('foo', 'bar')).toEqual([{ a: [0, 3], b: [0, 3] }]);
  });
  it('replace middle', () => {
    expect(diffIndices('one two three', 'one four three')).toEqual([
      { a: [4, 2], b: [4, 1] },
      { a: [7, 0], b: [6, 2] },
    ]);
  });
  it('delete front', () => {
    expect(diffIndices('one two three', 'two three')).toEqual([
      { a: [0, 4], b: [0, 0] },
    ]);
  });
  it('delete back', () => {
    expect(diffIndices('one two three', 'one two')).toEqual([
      { a: [7, 6], b: [7, 0] },
    ]);
  });
  it('delete middle', () => {
    expect(diffIndices('one two three', 'one three')).toEqual([
      { a: [5, 4], b: [5, 0] },
    ]);
  });
});

describe('LCS', () => {
  it('zero to something', () => {
    expect(LCS('', 'hello')).toEqual({ aIndex: -1, bIndex: -1, chain: null });
  });
  it('change in middle', () => {
    expect(LCS('a1a', 'b1b')).toEqual({
      aIndex: 1,
      bIndex: 1,
      chain: {
        aIndex: -1,
        bIndex: -1,
        chain: null,
      },
    });
  });
});
