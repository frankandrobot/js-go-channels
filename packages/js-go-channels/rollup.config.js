import babel from 'rollup-plugin-babel'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs';
import fs from 'fs'

// .babelrc doesn't exist because it overrides everything and tests
// need a different babel config
const babelrc = JSON.parse(fs.readFileSync('./babelrc.json'))
const babelConfig = Object.assign(
  {
    exclude: 'node_modules/**',
    runtimeHelpers: true,
  },
  babelrc
)

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/index.js',
    format: 'cjs'
  },
  name: 'redux-go-channels',
  plugins: [
    commonjs({
      include: 'node_modules/**',
    }),
    resolve({
      module: true,             
      jsnext: true,
      main: true,
      browser: true,
      modulesOnly: true,
     }),
    babel(babelConfig),
  ],
}
