import { restoreKeys } from './trimerge-ordered-map';

describe('restoreKeys', () => {
  it('handles deletes', () => {
    expect(restoreKeys(['x', 'y'], new Set(['x']), new Set(['y']))).toEqual([
      'x',
      'y',
    ]);
  });
  it('handles deletes 2', () => {
    expect(
      restoreKeys(['x', 'y', 'z'], new Set(['x', 'z']), new Set(['y'])),
    ).toEqual(['x', 'y', 'z']);
  });
  it('handles change', () => {
    expect(restoreKeys(['y'], new Set(['x']), new Set(['y']))).toEqual([
      'y',
      'x',
    ]);
  });
  it('handles empty set', () => {
    expect(
      restoreKeys(
        ['-1', '-2', 'x', 'y', '-3', '-4'],
        new Set(['-1', '-2', 'y', 'x', '-3', '-4']),
        new Set([]),
      ),
    ).toEqual(['-1', '-2', 'y', 'x', '-3', '-4']);
  });
  it('handles move and delete (ambiguous)', () => {
    expect(
      restoreKeys(['x', 'y', 'z'], new Set(['z', 'x']), new Set(['y'])),
    ).toEqual(['y', 'z', 'x']);
  });
  it('handles add at end', () => {
    expect(
      restoreKeys(['x', 'y'], new Set(['x', 'y', 'z']), new Set(['z'])),
    ).toEqual(['x', 'y', 'z']);
  });
  it('handles add in middle', () => {
    expect(
      restoreKeys(['x', 'z'], new Set(['x', 'y', 'z']), new Set(['y'])),
    ).toEqual(['x', 'y', 'z']);
  });
  it('handles add and delete (ambiguous)', () => {
    expect(
      restoreKeys(['x', 'z'], new Set(['y', 'z']), new Set(['x'])),
    ).toEqual(['x', 'y', 'z']);
  });
  it('handles add and delete 2', () => {
    expect(
      restoreKeys(['x', 'z'], new Set(['z', 'y']), new Set(['x'])),
    ).toEqual(['x', 'z', 'y']);
  });
});
