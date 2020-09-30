import { basicDiff, combineDiffers } from './diff';
import { diffObject } from './diff-object';
import { patch, PatchOperation } from './patch';

describe('diffObject', () => {
  function test(s1: any, s2: any, expected: PatchOperation[]) {
    const diff = combineDiffers(diffObject, basicDiff);
    const onDiff = jest.fn();
    expect(diff(s1, s2, onDiff)).toBe(expected.length > 0);
    expect(onDiff.mock.calls.map((args) => args[0])).toEqual(expected);
    expect(patch(s1, expected)).toEqual(s2);
  }
  it('no change', () => {
    test({ hello: 1, world: 2 }, { hello: 1, world: 2 }, []);
  });
  it('adds field', () => {
    test({ hello: 1, world: 2 }, { hello: 1, world: 2, there: 3 }, [
      { path: ['there'], type: 'set', value: 3 },
    ]);
  });
  it('adds two fields', () => {
    test({ hello: 1, world: 2 }, { hello: 1, cool: 1, world: 2, there: 3 }, [
      { path: ['cool'], type: 'set', value: 1 },
      { path: ['there'], type: 'set', value: 3 },
    ]);
  });
  it('changes field', () => {
    test({ hello: 1, world: 2 }, { hello: 1, world: 3 }, [
      { type: 'set', path: ['world'], value: 3 },
    ]);
  });
  it('removes field', () => {
    test({ hello: 1, world: 2 }, { hello: 1 }, [
      { type: 'set', path: ['world'] },
    ]);
  });
  it('removes and changes field', () => {
    test({ hello: 1, world: 2 }, { hello: 2 }, [
      { type: 'set', path: ['hello'], value: 2 },
      { type: 'set', path: ['world'] },
    ]);
  });
  it('adds and changes field', () => {
    test({ hello: 1, world: 2 }, { hello: 1, world: 3, there: 2 }, [
      { type: 'set', path: ['world'], value: 3 },
      { type: 'set', path: ['there'], value: 2 },
    ]);
  });
  it('adds and removes field', () => {
    test({ hello: 1, world: 2 }, { hello: 1, there: 2 }, [
      { type: 'set', path: ['world'] },
      { type: 'set', path: ['there'], value: 2 },
    ]);
  });
});
