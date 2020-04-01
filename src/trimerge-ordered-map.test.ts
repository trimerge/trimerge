import { restoreKeys } from './trimerge-ordered-map';

describe('restoreKeys', () => {
  function testRestoreKeys(a: string[], b: string[]) {
    return restoreKeys(a, new Map(b.map((key) => [key, true])), new Set(a));
  }
  it('handles deletes', () => {
    expect(testRestoreKeys(['x', 'y'], ['x'])).toEqual(['x', 'y']);
  });
  it('handles deletes 2', () => {
    const a = ['x', 'y', 'z'];
    const b = ['x', 'z'];
    expect(testRestoreKeys(a, b)).toEqual(['x', 'y', 'z']);
  });
  it('handles change', () => {
    expect(testRestoreKeys(['y'], ['x'])).toEqual(['y', 'x']);
  });
  it('handles move', () => {
    const a = ['-1', '-2', 'x', 'y', '-3', '-4'];
    const b = ['-1', '-2', 'y', 'x', '-3', '-4'];
    expect(testRestoreKeys(a, b)).toEqual(b);
  });
  it('handles move 2', () => {
    const a = ['x', 'y', 'z'];
    const b = ['y', 'x', 'z'];
    expect(testRestoreKeys(a, b)).toEqual(b);
  });
  it('handles move and delete (ambiguous)', () => {
    const a = ['x', 'y', 'z'];
    const b = ['z', 'x'];
    expect(testRestoreKeys(a, b)).toEqual(['y', 'z', 'x']);
  });
  it('handles add at end', () => {
    const a = ['x', 'y'];
    const b = ['x', 'y', 'z'];
    expect(testRestoreKeys(a, b)).toEqual(b);
  });
  it('handles add in middle', () => {
    const a = ['x', 'z'];
    const b = ['x', 'y', 'z'];
    expect(testRestoreKeys(a, b)).toEqual(b);
  });
  it('handles add and delete (ambiguous)', () => {
    const a = ['x', 'z'];
    const b = ['y', 'z'];
    expect(testRestoreKeys(a, b)).toEqual(['x', 'y', 'z']);
  });
  it('handles add and delete 2', () => {
    const a = ['x', 'z'];
    const b = ['z', 'y'];
    expect(testRestoreKeys(a, b)).toEqual(['x', 'z', 'y']);
  });
  it('handles move and delete', () => {
    const o = ['x', 'y', 'z'];
    const l = ['z', 'x'];
    const r = ['x', 'y', 'q', 'z'];
    expect(testRestoreKeys(o, l)).toEqual(['y', 'z', 'x']);
    expect(testRestoreKeys(o, r)).toEqual(['x', 'y', 'q', 'z']);
  });
});
