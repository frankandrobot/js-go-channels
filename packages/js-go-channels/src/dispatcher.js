import {TakeRequest, PutRequest} from './channel'
import {SelectRequest} from './select'


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
    const {iterator} = goRoutine
    // The current iterator value
    let {request} = goRoutine
    // If no request, then get one
    if (!request) {
      const {value, done} = nextRequest(iterator)
      Object.assign(goRoutine, {request: value, done})
    }
    // otherwise we "block" i.e., don't get anymore requests until we
    // satisfy the current request
    if (request instanceof TakeRequest) {
      // do we have put data?
      const {chanId} = request
      const channelData = channelBuffers[chanId].pop()
      if (channelData) {
        // Return the value to the iterator i.e., whoever made the
        // take request and get the next request. Yea this is wierd
        // but this is how iterators work.
        const {value, done} = nextRequest(iterator, {value: channelData})
        Object.assign(goRoutine, {request: value, done})
      }
    } else if (request instanceof PutRequest) {
      // we gots data to give
      const {chanId, msg} = request
      // Store the value in the buffer
      channelBuffers[chanId].add(msg)
      // Then get the next request
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
        const {value, done} = nextRequest(iterator, {value: channelData})
        Object.assign(goRoutine, {request: value, done})
      }
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
