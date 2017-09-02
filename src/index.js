import "babel-polyfill"

import {BufferItem, LinkedListBuffer, uuid} from './utils'
import {Channel, TakeRequest, PutRequest} from './channel'


/**
 * map of channel messages
 */
const channelBuffers = {}
/**
 * Each goRoutine consists of a
 * - generator
 * - request, which is the current generator value
 * - done, which tells if the goRoutine exited
 */
let goRoutines = []


export function newChannel() {
  const id = uuid()
  channelBuffers[id] = new LinkedListBuffer()
  return new Channel({id})
}

// The dispatcher
// =============================

/**
 * Get the next value and pass an optional returnValue to the
 * generator.
 */
function nextRequest(generator, returnValue) {
  const {value, done} = generator.next(returnValue)
  return {value, done}
}

function processGoRoutines(goRoutines, channelBuffers) {
  goRoutines.forEach((goRoutine, i) => {
    const {generator} = goRoutine
    // The current generator value
    let {request} = goRoutine
    let done 
    // If no request, then get one
    if (!request) {
      const {value, done} = nextRequest(generator)
      Object.assign(goRoutine, {request: value, done})
    }
    // otherwise we "block" i.e., don't get anymore requests until we
    // satisfy the current request
    if (request instanceof TakeRequest) {
      // do we have put data?
      const {chanId} = request
      const channelData = channelBuffers[chanId].pop()
      if (channelData) {
        // Return the value to the generator and get the next request.
        // Yea this is wierd but this is how generators work.
        const {value, done} = nextRequest(generator, channelData)
        Object.assign(goRoutine, {request: value, done})
      }
    } else if (request instanceof PutRequest) {
      // we gots data to give
      const {chanId, msg} = request
      // Store the value in the buffer
      channelBuffers[chanId].add(msg)
      // Then get the next request
      const {value, done} = nextRequest(generator)
      Object.assign(goRoutine, {request: value, done})
    }
  })
}

/**
 * Returns a new array of goRoutines with the dones removed.
 * Note that as per https://jsperf.com/array-filter-performance,
 * Array.filter isn't as performant.
 */
function clearDones(goRoutines) {
  const countDones = goRoutines.reduce(
    (total, goRoutine) => { return goRoutine.done ? total + 1 : total },
    0
  )
  // first handle some simple cases first
  if (!countDones) {
    return goRoutines
  } else if (goRoutines.length === countDones) {
    return []
  }
  // then return a new array with all the done goRoutines removed
  let len = 0
  return goRoutines.reduce(
    (newGoRoutines, goRoutine, i) => {
      if (!goRoutine.done) {
        newGoRoutines[len++] = goRoutine
      }
      return newGoRoutines
    },
    new Array(goRoutines.length - countDones)
  )
}

function runDispatcher() {
  if (goRoutines.length) {
    setTimeout(() => dispatcher(goRoutines, channelBuffers), 0)
  }
}

function dispatcher() {
  processGoRoutines(goRoutines, channelBuffers)
  goRoutines = clearDones(goRoutines)
  // recursively call itself
  runDispatcher(goRoutines, channelBuffers)
}

export function go(iterator) {
  const startDispatcher = goRoutines.length === 0
  goRoutines.push({
    generator: iterator(),
    request: undefined,
  })
  // if we didn't have any goRoutines, then restart the dispatcher
  runDispatcher()
}
