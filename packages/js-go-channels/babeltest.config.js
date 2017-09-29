const fs = require('fs')
const path = require('path')
const babelrcs = JSON.parse(fs.readFileSync(path.join(__dirname, '.babelrc')))
// use the legacy-node environment
const babelrc = babelrcs.env['legacy']
// register babel on all test files
require('babel-register')(babelrc)
