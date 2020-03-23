/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { combineMergers } from './trimerge';
import { trimergeObject } from './trimerge-object';
import { trimergeString } from './trimerge-string';
import { routeMergers } from './trimerge-router';
import { trimergeArrayCreator } from './trimerge-array';
import { trimergeJsonDeepEqual } from './trimerge-json-equal';

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
    trimergeJsonDeepEqual,
    routeMergers(
      [['title'], trimergeString],
      [['canvas', 'shapes'], trimergeArrayCreator((item: Shape) => item.key)],
    ),
    trimergeObject,
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

  describe('large model', () => {
    const base: Model = {
      title: 'original title',
      canvas: {
        width: 100,
        height: 100,
        shapes: [
          {
            key: '1',
            type: 'ellipse',
            x: 10,
            y: 10,
            w: 200,
            h: 200,
          },
        ],
      },
    };
    const fakeImmerProduce = <T>(o: T, recipe: (o: T) => void): T => {
      const draft = JSON.parse(JSON.stringify(o));
      recipe(draft);
      return draft;
    };

    it('can add shapes', () => {
      const s2AddedShape: Shape = {
        key: '2',
        type: 'rect',
        x: 10,
        y: 10,
        w: 200,
        h: 200,
      };
      const s3AddedShape: Shape = {
        key: '3',
        type: 'rect',
        x: 10,
        y: 10,
        w: 200,
        h: 200,
      };

      const s2 = fakeImmerProduce(base, (draft) => {
        draft.canvas!.shapes.push(s2AddedShape);
      });
      const s3 = fakeImmerProduce(base, (draft) => {
        draft.canvas!.shapes.push(s3AddedShape);
      });
      const result = fakeImmerProduce(base, (draft) => {
        draft.canvas!.shapes.push(s2AddedShape, s3AddedShape);
      });
      expect(merger(base, s2, s3)).toEqual(result);
    });
  });
});
