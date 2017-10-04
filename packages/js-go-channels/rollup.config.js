/*
 * Copyright 2017  Uriel Avalos
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import fs from 'fs'
import path from 'path'
import babel from 'rollup-plugin-babel'
import resolve from 'rollup-plugin-node-resolve'
import sourcemaps from 'rollup-plugin-sourcemaps'
import commonjs from 'rollup-plugin-commonjs';

const babelrc = JSON.parse(fs.readFileSync(path.join(__dirname, '.babelrc')))
const babelConfig = babelrc.env['legacy-rollup-umd']

babelConfig.exclude = 'node_modules/**'
babelConfig.runtimeHelpers = true

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/legacy-umd/index.js',
    format: 'umd'
  },
  name: 'js-go-channels',
  sourcemap: true,
  plugins: [
    sourcemaps(),
    babel(babelConfig),
    resolve(),
    commonjs(),
  ],
}
