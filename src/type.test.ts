import {type} from "./type";

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
    it('works on objects', () => {
        expect(type({})).toBe('object');
        expect(type({ length: 5 })).toBe('object');
        expect(type(new Date())).toBe('object');
        expect(type(new Object())).toBe('object');
        expect(type(new String())).toBe('object');
        expect(type(new Boolean())).toBe('object');
    });
});
