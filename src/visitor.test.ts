import { JSONObject } from './json';
import { defaultVisit, visitor } from './visitor';

describe('visitor', () => {
  it('visits a tree', () => {
    const tree: JSONObject = {
      object: {
        number: 5,
        string: 'string',
        null: null,
      },
      array: [1, 'two', null],
    };
    const values: Array<[any, string]> = [];
    visitor(function*(value, path) {
      values.push([value, path.join('/')]);
      yield* defaultVisit(value);
    })(tree);
    expect(values).toEqual([
      [
        {
          array: [1, 'two', null],
          object: { null: null, number: 5, string: 'string' },
        },
        '',
      ],
      [{ null: null, number: 5, string: 'string' }, 'object'],
      [5, 'object/number'],
      ['string', 'object/string'],
      [null, 'object/null'],
      [[1, 'two', null], 'array'],
      [1, 'array/0'],
      ['two', 'array/1'],
      [null, 'array/2'],
    ]);
  });
});
