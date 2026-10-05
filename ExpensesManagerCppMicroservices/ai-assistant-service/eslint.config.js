import stylisticJs from '@stylistic/eslint-plugin-js';
import babelParser from '@babel/eslint-parser';

export default [
  {
    plugins: {
      '@stylistic/js': stylisticJs,
    },
    files: ['**/*.js', '**/*.cjs', '**/*.mjs', '**/*.ts', '**/*.mts', '**/*.cts'],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: ['@babel/preset-typescript'],
        },
      },
    },
    rules: {
      indent: ['warn', 2, { SwitchCase: 1 }],
      quotes: ['warn', 'single'],
      semi: ['warn', 'always'],
      'max-len': ['warn', 135],
      'comma-dangle': ['warn', 'never'],
    },
    ignores: ['**/build/*', '**/node_modules/*', '**/dist/*', 'package*.json'],
  },
];
