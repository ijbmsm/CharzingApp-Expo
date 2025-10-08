const js = require('@eslint/js');

module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        process: 'readonly',
        global: 'readonly',
        Buffer: 'readonly',
      }
    },
    rules: {
      // 앱스토어 제출을 위한 필수 규칙만
      'no-unused-vars': 'warn',
      'no-undef': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': 'off', // 디버깅용 허용
    },
    files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
  },
];