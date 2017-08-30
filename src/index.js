import "babel-polyfill"

function *chanId() {
  let chanId = 0
  for(;;) {
    yield ++chanId
  }
}

const chanIds = chanId()
const channels = {}
const goRoutines = []

class Channel {
  constructor() {
    this.id = chanIds.next().value
  }

  take() {
    return new TakeRequest(this)
  }

  put(msg) {
    return new PutRequest(this, msg)
  }
}

class TakeRequest {
  constructor(chan) {
    this.chan = chan
  }
}

class PutRequest {
  constructor(chan, msg) {
    this.chan = chan
    this.msg = msg
  }
}

function dispatcher(channels) {
  goRoutines.forEach((goRoutine, i) => {
    const {generator} = goRoutine
    let {request} = goRoutine
    // if no request, then get one
    if (!request) {
      request = generator.next().value
      Object.assign(goRoutine, {request})
    }
    // otherwise we "block" i.e., don't get anymore requests until we
    // satisfy the current request
    const {chan: {id} = {}, msg} = request || {}
    if (request instanceof TakeRequest) {
      // do we have put data?
      const channelData = channels[id]
      if (channelData) {
        // give the data to the generator and get the next request
        request = generator.next(channelData).value
        Object.assign(goRoutine, {request})
      }
    } else if (request instanceof PutRequest) {
      // we gots data to give
      channels[id] = msg
      request = generator.next().value
      if (request) {
        Object.assign(goRoutine, {request})
      }
    }
  })
  if (goRoutines.length) {
    setTimeout(() => dispatcher(channels), 0)
  }
}

setTimeout(() => dispatcher(channels), 0)

function go(iterator) {
  goRoutines.push({
    generator: iterator(),
  })
}

// test
const ch = new Channel()

go(function*() {
  yield ch.put('hello')
})

go(function*() {
  const msg = yield ch.take()
  console.log(msg)
})
