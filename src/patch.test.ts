import { patch } from './patch';

describe('patch', () => {
  it('patches object', () => {
    const o = { ok: 1 };
    const patched = patch(o, [{ type: 'set', path: ['ok'], value: 2 }]);
    expect(patched).toEqual({ ok: 2 });
    expect(patched).toBe(o);
  });

  it('patches root object', () => {
    const o = { ok: 1 };
    const patched = patch(o, [{ type: 'set', path: [], value: { ok: 2 } }]);
    expect(patched).toEqual({ ok: 2 });
    expect(patched).not.toBe(o);
  });

  it('patches root string', () => {
    const o = 'hello';
    const patched = patch(o, [{ type: 'set', path: [], value: 'world' }]);
    expect(patched).toEqual('world');
    expect(patched).not.toBe(o);
  });

  it('splices array insert', () => {
    const o = [0];
    const patched = patch(o, [
      { type: 'splice', path: [], index: 1, insert: [1] },
    ]);
    expect(patched).toEqual([0, 1]);
    expect(patched).toBe(o);
  });

  it('splices array remove', () => {
    const o = [0, 1, 2];
    const patched = patch(o, [
      { type: 'splice', path: [], index: 1, remove: 2 },
    ]);
    expect(patched).toEqual([0]);
    expect(patched).toBe(o);
  });

  it('splices array remove and insert', () => {
    const o = [0, 1, 2];
    const patched = patch(o, [
      { type: 'splice', path: [], index: 1, remove: 1, insert: ['ok'] },
    ]);
    expect(patched).toEqual([0, 'ok', 2]);
    expect(patched).toBe(o);
  });

  it('splices string insert', () => {
    const o = '0';
    const patched = patch(o, [
      { type: 'splice', path: [], index: 1, insert: 'ok' },
    ]);
    expect(patched).toEqual('0ok');
  });

  it('splices string remove', () => {
    const o = '01234';
    const patched = patch(o, [
      { type: 'splice', path: [], index: 1, remove: 2 },
    ]);
    expect(patched).toEqual('034');
  });

  it('splices array remove and insert', () => {
    const o = '01234';
    const patched = patch(o, [
      { type: 'splice', path: [], index: 1, remove: 2, insert: 'ok' },
    ]);
    expect(patched).toEqual('0ok34');
  });

  it('fails on bad path', () => {
    const o = { ok: 1 };
    expect(() =>
      patch(o, [{ type: 'set', path: ['bad', 'path'], value: { ok: 2 } }]),
    ).toThrowError('"path" is undefined in [bad, path]');
  });

  it('splice string fails on index too big', () => {
    const o = '0';
    expect(() =>
      patch(o, [{ type: 'splice', path: [], index: 2, insert: 'ok' }]),
    ).toThrowError('out of range index in []');
  });

  it('splice string fails on remove too much', () => {
    const o = '0';
    expect(() =>
      patch(o, [{ type: 'splice', path: [], index: 0, remove: 5 }]),
    ).toThrowError('out of range remove in []');
  });

  it('splice string fails on remove past end', () => {
    const o = '0';
    expect(() =>
      patch(o, [{ type: 'splice', path: [], index: 1, remove: 1 }]),
    ).toThrowError('out of range remove in []');
  });

  it('splice array fails on index too big', () => {
    const o = [0];
    expect(() =>
      patch(o, [{ type: 'splice', path: [], index: 2, insert: [1] }]),
    ).toThrowError('out of range index in []');
  });

  it('splice array fails on remove too much', () => {
    const o = [0];
    expect(() =>
      patch(o, [{ type: 'splice', path: [], index: 0, remove: 5 }]),
    ).toThrowError('out of range remove in []');
  });

  it('splice array fails on remove past end', () => {
    const o = [0];
    expect(() =>
      patch(o, [{ type: 'splice', path: [], index: 1, remove: 1 }]),
    ).toThrowError('out of range remove in []');
  });

  it('splice array fails on string', () => {
    const o = '01234';
    expect(() =>
      patch(o, [{ type: 'splice', path: [], index: 1, insert: [0] }]),
    ).toThrowError('expected string in patch splice in []');
  });
  it('splice string fails on array', () => {
    const o = [0, 1, 2];
    expect(() =>
      patch(o, [{ type: 'splice', path: [], index: 1, insert: 'string' }]),
    ).toThrowError('expected array in patch splice in []');
  });
});
