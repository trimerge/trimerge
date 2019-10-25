import { type } from './type';

describe('type', () => {
  it('works on strings', () => {
    expect(type('string')).toBe('string');
    expect(type('')).toBe('string');
    expect(type(String('hello'))).toBe('string');
    expect(type((5).toString())).toBe('string');
    expect(type(`hello`)).toBe('string');
  });
  it('works on numbers', () => {
    expect(type(0)).toBe('number');
    expect(type(10.5)).toBe('number');
    expect(type(Infinity)).toBe('number');
    expect(type(NaN)).toBe('number');
  });
  it('works on boolean', () => {
    expect(type(false)).toBe('boolean');
    expect(type(true)).toBe('boolean');
  });
  it('works on undefined', () => {
    expect(type(undefined)).toBe('undefined');
    expect(type((() => undefined)())).toBe('undefined');
  });
  it('works on null', () => {
    expect(type(null)).toBe('null');
  });
  it('works on functions', () => {
    expect(type(() => {})).toBe('function');
    expect(
      type(function() {
        // empty
      }),
    ).toBe('function');
    expect(type(String.fromCharCode)).toBe('function');
    expect(type(new Function())).toBe('function');
  });
  it('works on objects', () => {
    expect(type({})).toBe('object');
    expect(type({ length: 5 })).toBe('object');
    expect(type(new Object())).toBe('object');
    expect(type(Object.create(null))).toBe('object');
  });
  it('works on class instances', () => {
    expect(type(Object.create({}))).toBe('instance');
    expect(type(new Date())).toBe('instance');
    expect(type(new String())).toBe('instance');
    expect(type(new Boolean())).toBe('instance');
    expect(type(/regexp/)).toBe('instance');
    class Foo {}
    expect(type(new Foo())).toBe('instance');
  });
});
