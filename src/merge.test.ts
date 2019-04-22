import { JSONValue } from './json';
import { jsonMerge, makeMerger } from './merge';
import { Path } from './path';

describe('merge', () => {
  it('calls helper', () => {
    const state1 = {
      hello: 1,
      world: 2,
    };
    const state2 = {
      hello: 1,
      world: 2,
      a: 2,
    };
    const state3 = {
      hello: 1,
      world: 3,
    };
    const paths: Path[] = [];
    const merger = makeMerger((orig, left, right, path, merger) => {
      paths.push(path);
      return jsonMerge((item: JSONValue) =>
        item && typeof item === 'object' && 'id' in item
          ? (item.id as string)
          : '',
      )(orig, left, right, path, merger);
    });
    merger(state1, state2, state3);
    expect(paths).toEqual([]);
  });
});
