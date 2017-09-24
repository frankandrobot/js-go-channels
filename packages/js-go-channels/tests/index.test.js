import timer from 'timed-tape'
import tape from 'tape'
import {newChannel, go, select, close} from '../src/scheduler'

const test = timer(tape)


test('go needs a generator', function(t) {
  t.plan(2)
  t.throws(() => go('25'), 'Need a generator')
  t.throws(() => go(function() { return 35 }), 'Need an iterator')
})

test('basic go usage', function(t) {
  t.plan(1)
  const ch = newChannel()
  go(function*() {
    yield ch.put('hello')
  })
  go(function*() {
    const {value: msg} = yield ch.take()
    t.equal(msg, 'hello')
  })
})

test('go with multiple puts', function(t) {
  t.plan(2)
  const ch = newChannel()
  go(function*() {
    yield ch.put('hello')
    yield ch.put('world')
  })
  go(function*() {
    const {value: msg1} = yield ch.take()
    t.equal(msg1, 'hello')
    const {value: msg2} = yield ch.take()
    t.equal(msg2, 'world')
  })
})

test('go with two channels', function(t) {
  t.plan(2)
  const ch1 = newChannel()
  const ch2 = newChannel()
  go(function*() {
    yield ch1.put('hello')
  })
  go(function*() {
    yield ch2.put('world')
  })
  go(function*() {
    const {value: msg1} = yield ch1.take()
    t.equal(msg1, 'hello')
    const {value: msg2} = yield ch2.take()
    t.equal(msg2, 'world')
  })
})

test('go with multiple puts and delayed takes', function(t) {
  t.plan(2)
  const ch = newChannel()
  go(function*() {
    yield ch.put('hello')
  })
  go(function*() {
    yield ch.put('world')
  })
  go(function*() {
    const {value: msg1} = yield ch.take()
    t.equal(msg1, 'hello')
  })
  go(function*() {
    const {value: msg2} = yield ch.take()
    t.equal(msg2, 'world')
  })
})

test('asyncPut works', function(t) {
  t.plan(2)
  const ch = newChannel()
  const ch2 = newChannel()
  ch.asyncPut('before')
  go(function*() {
    const {value: msg} = yield ch.take()
    t.equal(msg, 'before')
  })
  go(function*() {
    const {value: msg} = yield ch2.take()
    t.equal(msg, 'after')
  })
  ch2.asyncPut('after')
})

test('go with timeout', function(t) {
  t.plan(1)
  const c1 = newChannel()
  go(function*() {
    setTimeout(() => c1.asyncPut('one'), 100)
  })
  go(function*() {
    const {value: msg} = yield c1.take()
    t.equal(msg, 'one')
  })
})

test('close should work', function(t) {
  t.plan(6)
  const chan = newChannel()
  go(function*() {
    const {value: val1, done: done1} = yield chan.take(1)
    t.equal(done1, false)
    t.equal(val1, 'hi')
    const {value: val2, done: done2} = yield chan.take(2)
    t.equal(done2, false)
    t.equal(val2, 'good')
    const {value: val3, done: done3} = yield chan.take()
    t.equal(done3, true)
    t.equal(val3, undefined)
  })
  go(function*() {
    yield chan.put('hi')
    yield chan.put('good')
    yield close(chan)
  })
})

test('closing twice throws an error', function(t) {
  t.plan(1)
  const chan = newChannel()
  let err = {}
  go(function*() {
    yield close(chan, 1)
    try {
      yield close(chan, 2)
    } catch(e) {
      err = e
    } finally {
      t.equal(err.message, 'Channel is already closed')
    }
  })
})

test('putting on a closed channel throws an error', function(t) {
  t.plan(1)
  const chan = newChannel()
  let err = {}
  go(function*() {
    yield close(chan)
    try {
      yield chan.put('something')
    } catch (e) {
      err = e
    } finally {
      t.equal(err.message, 'Cannot put on a closed channel')
    }
  })
})

test('async putting on a closed channel throws error', function(t) {
  t.plan(1)
  const chan = newChannel()
  let err = {}
  go(function*() {
    yield close(chan)
    try {
      chan.asyncPut('something')
    } catch (e) {
      err = e
    } finally {
      t.equal(err.message, 'Cannot put on a closed channel')
    }
  })
})

test('async putting before channel closed is fine', function(t) {
  t.plan(2)
  const chan = newChannel()
  chan.asyncPut('something')
  let err = {}
  go(function*() {
    yield close(chan)
    t.equal(1, 1)
  })
  t.equal(1, 1)
})

test('close works with select', function(t) {
  t.plan(2)
  const c1 = newChannel()
  const c2 = newChannel()
  go(function*() {
    yield close(c1)
    yield c2.put('two')
  })
  go(function*() {
    for(let i=1; i<=2; i++) {
      const [val1, val2] = yield select(c1, c2)
      if (typeof val1 !== 'undefined') {
        t.deepEqual(val1, {value: undefined, done: true})
      } else if (typeof val2 !== 'undefined') {
        t.deepEqual(val2, {value: 'two', done: false})
      }
    }
  })
})

test('select', function(t) {
  t.plan(2)
  const c1 = newChannel()
  const c2 = newChannel()
  go(function*() {
    yield c1.put('one')
    yield c2.put('two')
  })
  go(function*() {
    for(let i=1; i<=2; i++) {
      const [val1, val2] = yield select(c1, c2)
      if (typeof val1 !== 'undefined') {
        t.deepEqual(val1, {value: 'one', done: false})
      } else if (typeof val2 !== 'undefined') {
        t.deepEqual(val2, {value: 'two', done: false})
      }
    }
  })
})

test('select roundrobin', function(t) {
  t.plan(2)
  const c1 = newChannel()
  const c2 = newChannel()
  go(function*() {
    yield c1.put('one')
  })
  go(function*() {
    yield c2.put('two')
  })
  go(function*() {
    for(let i=1; i<=2; i++) {
      const [val1, val2] = yield select(c1, c2)
      if (typeof val1 !== 'undefined') {
        t.deepEqual(val1, {value: 'one', done: false})
      } else if (typeof val2 !== 'undefined') {
        t.deepEqual(val2, {value: 'two', done: false})
      }
    }
  })
})

