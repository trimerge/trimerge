module.exports = function (wallaby) {

  return {
    files: [
      'src/**/*',
      '!src/**/*.test.ts'
    ],

    tests: [
      'src/**/*.test.ts'
    ],

    compilers: {
      '**/*.ts?(x)': wallaby.compilers.typeScript({ module: 'commonjs' })
    },

    env: {
      type: 'node',
      runner: 'node'
    },

    testFramework: 'jest'
  };
};
