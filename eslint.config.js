import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    ignores: [
      'dist',
      'scripts',
      'tailwind.config.js',
      'vite.config.js',
      'postcss.config.js',
      '.vercel',
      'print_specific.js',
    ],
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.jest, // Add Jest/Vitest globals
        vi: 'readonly', // Vitest mock
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: '18.3' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      prettier: prettier,
    },
    // Combine rules: recommended JS + React + Prettier
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      ...prettierConfig.rules, // Disable conflicting ESLint rules

      'prettier/prettier': 'warn', // formatting issues as warnings

      'react/jsx-no-target-blank': 'off',
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'off',
      // Allow styled-jsx and shadcn patterns
      'react/no-unknown-property': [
        'error',
        {
          ignore: [
            'jsx',
            'global',
            'cmdk-input-wrapper',
            'cmdk-group',
            'cmdk-item',
            'toast-close',
            'toast-title',
            'toast-description',
            'toast-action',
          ],
        },
      ],
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_|^React$',
        },
      ],
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }], // Allow info too for now
      'no-empty': 'warn', // Downgrade to warning
      'no-case-declarations': 'warn', // Downgrade to warning
      'no-useless-escape': 'warn', // Downgrade to warning
      'react-hooks/rules-of-hooks': 'warn', // Downgrade to warning (complex issues to fix)
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  // Add Node.js globals for test files (Playwright uses process.env)
  {
    files: ['tests/**/*.{js,jsx}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
];
