import { diff3MergeIndices, diffIndices, LCS, makeRange } from './node-diff3';

describe('diff3MergeIndices', () => {
  it('works with one-sided change', () => {
    expect(diff3MergeIndices('', 'hello', '')).toEqual([
      {
        type: 'okA',
        length: 5,
        aIndex: 0,
        oIndex: undefined,
        bIndex: undefined,
      },
    ]);
  });
  it('merges non-conflicting adds', () => {
    expect(diff3MergeIndices('word.', 'hello. word.', 'word. bye.')).toEqual([
      {
        type: 'okA',
        length: 7,
        aIndex: 0,
        oIndex: undefined,
        bIndex: undefined,
      },
      {
        type: 'okA',
        length: 5,
        aIndex: 7,
        oIndex: 0,
        bIndex: 0,
      },
      {
        type: 'okB',
        length: 5,
        aIndex: undefined,
        oIndex: undefined,
        bIndex: 5,
      },
    ]);
  });
  it('merges conflicting adds', () => {
    expect(diff3MergeIndices('', 'hello', 'world')).toEqual([
      {
        type: 'conflict',
        aRange: makeRange(0, 5),
        oRange: makeRange(0, 0),
        bRange: makeRange(0, 5),
      },
    ]);
  });
  it('merges non-conflicting deletes', () => {
    expect(diff3MergeIndices('one two three', 'one two', 'two three')).toEqual([
      {
        type: 'okA',
        length: 3,
        oIndex: 4,
        aIndex: 4,
        bIndex: 0,
      },
    ]);
  });
  it('merges conflicting deletes 1', () => {
    expect(
      diff3MergeIndices('one two three', 'one three', 'two three'),
    ).toEqual([
      {
        type: 'okA',
        length: 1,
        oIndex: 4,
        bIndex: 0,
        aIndex: 4,
      },
      {
        type: 'okA',
        length: 4,
        oIndex: 9,
        aIndex: 5,
        bIndex: 5,
      },
    ]);
  });
  it('merges conflicting deletes 2', () => {
    expect(diff3MergeIndices('one two three', 'one two', 'two three')).toEqual([
      {
        type: 'okA',
        length: 3,
        oIndex: 4,
        aIndex: 4,
        bIndex: 0,
      },
    ]);
  });
  it('merges conflicting edits 1', () => {
    expect(diff3MergeIndices('two', 'one', 'two three')).toEqual([
      {
        type: 'okA',
        length: 1,
        aIndex: 0,
        bIndex: 2,
        oIndex: 2,
      },
      {
        type: 'conflict',
        aRange: makeRange(1, 2),
        oRange: makeRange(3, 0),
        bRange: makeRange(3, 6),
      },
    ]);
  });
});

describe('diffIndices', () => {
  it('zero to something', () => {
    expect(diffIndices('', 'hello')).toEqual([
      { a: makeRange(0, 0), b: makeRange(0, 5) },
    ]);
  });
  it('add in front', () => {
    expect(diffIndices('word.', 'hello. word.')).toEqual([
      { a: makeRange(0, 0), b: makeRange(0, 7) },
    ]);
  });
  it('add in back', () => {
    expect(diffIndices('word.', 'word. bye.')).toEqual([
      { a: makeRange(5, 0), b: makeRange(5, 5) },
    ]);
  });
  it('replace all', () => {
    expect(diffIndices('foo', 'bar')).toEqual([
      { a: makeRange(0, 3), b: makeRange(0, 3) },
    ]);
  });
  it('replace middle', () => {
    expect(diffIndices('one two three', 'one four three')).toEqual([
      { a: makeRange(4, 2), b: makeRange(4, 1) },
      { a: makeRange(7, 0), b: makeRange(6, 2) },
    ]);
  });
  it('delete front', () => {
    expect(diffIndices('one two three', 'two three')).toEqual([
      { a: makeRange(0, 4), b: makeRange(0, 0) },
    ]);
  });
  it('delete back', () => {
    expect(diffIndices('one two three', 'one two')).toEqual([
      { a: makeRange(7, 6), b: makeRange(7, 0) },
    ]);
  });
  it('delete middle', () => {
    expect(diffIndices('one two three', 'one three')).toEqual([
      { a: makeRange(5, 4), b: makeRange(5, 0) },
    ]);
  });
});

describe('LCS', () => {
  it('zero to something', () => {
    expect(LCS('', 'hello')).toEqual({
      aIndex: -1,
      bIndex: -1,
      chain: undefined,
    });
  });
  it('change in middle', () => {
    expect(LCS('a1a', 'b1b')).toEqual({
      aIndex: 1,
      bIndex: 1,
      chain: {
        aIndex: -1,
        bIndex: -1,
        chain: undefined,
      },
    });
  });
});
