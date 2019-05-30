import { combineMergers, trimergeEquality } from './trimerge';
import { trimergeArrayCreator, trimergeJsonObject } from './trimerge-json';
import { trimergeString } from './trimerge-string';

describe('works with complex structure', () => {
  type ShapeEnum = 'ellipse' | 'rect';

  interface Shape {
    key: string;
    type: ShapeEnum;
    x: number;
    y: number;
    w: number;
    h: number;
    strokeColor?: string;
    strokeWidth?: number;
    fillColor?: string;
  }

  interface Canvas {
    width: number;
    height: number;
    shapes: Shape[];
  }
  interface Model {
    title?: string;
    canvas?: Canvas;
  }

  const merger = combineMergers(
    trimergeEquality,
    trimergeString,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    trimergeArrayCreator((item: any) => item.key),
    trimergeJsonObject,
  );

  it('merges string edit', () => {
    const s1: Model = {};
    const s2: Model = {};
    const s3: Model = { title: 'new title' };
    expect(merger(s1, s2, s3)).toEqual({
      title: 'new title',
    });
  });

  it('merges conflicting string adds', () => {
    const s1: Model = {};
    const s2: Model = { title: 'title' };
    const s3: Model = { title: 'new title' };
    expect(merger(s1, s2, s3)).toEqual({
      title: 'titlenew title',
    });
  });

  it('merges conflicting string edit', () => {
    const s1: Model = { title: 'original title' };
    const s2: Model = { title: 'original title is great' };
    const s3: Model = { title: 'new title' };
    expect(merger(s1, s2, s3)).toEqual({
      title: 'new title is great',
    });
  });
});
