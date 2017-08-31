import test from 'tape'
import {newChannel, go} from '../src/index'


test('basic go usage', function(t) {
  t.plan(1)
  const ch = newChannel()
  go(function*() {
    yield ch.put('hello')
  })
  go(function*() {
    const msg = yield ch.take()
    t.equal(msg, 'hello')
  })
})

test('multiple puts', function(t) {
  t.plan(2)
  const ch = newChannel()
  go(function*() {
    yield ch.put('hello')
    yield ch.put('world')
  })

  go(function*() {
    const msg1 = yield ch.take()
    t.equal(msg1, 'hello')
    const msg2 = yield ch.take()
    t.equal(msg2, 'world')
  })
})
