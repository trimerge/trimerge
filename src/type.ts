export function type(
  object: any,
): typeof object | 'instance' | 'array' | 'null' {
  const t = typeof object;
  if (t !== 'object') {
    return t;
  }
  if (object === null) {
    return 'null';
  }
  if (Array.isArray(object)) {
    return 'array';
  }
  const proto = Object.getPrototypeOf(object);
  if (proto === Object.prototype || proto === null) {
    return 'object';
  }
  return 'instance';
}
