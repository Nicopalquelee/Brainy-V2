const path = require('path');

const junitOutput = process.env.JEST_JUNIT_OUTPUT || 'test-results.xml';

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.spec.ts'],
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: path.dirname(junitOutput),
        outputName: path.basename(junitOutput)
      }
    ]
  ]
};
