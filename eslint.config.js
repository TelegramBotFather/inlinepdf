import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores([
    'dist',
    '.cloudflare',
    '.wrangler',
    '.react-router',
    'node_modules',
    'build',
    'worker-configuration.d.ts',
  ]),
  {
    name: 'ts/base',
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      eslintConfigPrettier,
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'lucide-react',
              message:
                'Use @hugeicons/react with @hugeicons/core-free-icons instead.',
            },
            {
              name: '@radix-ui/react-icons',
              message:
                'Use @hugeicons/react with @hugeicons/core-free-icons instead.',
            },
            {
              name: '@heroicons/react',
              message:
                'Use @hugeicons/react with @hugeicons/core-free-icons instead.',
            },
            {
              name: '@tabler/icons-react',
              message:
                'Use @hugeicons/react with @hugeicons/core-free-icons instead.',
            },
            {
              name: '@fortawesome/react-fontawesome',
              message:
                'Use @hugeicons/react with @hugeicons/core-free-icons instead.',
            },
          ],
          patterns: [
            {
              group: ['react-icons/*', '@heroicons/*'],
              message:
                'Use @hugeicons/react with @hugeicons/core-free-icons instead.',
            },
          ],
        },
      ],
    },
  },
  {
    name: 'ts/tests',
    files: ['**/*.test.{ts,tsx}', 'app/test/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.vitest,
      },
    },
  },
  {
    name: 'ts/routes',
    files: ['app/routes/**/*.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
]);
