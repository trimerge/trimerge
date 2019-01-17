# Three-way JSON Merge 
[![CircleCI](https://circleci.com/gh/marcello3d/json-diff3.svg?style=svg)](https://circleci.com/gh/marcello3d/json-diff3) 
[![npm version](https://badge.fury.io/js/json-diff3.svg)](https://badge.fury.io/js/json-diff3)
[![codecov](https://codecov.io/gh/marcello3d/json-diff3/branch/master/graph/badge.svg)](https://codecov.io/gh/marcello3d/json-diff3)

Experimental 3-way JSON merge library.

Usage:
```typescript
import { diff3 } from 'json-diff3';

const state1 = {
  hello: 1,
  world: 2,
};
const state2 = {
  hello: 1,
  world: 2,
  a: 2,
};
const state3 = {
  hello: 1,
  world: 3,
};

diff3(state1, state2, state3)

// => 
// {
//   hello: 1,
//   world: 3,
//   a: 2,
// }
```
