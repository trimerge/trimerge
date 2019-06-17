export function type(object: any): typeof object | 'array' | 'null' {
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
