import {TakeRequest, PutRequest} from './channel'
import {SelectRequest} from './select'
import {CloseChannelRequest} from './close'


/**
 * Get the next value and pass an optional returnValue to the
 * iterator.
 */
function nextRequest(iterator, returnValue) {
  const {value, done} = iterator.next(returnValue)
  return {value, done}
}

function processGoRoutines(
  {goRoutines, lastSelectedChannel, channelBuffers},
) {
  goRoutines.forEach((goRoutine, i) => {
    const {iterator, done} = goRoutine
    if (done) {
      return
    }
    // The current iterator value
    let {request} = goRoutine
    // If no request, then get one
    if (!request) {
      const {value, done} = nextRequest(iterator)
      Object.assign(goRoutine, {request: value, done})
      request = value
    }
    // otherwise we "block" i.e., don't get anymore requests until we
    // satisfy the current request
    if (request instanceof TakeRequest) {
      const {chanId} = request
      // check if the channel is closed
      if (!channelBuffers[chanId]) {
        // if the channel is closed (buffer doesn't exist), then send
        // back undefined, done = true.
        const {value, done} = nextRequest(iterator, {value: undefined, done: true})
        Object.assign(goRoutine, {request: value, done})
        return
      }
      // do we have put data?
      const channelData = channelBuffers[chanId].pop()
      if (channelData) {
        // Return the value to the iterator i.e., whoever made the
        // take request and get the next request. Yea this is wierd
        // but this is how iterators work.
        const {value, done} = nextRequest(iterator, {value: channelData, done: false})
        Object.assign(goRoutine, {request: value, done})
      }
    } else if (request instanceof PutRequest) {
      const {chanId, msg} = request
      // First check if the channel is closed.
      if (!channelBuffers[chanId]) {
        const {value, done} = iterator.throw(new Error('Cannot put on a closed channel'))
        Object.assign(goRoutine, {request: value, done})
        return
      }
      // Otherwise, we gots data to give, so store the value in the
      // buffer.
      channelBuffers[chanId].add(msg)
      // Then get the next request.
      const {value, done} = nextRequest(iterator)
      Object.assign(goRoutine, {request: value, done})
    } else if (request instanceof SelectRequest) {
      const {channels} = request
      const lastChannel = lastSelectedChannel[channels] || 0
      delete lastSelectedChannel[channels]
      // Just fire the first channel that receives a message: go thru
      // the selected channels and try to get values.  stop at the
      // first that has a value.  The problem is that a chatty
      // goroutine can drown out other channels. So next time we get
      // the same reselect, we need to pickup where we left off. 
      const channelData = new Array(channels.length)
      let hasData = false
      for(let i=lastChannel; i<channelData.length; i++) {
        const chanId = channels[i]._id
        const data = channelBuffers[chanId].pop()
        if (typeof data !== 'undefined') {
          channelData[i] = data
          hasData = true
          if (i < channelData.length - 1) {
            lastSelectedChannel[channels] = i + 1
          }
          break
        }
      }
      if (hasData) {
        const {value, done} = nextRequest(iterator, {value: channelData, done: false})
        Object.assign(goRoutine, {request: value, done})
      }
    } else if (request instanceof CloseChannelRequest) {
      const {channel} = request;
      const buffer = channelBuffers[channel._id]
      if (!buffer) {
        const {value, done} = iterator.throw(new Error('Channel is already closed'))
        Object.assign(goRoutine, {request: value, done})
        return
      }
      // delete the buffer
      delete channelBuffers[channel._id]
      // clear out the data
      while(buffer.pop()) { buffer.pop() }
      // then get the next request
      const {value, done} = nextRequest(iterator)
      Object.assign(goRoutine, {request: value, done})
    }
  })
}

/**
 * Returns a new array of goRoutines with the dones removed.
 * Note that as per https://jsperf.com/array-filter-performance,
 * Array.filter isn't as performant.
 */
function clearDones(state) {
  const countDones = state.goRoutines.reduce(
    (total, goRoutine) => { return goRoutine.done ? total + 1 : total },
    0
  )
  // first handle some simple cases first
  if (!countDones) {
    return
  } else if (state.goRoutines.length === countDones) {
    state.goRoutines = []
    state.lastSelectedChannel = {}
    return
  }
  // then return a new array with all the done goRoutines removed
  let len = 0
  state.goRoutes = state.goRoutines.reduce(
    (newGoRoutines, goRoutine, i) => {
      if (!goRoutine.done) {
        newGoRoutines[len++] = goRoutine
      }
      return newGoRoutines
    },
    new Array(state.goRoutines.length - countDones)
  )
  state.lastSelectedChannel = {}
}

function dispatcher(state) {
  processGoRoutines(state)
  clearDones(state)
  // recursively call itself
  runDispatcher(state)
}

/**
 * @param {array[]} state.goRoutines
 * @param {map} state.channelBuffers
 */
export function runDispatcher(state) {
  const {goRoutines} = state
  if (goRoutines.length) {
    setTimeout(() => dispatcher(state), 0)
  }
}
