import {
  diff3MergeIndices,
  diffRangesFastDiffString,
  diffIndices,
  diffIndicesLCS,
  diffIndicesString,
  diffRangesLCS,
  LCS,
  makeRange,
  diffRanges,
} from './node-diff3';

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
  it('captures delete', () => {
    expect(diff3MergeIndices(['a', 'b'], ['a'], ['a', 'b'])).toEqual([
      {
        aIndex: 0,
        bIndex: 0,
        length: 1,
        oIndex: 0,
        type: 'okA',
      },
    ]);
  });

  it('captures delete and move', () => {
    expect(diff3MergeIndices(['X', 'Y'], ['X'], ['Y', 'X'])).toEqual([
      {
        aRange: { location: 0, length: 1 },
        bRange: { location: 0, length: 2 },
        oRange: { location: 0, length: 2 },
        type: 'conflict',
      },
    ]);
  });

  it('captures delete 2', () => {
    expect(diff3MergeIndices(['a', 'b'], ['b', 'a'], ['a', 'b'])).toEqual([
      {
        aIndex: 0,
        bIndex: 1,
        length: 1,
        oIndex: 1,
        type: 'okA',
      },
      {
        aIndex: 1,
        length: 1,
        type: 'okA',
      },
    ]);
  });
});

describe.each([diffIndices, diffIndicesLCS, diffIndicesString])(
  'string diffIndices %p',
  (diffIndices) => {
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
  },
);

describe.each([diffRanges, diffRangesLCS, diffRangesFastDiffString])(
  'diff common %p',
  (diffCommon) => {
    function diffAndRecombine(aStr: string, bStr: string) {
      const ranges = diffCommon(aStr, bStr);
      let reconstructA = '';
      let reconstructB = '';
      for (const { a, b } of ranges) {
        reconstructA += aStr.slice(a.min, a.max);
        reconstructB += bStr.slice(b.min, b.max);
      }
      expect(reconstructA).toEqual(aStr);
      expect(reconstructB).toEqual(bStr);
      return ranges;
    }

    it('no change', () => {
      expect(diffAndRecombine('hello', 'hello')).toEqual([
        {
          a: { min: 0, max: 5 },
          b: { min: 0, max: 5 },
          same: true,
        },
      ]);
    });
    it('zero to something', () => {
      expect(diffAndRecombine('', 'hello')).toEqual([
        {
          a: { min: 0, max: 0 },
          b: { min: 0, max: 5 },
          same: false,
        },
      ]);
    });
    it('something to zero', () => {
      expect(diffAndRecombine('hello', '')).toEqual([
        {
          a: { min: 0, max: 5 },
          b: { min: 0, max: 0 },
          same: false,
        },
      ]);
    });
    it('add in front', () => {
      expect(diffAndRecombine('word.', 'hello. word.')).toEqual([
        {
          a: { min: 0, max: 0 },
          b: { min: 0, max: 7 },
          same: false,
        },
        {
          a: { min: 0, max: 5 },
          b: { min: 7, max: 12 },
          same: true,
        },
      ]);
    });
    it('add in back', () => {
      expect(diffAndRecombine('word.', 'word. bye.')).toEqual([
        {
          a: { min: 0, max: 5 },
          b: { min: 0, max: 5 },
          same: true,
        },
        {
          a: { min: 5, max: 5 },
          b: { min: 5, max: 10 },
          same: false,
        },
      ]);
    });
    it('replace all', () => {
      expect(diffAndRecombine('foo', 'bar')).toEqual([
        {
          a: { min: 0, max: 3 },
          b: { min: 0, max: 3 },
          same: false,
        },
      ]);
    });
    it('replace middle', () => {
      expect(diffAndRecombine('one six three', 'one four three')).toEqual([
        {
          a: { min: 0, max: 4 },
          b: { min: 0, max: 4 },
          same: true,
        },
        {
          a: { min: 4, max: 7 },
          b: { min: 4, max: 8 },
          same: false,
        },
        {
          a: { min: 7, max: 13 },
          b: { min: 8, max: 14 },
          same: true,
        },
      ]);
    });
    it('delete front', () => {
      expect(diffAndRecombine('one two three', 'two three')).toEqual([
        {
          a: { min: 0, max: 4 },
          b: { min: 0, max: 0 },
          same: false,
        },
        {
          a: { min: 4, max: 13 },
          b: { min: 0, max: 9 },
          same: true,
        },
      ]);
    });
    it('delete back', () => {
      expect(diffAndRecombine('one two three', 'one two')).toEqual([
        {
          a: { min: 0, max: 7 },
          b: { min: 0, max: 7 },
          same: true,
        },
        {
          a: { min: 7, max: 13 },
          b: { min: 7, max: 7 },
          same: false,
        },
      ]);
    });
    it('delete middle', () => {
      expect(diffAndRecombine('one two three', 'one three')).toEqual([
        {
          a: { min: 0, max: 5 },
          b: { min: 0, max: 5 },
          same: true,
        },
        {
          a: { min: 5, max: 9 },
          b: { min: 5, max: 5 },
          same: false,
        },
        {
          a: { min: 9, max: 13 },
          b: { min: 5, max: 9 },
          same: true,
        },
      ]);
    });
  },
);

describe('diffIndicesString', () => {
  function makeString(len: number) {
    let a = '';
    while (a.length < len) {
      a +=
        'The quick brown fox jumps over the lazy dog.' +
        ' A man, a plan, a canal, panama.' +
        ' She sells sea shells by the sea shore. ';
    }
    return a.slice(0, len);
  }
  it('is performant for equal large string', () => {
    const a = makeString(200_000);
    expect(diffIndicesString(a, a)).toEqual([]);
  });
  it('is performant for large strings with head diff', () => {
    const a = makeString(200_000);
    const b = `***${a}`;
    expect(diffIndicesString(a, b)).toEqual([
      {
        a: makeRange(0, 0),
        b: makeRange(0, 3),
      },
    ]);
  });
  it('is performant for large strings with tail diff', () => {
    const a = makeString(200_000);
    const b = `${a}***`;
    expect(diffIndicesString(a, b)).toEqual([
      {
        a: makeRange(200_000, 0),
        b: makeRange(200_000, 3),
      },
    ]);
  });
  it('is performant for large strings with scattered changes', () => {
    const a = makeString(200_000);
    const delta = 10;
    const addLocs = [10_000, 20_000, 25_000, 50_000, 75_000];
    const delLocs = [100_000, 120_000, 121_000, 150_000, 190_000];
    let b = a;
    for (let i = delLocs.length - 1; i >= 0; i--) {
      b = `${b.slice(0, delLocs[i])}${b.slice(delLocs[i] + delta)}`;
    }
    for (let i = addLocs.length - 1; i >= 0; i--) {
      b = `${b.slice(0, addLocs[i])}${'*'.repeat(delta)}${b.slice(addLocs[i])}`;
    }
    expect(diffIndicesString(a, b)).toMatchSnapshot();
  });
  it('is performant for large strings with many changes', () => {
    const a = makeString(200_000);
    let b = a;
    for (let i = 0; i < 200_000; i += 100) {
      b = `${b.slice(0, i)}*${b.slice(i + 1)}`;
    }
    expect(diffIndicesString(a, b)).toBeDefined();
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
  it('is undefined for equal string inputs', () => {
    expect(LCS('abc123', 'abc123')).toBeUndefined();
    expect(LCS('', '')).toBeUndefined();
  });
  it('is undefined for shallow-equal array inputs', () => {
    expect(LCS([], [])).toBeUndefined();
    const x = { x: true };
    const y = { y: true };
    expect(LCS([x, y], [x, y])).toBeUndefined();
  });
  it('is not undefined for value-equal array inputs', () => {
    expect(LCS([{ x: true }], [{ x: true }])).not.toBeUndefined();
  });
});
