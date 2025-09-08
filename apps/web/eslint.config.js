const baseConfig = require('../../eslint.config.js');

module.exports = [
  ...baseConfig,
  {
    files: ['**/*.{js,ts,tsx}'],
    rules: {
      '@typescript-eslint/no-namespace': 'off',
      // Disable React rules that don't exist in base ESLint config
      'react/jsx-key': 'off',
      'react-hooks/exhaustive-deps': 'off',
    },
  },
];