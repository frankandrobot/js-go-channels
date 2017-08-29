import babel from 'rollup-plugin-babel'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs';

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
      //modulesOnly: true,
    }),
    babel({
      exclude: 'node_modules/**',
    }),
  ],
}
