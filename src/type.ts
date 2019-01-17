export function type(object: any): typeof object {
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
  return 'object';
}
