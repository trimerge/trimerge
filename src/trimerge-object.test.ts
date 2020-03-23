import {
  CannotMergeError,
  combineMergers,
  MergeFn,
  trimergeEquality,
} from './trimerge';
import { Path } from './path';
import { CannotMerge } from './cannot-merge';
import { trimergeObject } from './trimerge-object';

function mockPathTrackingMerger(paths: Path[]): MergeFn {
  return (_orig, _left, _right, path = []): typeof CannotMerge => {
    paths.push(path);
    return CannotMerge;
  };
}

describe('trimergeJsObject', () => {
  it('adds field', () => {
    const s1 = { hello: 1, world: 2 };
    const s2 = { hello: 1, world: 2, there: 3 };
    const s3 = { hello: 1, world: 2 };
    const paths: Path[] = [];
    const merger = combineMergers(
      mockPathTrackingMerger(paths),
      trimergeEquality,
      trimergeObject,
    );
    expect(merger(s1, s2, s3)).toBe(s2);
    expect(paths).toEqual([[], ['hello'], ['world'], ['there']]);
    // try reverse
    expect(merger(s1, s3, s2)).toBe(s2);
  });
  it('adds two fields', () => {
    const s1 = { hello: 1, world: 2 };
    const s2 = { hello: 1, world: 2, there: 3 };
    const s3 = { hello: 1, world: 2, here: 4 };
    const paths: Path[] = [];
    const merger = combineMergers(
      mockPathTrackingMerger(paths),
      trimergeEquality,
      trimergeObject,
    );
    expect(merger(s1, s2, s3)).toEqual({
      hello: 1,
      world: 2,
      there: 3,
      here: 4,
    });
    expect(paths).toEqual([[], ['hello'], ['world'], ['there'], ['here']]);
  });
  it('adds against undefined', () => {
    const s1 = undefined;
    const s2 = { hello: 1, there: 3 };
    const s3 = { hello: 1, here: 4 };
    const paths: Path[] = [];
    const merger = combineMergers(
      mockPathTrackingMerger(paths),
      trimergeEquality,
      trimergeObject,
    );
    expect(merger(s1, s2, s3)).toEqual({
      hello: 1,
      there: 3,
      here: 4,
    });
    expect(paths).toEqual([[], ['hello'], ['there'], ['here']]);
  });
  it('changes field', () => {
    const s1 = { hello: 1, world: 2 };
    const s2 = { hello: 1, world: 2 };
    const s3 = { hello: 1, world: 3 };
    const paths: Path[] = [];
    const merger = combineMergers(
      mockPathTrackingMerger(paths),
      trimergeEquality,
      trimergeObject,
    );
    expect(merger(s1, s2, s3)).toBe(s3);
    expect(paths).toEqual([[], ['hello'], ['world']]);
    // try reverse
    expect(merger(s1, s3, s2)).toBe(s3);
  });
  it('removes field', () => {
    const s1 = { hello: 1, world: 2 };
    const s2 = { hello: 1 };
    const s3 = { hello: 1, world: 2 };
    const paths: Path[] = [];
    const merger = combineMergers(
      mockPathTrackingMerger(paths),
      trimergeEquality,
      trimergeObject,
    );
    expect(merger(s1, s2, s3)).toBe(s2);
    expect(paths).toEqual([[], ['hello'], ['world']]);
    //try reverse
    expect(merger(s1, s3, s2)).toBe(s2);
  });
  it('adds and changes field', () => {
    const s1 = { hello: 1, world: 2 };
    const s2 = { hello: 1, world: 2, there: 2 };
    const s3 = { hello: 1, world: 3 };
    const paths: Path[] = [];
    const merger = combineMergers(
      mockPathTrackingMerger(paths),
      trimergeEquality,
      trimergeObject,
    );
    expect(merger(s1, s2, s3)).toEqual({ hello: 1, world: 3, there: 2 });
    expect(paths).toEqual([[], ['hello'], ['world'], ['there']]);
  });
  it('adds and removes field', () => {
    const s1 = { hello: 1, world: 2 };
    const s2 = { hello: 1, world: 2, there: 2 };
    const s3 = { hello: 1 };
    const paths: Path[] = [];
    const merger = combineMergers(
      mockPathTrackingMerger(paths),
      trimergeEquality,
      trimergeObject,
    );
    expect(merger(s1, s2, s3)).toEqual({ hello: 1, there: 2 });
    expect(paths).toEqual([[], ['hello'], ['world'], ['there']]);
  });
  it('does not merge if not all objects 1', () => {
    const s1 = false;
    const s2 = {};
    const s3 = {};
    const merger = combineMergers(trimergeObject);
    expect(() => merger(s1, s2, s3)).toThrowError(CannotMergeError);
  });
  it('does not merge if not all objects 2', () => {
    const s1 = {};
    const s2 = false;
    const s3 = {};
    const merger = combineMergers(trimergeObject);
    expect(() => merger(s1, s2, s3)).toThrowError(CannotMergeError);
  });
  it('does not merge if not all objects 3', () => {
    const s1 = {};
    const s2 = {};
    const s3 = false;
    const merger = combineMergers(trimergeObject);
    expect(() => merger(s1, s2, s3)).toThrowError(CannotMergeError);
  });
  it('does not merge if none are objects', () => {
    const s1 = false;
    const s2 = false;
    const s3 = false;
    const merger = combineMergers(trimergeObject);
    expect(() => merger(s1, s2, s3)).toThrowError(CannotMergeError);
  });
  it('does not class instances', () => {
    class Foo {}
    const s1 = new Foo();
    const s2 = new Foo();
    const s3 = new Foo();
    const merger = combineMergers(trimergeObject);
    expect(() => merger(s1, s2, s3)).toThrowError(CannotMergeError);
  });
});
