const packageJson = require('./package.json');
const devDependencies = Object.keys(packageJson.devDependencies || {});

module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2020: true,
    'jest/globals': true,
    node: true,
  },
  plugins: ['jest'],
  extends: ['eslint:recommended', 'plugin:jest/all', 'plugin:node/recommended'],
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 11,
  },
  rules: {
    'linebreak-style': ['error', 'unix'],
    quotes: ['error', 'single'],
    semi: ['error', 'always'],
    'quote-props': ['error', 'as-needed'],
    'comma-dangle': ['error', 'always-multiline'],
    'no-var': 'error',
    'node/no-unpublished-require': [
      'error',
      {
        allowModules: devDependencies,
      },
    ],
  },
};
