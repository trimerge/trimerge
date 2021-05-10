import {
  diff3MergeIndices,
  diffIndices,
  diffIndicesArray,
  diffIndicesString,
  makeRange,
} from './node-diff3';
import { jsonEqual } from './json-equal';

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

describe.each([diffIndices, diffIndicesArray, diffIndicesString])(
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
      const res = diffIndices('one two three', 'one three');

      expect(
        jsonEqual(res, [{ a: makeRange(5, 4), b: makeRange(5, 0) }]) ||
          jsonEqual(res, [{ a: makeRange(4, 4), b: makeRange(4, 0) }]) ||
          jsonEqual(res, [{ a: makeRange(3, 4), b: makeRange(3, 0) }]),
      ).toBe(true);
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

describe.each([diffIndicesArray])('array performance %p', (diffIndicesArr) => {
  function makeArr(len: number) {
    let a = '';
    while (a.length < len) {
      a +=
        'The quick brown fox jumps over the lazy dog.' +
        ' A man, a plan, a canal, panama.' +
        ' She sells sea shells by the sea shore. ';
    }
    return a.slice(0, len).split('');
  }
  it('is performant for equal large array', () => {
    const a = makeArr(200_000);
    expect(diffIndicesArr(a, a)).toEqual([]);
  });
  it('is performant for large arrays with head diff', () => {
    const a = makeArr(200_000);
    const b = [...'***', ...a];
    expect(diffIndicesArr(a, b)).toEqual([
      {
        a: makeRange(0, 0),
        b: makeRange(0, 3),
      },
    ]);
  });
  it('is performant for large arrays with tail diff', () => {
    const a = makeArr(200_000);
    const b = [...a, ...'***'];
    expect(diffIndicesArr(a, b)).toEqual([
      {
        a: makeRange(200_000, 0),
        b: makeRange(200_000, 3),
      },
    ]);
  });
  it('is performant for large arrays with scattered changes', () => {
    const a = makeArr(200_000);
    const delta = 10;
    const addLocs = [10_000, 20_000, 25_000, 50_000, 75_000];
    const delLocs = [100_000, 120_000, 121_000, 150_000, 190_000];
    const b = [...a];
    for (let i = delLocs.length - 1; i >= 0; i--) {
      b.splice(delLocs[i], delta);
    }
    for (let i = addLocs.length - 1; i >= 0; i--) {
      b.splice(addLocs[i], 0, ...'*'.repeat(delta));
    }
    expect(diffIndicesArr(a, b)).toMatchSnapshot();
  });
  it('is performant for large arrays with many changes', () => {
    const a = makeArr(200_000);
    const b = [...a];
    for (let i = 0; i < 200_000; i += 100) {
      b.splice(i, 1, '*');
    }
    expect(diffIndicesArr(a, b)).toBeDefined();
  });
});
