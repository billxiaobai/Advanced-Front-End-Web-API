import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';

export default [
  {
    input: 'Tool/Toolbox.js',
    output: {
      file: 'dist/toolbox.cjs',
      format: 'cjs',
      exports: 'auto'
    },
    plugins: [nodeResolve(), commonjs(), json()]
  },
  {
    input: 'Tool/Toolbox.js',
    output: {
      file: 'dist/toolbox.mjs',
      format: 'esm'
    },
    plugins: [nodeResolve(), commonjs(), json()]
  }
];
