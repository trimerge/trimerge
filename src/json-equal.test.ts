'use strict';

// From https://github.com/epoberezkin/fast-deep-equal/blob/master/spec/tests.js
import jsonEqual from './json-equal';

function func1() {}
function func2() {}

describe('jsonEqual', () => {
  describe('scalars', () => {
    it('equal numbers', () => {
      expect(jsonEqual(1, 1)).toBe(true);
    });
    it('not equal numbers', () => {
      expect(jsonEqual(1, 2)).toBe(false);
    });
    it('number and array are not equal', () => {
      expect(jsonEqual(1, [])).toBe(false);
    });
    it('0 and null are not equal', () => {
      expect(jsonEqual(0, null)).toBe(false);
    });
    it('equal strings', () => {
      expect(jsonEqual('a', 'a')).toBe(true);
    });
    it('not equal strings', () => {
      expect(jsonEqual('a', 'b')).toBe(false);
    });
    it('empty string and null are not equal', () => {
      expect(jsonEqual('', null)).toBe(false);
    });
    it('null is equal to null', () => {
      expect(jsonEqual(null, null)).toBe(true);
    });
    it('equal booleans (true)', () => {
      expect(jsonEqual(true, true)).toBe(true);
    });
    it('equal booleans (false)', () => {
      expect(jsonEqual(false, false)).toBe(true);
    });
    it('not equal booleans', () => {
      expect(jsonEqual(true, false)).toBe(false);
    });
    it('1 and true are not equal', () => {
      expect(jsonEqual(1, true)).toBe(false);
    });
    it('0 and false are not equal', () => {
      expect(jsonEqual(0, false)).toBe(false);
    });
    it('NaN and NaN are equal', () => {
      expect(jsonEqual(NaN, NaN)).toBe(true);
    });
    it('0 and -0 are equal', () => {
      expect(jsonEqual(0, -0)).toBe(true);
    });
    it('Infinity and Infinity are equal', () => {
      expect(jsonEqual(Infinity, Infinity)).toBe(true);
    });
    it('Infinity and -Infinity are not equal', () => {
      expect(jsonEqual(Infinity, -Infinity)).toBe(false);
    });
  });

  describe('objects', () => {
    it('empty objects are equal', () => {
      expect(jsonEqual({}, {})).toBe(true);
    });
    it('equal objects (same properties "order")', () => {
      expect(jsonEqual({ a: 1, b: '2' }, { a: 1, b: '2' })).toBe(true);
    });
    it('equal objects (different properties "order")', () => {
      expect(jsonEqual({ a: 1, b: '2' }, { b: '2', a: 1 })).toBe(true);
    });
    it('not equal objects (extra property)', () => {
      expect(jsonEqual({ a: 1, b: '2' }, { a: 1, b: '2', c: [] })).toBe(false);
    });
    it('not equal objects (different properties)', () => {
      expect(jsonEqual({ a: 1, b: '2', c: 3 }, { a: 1, b: '2', d: 3 })).toBe(
        false,
      );
    });
    it('not equal objects (different properties)', () => {
      expect(jsonEqual({ a: 1, b: '2', c: 3 }, { a: 1, b: '2', d: 3 })).toBe(
        false,
      );
    });
    it('equal objects (same sub-properties)', () => {
      expect(jsonEqual({ a: [{ b: 'c' }] }, { a: [{ b: 'c' }] })).toBe(true);
    });
    it('not equal objects (different sub-property value)', () => {
      expect(jsonEqual({ a: [{ b: 'c' }] }, { a: [{ b: 'd' }] })).toBe(false);
    });
    it('not equal objects (different sub-property)', () => {
      expect(jsonEqual({ a: [{ b: 'c' }] }, { a: [{ c: 'c' }] })).toBe(false);
    });
    it('empty array and empty object are not equal', () => {
      expect(jsonEqual({}, [])).toBe(false);
    });
    it('treat undefined property as missing #1', () => {
      expect(jsonEqual({ bar: true }, { bar: true, foo: undefined })).toBe(
        true,
      );
    });
    it('treat undefined property as missing #2', () => {
      expect(jsonEqual({ bar: true }, { bar: false, foo: undefined })).toBe(
        false,
      );
    });
    it('treat null and undefined properties differently', () => {
      expect(jsonEqual({ bar: undefined }, { bar: null })).toBe(false);
    });
    it('treat null property as equal', () => {
      expect(jsonEqual({ bar: null }, { bar: null })).toBe(true);
    });
    it('object with extra undefined properties are not equal #1', () => {
      expect(jsonEqual({}, { foo: undefined })).toBe(true);
    });
    it('object with extra undefined properties are not equal #2', () => {
      expect(jsonEqual({ foo: undefined }, {})).toBe(true);
    });
    it('object with extra undefined properties are not equal #3', () => {
      expect(jsonEqual({ foo: undefined }, { bar: undefined })).toBe(true);
    });
    it('nulls are equal', () => {
      expect(jsonEqual(null, null)).toBe(true);
    });
    it('null and undefined are not equal', () => {
      expect(jsonEqual(null, undefined)).toBe(false);
    });
    it('null and empty object are not equal', () => {
      expect(jsonEqual(null, {})).toBe(false);
    });
    it('undefined and empty object are not equal', () => {
      expect(jsonEqual(undefined, {})).toBe(false);
    });
  });

  describe('arrays', () => {
    it('two empty arrays are equal', () => {
      expect(jsonEqual([], [])).toBe(true);
    });
    it('equal arrays', () => {
      expect(jsonEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    });
    it('not equal arrays (different item)', () => {
      expect(jsonEqual([1, 2, 3], [1, 2, 4])).toBe(false);
    });
    it('not equal arrays (different length)', () => {
      expect(jsonEqual([1, 2, 3], [1, 2])).toBe(false);
    });
    it('equal arrays of objects', () => {
      expect(
        jsonEqual([{ a: 'a' }, { b: 'b' }], [{ a: 'a' }, { b: 'b' }]),
      ).toBe(true);
    });
    it('not equal arrays of objects', () => {
      expect(
        jsonEqual([{ a: 'a' }, { b: 'b' }], [{ a: 'a' }, { b: 'c' }]),
      ).toBe(false);
    });
    it('pseudo array and equivalent array are not equal', () => {
      expect(jsonEqual({ '0': 0, '1': 1, length: 2 }, [0, 1])).toBe(false);
    });
  });
  describe('Date objects', () => {
    it('equal date objects', () => {
      expect(
        jsonEqual(
          new Date('2017-06-16T21:36:48.362Z'),
          new Date('2017-06-16T21:36:48.362Z'),
        ),
      ).toBe(true);
    });
    // it('not equal date objects', () => {
    //   expect(
    //     jsonEqual(
    //       new Date('2017-06-16T21:36:48.362Z'),
    //       new Date('2017-01-01T00:00:00.000Z'),
    //     ),
    //   ).toBe(false);
    // });
    it('date and string are not equal', () => {
      expect(
        jsonEqual(
          new Date('2017-06-16T21:36:48.362Z'),
          '2017-06-16T21:36:48.362Z',
        ),
      ).toBe(false);
    });
    // it('date and object are not equal', () => {
    //   expect(jsonEqual(new Date('2017-06-16T21:36:48.362Z'), {})).toBe(false);
    // });
  });
  describe('RegExp objects', () => {
    it('equal RegExp objects', () => {
      expect(jsonEqual(/foo/, /foo/)).toBe(true);
    });
    // it('not equal RegExp objects (different pattern)', () => {
    //   expect(jsonEqual(/foo/, /bar/)).toBe(false);
    // });
    // it('not equal RegExp objects (different flags)', () => {
    //   expect(jsonEqual(/foo/, /foo/i)).toBe(false);
    // });
    it('RegExp and string are not equal', () => {
      expect(jsonEqual(/foo/, 'foo')).toBe(false);
    });
    // it('RegExp and object are not equal', () => {
    //   expect(jsonEqual(/foo/, {})).toBe(false);
    // });
  });
  describe('functions', () => {
    it('same function is equal', () => {
      expect(jsonEqual(func1, func1)).toBe(true);
    });
    it('different functions are not equal', () => {
      expect(jsonEqual(func1, func2)).toBe(false);
    });
  });
  describe('sample objects', () => {
    it('big object', () => {
      expect(
        jsonEqual(
          {
            prop1: 'value1',
            prop2: 'value2',
            prop3: 'value3',
            prop4: {
              subProp1: 'sub value1',
              subProp2: {
                subSubProp1: 'sub sub value1',
                subSubProp2: [1, 2, { prop2: 1, prop: 2 }, 4, 5],
              },
            },
            prop5: 1000,
            prop6: new Date(2016, 2, 10),
          },
          {
            prop5: 1000,
            prop3: 'value3',
            prop1: 'value1',
            prop2: 'value2',
            prop6: new Date('2016/03/10'),
            prop4: {
              subProp2: {
                subSubProp1: 'sub sub value1',
                subSubProp2: [1, 2, { prop2: 1, prop: 2 }, 4, 5],
              },
              subProp1: 'sub value1',
            },
          },
        ),
      ).toBe(true);
    });
  });
});
