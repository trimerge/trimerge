import { Path, PathKey } from './path';

export type SetOperation = {
  type: 'set';
  path: Path;
  value?: any;
};
export type SpliceOperation = {
  type: 'splice';
  path: Path;
  index: number;
  remove?: number;
  insert?: any[] | string;
};
export type PatchOperation = SetOperation | SpliceOperation;

export function patch(object: any, patches: PatchOperation[]): any {
  const root = [object];
  for (const patch of patches) {
    let obj = root[0];
    let parent: any = root;
    let key: PathKey = 0;
    const { path } = patch;
    for (const pathKey of path) {
      if (!obj) {
        throw new Error(`"${pathKey}" is undefined in [${path.join(', ')}]`);
      }
      parent = obj;
      key = pathKey;
      obj = obj[pathKey];
    }
    switch (patch.type) {
      case 'set':
        const { value } = patch;
        if (value === undefined) {
          delete parent[key];
        } else {
          parent[key] = value;
        }
        break;

      case 'splice':
        const { insert, index, remove = 0 } = patch;
        if (index < 0 || index > obj.length) {
          throw new Error(`out of range index in [${path.join(', ')}]`);
        }
        const removeEnd = index + remove;
        if (removeEnd < 0 || removeEnd > obj.length) {
          throw new Error(`out of range remove in [${path.join(', ')}]`);
        }
        if (typeof obj === 'string') {
          if (insert && typeof insert !== 'string') {
            throw new Error(
              `expected string in patch splice in [${path.join(', ')}]`,
            );
          }
          parent[key] =
            obj.slice(0, index) + (insert || '') + obj.slice(removeEnd);
        } else {
          if (insert) {
            if (!Array.isArray(insert)) {
              throw new Error(
                `expected array in patch splice in [${path.join(', ')}]`,
              );
            }
            obj.splice(index, remove, ...insert);
          } else {
            obj.splice(index, remove);
          }
        }
    }
  }
  return root[0];
}
