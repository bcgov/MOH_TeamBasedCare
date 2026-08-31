module.exports = {
  setupFilesAfterEnv: ['<rootDir>/jest-setup.js'],
  collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}', 'src/!**/*.d.ts', '!**/node_modules/**'],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    '^@components$': '<rootDir>/src/components',
    '^@services$': '<rootDir>/src/services',
    /* Handle CSS imports (with CSS modules)
    https://jestjs.io/docs/webpack#mocking-css-modules */
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',

    // Handle CSS imports (without CSS modules)
    '^.+\\.(css|sass|scss)$': '<rootDir>/__mocks__/styleMock.js',

    /* Handle image imports
    https://jestjs.io/docs/webpack#handling-static-assets */
    '^.+\\.(jpg|jpeg|png|gif|webp|avif|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/', '<rootDir>/e2e/'],
  testEnvironment: 'jsdom',
  transform: {
    /* Use babel-jest to transpile tests with the next/babel preset
    https://jestjs.io/docs/configuration#transform-objectstring-pathtotransformer--pathtotransformer-object */
    /* runtime: 'automatic' matches the JSX transform Next actually builds with. The
       classic runtime still applies `defaultProps` on function components, which React
       19 ignores in the automatic runtime, so tests would pass on code that crashes in
       the browser. */
    '^.+\\.(js|jsx|ts|tsx)$': [
      'babel-jest',
      { presets: [['next/babel', { 'preset-react': { runtime: 'automatic' } }]] },
    ],
  },
  transformIgnorePatterns: ['/node_modules/(?!(exceljs|uuid)/)', '^.+\\.module\\.(css|sass|scss)$'],
};
