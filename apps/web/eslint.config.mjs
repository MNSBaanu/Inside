import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { FlatCompat } from '@eslint/eslintrc';

const require = createRequire(import.meta.url);
const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
  resolvePluginsRelativeTo: dirname(
    require.resolve('eslint-config-next/package.json'),
  ),
});

const config = [
  { ignores: ['.next/**', '.next-*/**', 'node_modules/**', '.turbo/**'] },
  ...compat.extends('next/core-web-vitals'),
];

export default config;
