const browserGlobals = {
  Blob: 'readonly',
  Event: 'readonly',
  ErrorEvent: 'readonly',
  PopStateEvent: 'readonly',
  Response: 'readonly',
  URL: 'readonly',
  document: 'readonly',
  fetch: 'readonly',
  history: 'readonly',
  navigator: 'readonly',
  performance: 'readonly',
  setTimeout: 'readonly',
  window: 'readonly',
};

export default [
  {
    ignores: [
      'coverage/**',
      'dist/**',
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: browserGlobals,
    },
    rules: {
      'no-undef': 'error',
      'no-unreachable': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
];
