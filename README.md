# Trimerge: Three-way Merge JSON and Structures

[![Actions Status](https://github.com/marcello3d/trimerge/workflows/Node%20CI/badge.svg)](https://github.com/marcello3d/trimerge/actions)
[![npm version](https://badge.fury.io/js/trimerge.svg)](https://badge.fury.io/js/trimerge)
[![codecov](https://codecov.io/gh/marcello3d/trimerge/branch/master/graph/badge.svg)](https://codecov.io/gh/marcello3d/trimerge)

Experimental 3-way merge library.

Usage:

```typescript
import { combineMergers, trimergeEquality, trimergeJsonObject } from 'trimerge';

const s1 = { hello: 1, world: 2 };
const s2 = { hello: 1, world: 2, there: 2 };
const s3 = { hello: 1 };

const merger = combineMergers(trimergeEquality, trimergeJsonObject);
merger(s1, s2, s3); // => { hello: 1, there: 2 }
```

## License

Based on MIT licensed code from [node-diff3](https://github.com/bhousel/node-diff3).
