const fs = require('fs')
// .babelrc doesn't exist because it overrides everything and tests
// need a different babel config
const babelrc = JSON.parse(fs.readFileSync('./babelrc.json'))
const mainSetings = babelrc.presets[0][1]
Object.assign(
  mainSetings,
  {
    modules: 'commonjs',
  }
)
babelrc.plugins = []

require('babel-polyfill')
require('babel-register')(babelrc)
