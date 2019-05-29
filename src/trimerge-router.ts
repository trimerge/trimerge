import { AnyMerge } from './trimerge';
import { Path } from './path';
import { CannotMerge } from './cannot-merge';

class RouteWildCardClass {}
export const RouteWildCard = new RouteWildCardClass();
export type RoutePathKey = string | number | typeof RouteWildCard;
export type RoutePath = RoutePathKey[];

type Route = [RoutePath, AnyMerge];
export function routeMergers(...routes: Route[]): AnyMerge {
  interface RouteNode {
    keyMap: RouteMap;
    merger?: AnyMerge;
  }
  type RouteMap = Map<RoutePathKey, RouteNode>;
  const root: RouteNode = { keyMap: new Map() };

  function addRouter(
    node: RouteNode,
    currentPath: RoutePath,
    merger: AnyMerge,
  ) {
    if (currentPath.length === 0) {
      if (node.merger) {
        throw new Error('duplicate route');
      }
      node.merger = merger;
    } else {
      const [key, ...remainingPath] = currentPath;
      let subNode = node.keyMap.get(key);
      if (subNode === undefined) {
        subNode = { keyMap: new Map() };
        node.keyMap.set(key, subNode);
      }
      addRouter(subNode, remainingPath, merger);
    }
  }
  for (const [path, merger] of routes) {
    addRouter(root, path, merger);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (orig: any, left: any, right: any, path: Path, mergeFn: AnyMerge) => {
    let node: RouteNode = root;
    for (let i = 0; i < path.length; i++) {
      const childNode =
        node.keyMap.get(path[i]) || node.keyMap.get(RouteWildCard);
      if (childNode === undefined) {
        return CannotMerge;
      }
      node = childNode;
    }
    if (node.merger) {
      return node.merger(orig, left, right, path, mergeFn);
    }
    return CannotMerge;
  };
}
