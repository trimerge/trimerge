import { routeMergers, RouteWildCard } from './trimerge-router';
import { combineMergers, trimergeEquality } from './trimerge';
import { trimergeJsonObject } from './trimerge-json';

describe('routeMergers() can build', () => {
  it('no routes', () => {
    expect(routeMergers()).toBeInstanceOf(Function);
  });
  it('one route', () => {
    expect(routeMergers([['hello', 'world'], trimergeEquality])).toBeInstanceOf(
      Function,
    );
  });
  it('two routes', () => {
    expect(
      routeMergers(
        [['hello', 'world'], trimergeEquality],
        [['hello', 'vorld'], trimergeEquality],
      ),
    ).toBeInstanceOf(Function);
  });
  it('with wildcard', () => {
    expect(
      routeMergers(
        [['hello', RouteWildCard], trimergeEquality],
        [['hello', 'vorld'], trimergeEquality],
      ),
    ).toBeInstanceOf(Function);
  });
  it('with root route', () => {
    expect(routeMergers([[], trimergeEquality])).toBeInstanceOf(Function);
  });
  it('fails with same route twice', () => {
    expect(() =>
      routeMergers(
        [['hello'], trimergeEquality],
        [['hello'], trimergeEquality],
      ),
    ).toThrowError('duplicate route');
  });
  it('with nested route', () => {
    expect(
      routeMergers(
        [['hello', 'world'], trimergeEquality],
        [['hello'], trimergeEquality],
      ),
    ).toBeInstanceOf(Function);
  });
});

function mergeLeft(_orig: any, left: any): any {
  return left;
}

describe('routeMergers() merges', () => {
  it('with one route', () => {
    const mockedMergeLeft = jest.fn(mergeLeft);
    const merger = combineMergers(
      routeMergers([['hello'], mockedMergeLeft]),
      trimergeEquality,
      trimergeJsonObject,
      mergeLeft,
    );
    const s1 = { hello: true, world: true };
    const s2 = { hello: true, world: true };
    const s3 = { hello: true, world: true };

    expect(merger(s1, s2, s3)).toEqual(s3);
    expect(mockedMergeLeft.mock.calls).toEqual([
      [true, true, true, ['hello'], merger],
    ]);
  });
  it('with root route', () => {
    const mockedMergeLeft = jest.fn(mergeLeft);
    const merger = combineMergers(
      routeMergers([[], mockedMergeLeft]),
      trimergeEquality,
      trimergeJsonObject,
      mergeLeft,
    );
    const s1 = { hello: true, world: true };
    const s2 = { hello: true, world: true };
    const s3 = { hello: true, world: true };

    expect(merger(s1, s2, s3)).toEqual(s3);
    expect(mockedMergeLeft.mock.calls).toEqual([[s1, s2, s3, [], merger]]);
  });
  it('with wildcard route', () => {
    const mockedMergeLeft = jest.fn(mergeLeft);
    const merger = combineMergers(
      routeMergers([[RouteWildCard], mockedMergeLeft]),
      trimergeEquality,
      trimergeJsonObject,
      mergeLeft,
    );
    const s1 = { hello: true, world: true };
    const s2 = { hello: true, world: false };
    const s3 = { hello: true, world: true };

    expect(merger(s1, s2, s3)).toEqual(s2);
    expect(mockedMergeLeft.mock.calls).toEqual([
      [true, true, true, ['hello'], merger],
      [true, false, true, ['world'], merger],
    ]);
  });
  it('with merge functions and wildcard', () => {
    const mockedMergeLeft1 = jest.fn(mergeLeft);
    const mockedMergeLeft2 = jest.fn(mergeLeft);
    const merger = combineMergers(
      routeMergers(
        [['hello'], mockedMergeLeft1],
        [[RouteWildCard], mockedMergeLeft2],
      ),
      trimergeEquality,
      trimergeJsonObject,
      mergeLeft,
    );
    const s1 = { hello: true, world: true };
    const s2 = { hello: true, world: true };
    const s3 = { hello: true, world: true };

    expect(merger(s1, s2, s3)).toEqual(s3);
    expect(mockedMergeLeft1.mock.calls).toEqual([
      [true, true, true, ['hello'], merger],
    ]);
    expect(mockedMergeLeft2.mock.calls).toEqual([
      [true, true, true, ['world'], merger],
    ]);
  });
});
