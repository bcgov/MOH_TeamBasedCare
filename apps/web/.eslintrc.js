module.exports = {
  extends: ['../../.eslintrc.js', 'next/core-web-vitals'],
  plugins: ['testing-library', 'jest-dom'],
  rules: {
    '@next/next/no-img-element': 'off',
    '@typescript-eslint/no-namespace': 'off',
  },
};
