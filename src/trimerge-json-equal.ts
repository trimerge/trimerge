import { trimergeEqualityCreator } from './trimerge';
import { jsonEqual } from './json-equal';

export const trimergeJsonDeepEqual = trimergeEqualityCreator(jsonEqual);
