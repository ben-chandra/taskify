module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests'],
  testRegex: '\\.test\\.tsx?$',
  transform: {
    '^.+\\.(t|j)sx?$': 'babel-jest',
  },
  moduleNameMapper: {
    '\\.(css|less|scss)$': 'identity-obj-proxy',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
};
