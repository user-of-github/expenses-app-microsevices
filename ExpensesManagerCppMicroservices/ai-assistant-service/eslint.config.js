import stylisticJs from '@stylistic/eslint-plugin-js';
import stylisticTs from '@stylistic/eslint-plugin-ts';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import perfectionist from 'eslint-plugin-perfectionist';

// Library imports first, then local. Types stay inside their own lib/local group.
const sortImports = ['error', {
  type: 'natural',
  order: 'asc',
  ignoreCase: true,
  newlinesBetween: 1,
  internalPattern: ['^~/.+', '^@/.+', '^#.+'],
  groups: [
    'builtin',
    'external',
    'internal',
    ['parent', 'sibling', 'index'],
    'side-effect',
    'unknown'
  ]
}];

export default [
  {
    ignores: ['**/build/*', '**/node_modules/*', '**/dist/*', 'package*.json']
  },
  {
    files: ['**/*.js', '**/*.cjs', '**/*.mjs', '**/*.ts', '**/*.mts', '**/*.cts'],
    plugins: {
      '@stylistic/js': stylisticJs,
      perfectionist
    },
    rules: {
      '@stylistic/js/max-len': ['warn', 135],
      'perfectionist/sort-imports': sortImports
    }
  },
  {
    files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
    rules: {
      '@stylistic/js/indent': ['warn', 2, { SwitchCase: 1 }],
      '@stylistic/js/quotes': ['warn', 'single'],
      '@stylistic/js/semi': ['warn', 'always'],
      '@stylistic/js/comma-dangle': ['warn', 'never']
    }
  },
  {
    files: ['**/*.ts', '**/*.mts', '**/*.cts'],
    languageOptions: {
      parser: tsParser
    },
    plugins: {
      '@stylistic/ts': stylisticTs,
      '@typescript-eslint': tsPlugin
    },
    rules: {
      '@stylistic/ts/indent': ['warn', 2, { SwitchCase: 1 }],
      '@stylistic/ts/quotes': ['warn', 'single'],
      '@stylistic/ts/semi': ['warn', 'always'],
      '@stylistic/ts/comma-dangle': ['warn', 'never'],
      '@typescript-eslint/consistent-type-imports': ['error', {
        prefer: 'type-imports',
        fixStyle: 'separate-type-imports',
        disallowTypeAnnotations: true
      }]
    }
  }
];