import {TakeRequest, PutRequest} from './channel'


/**
 * Get the next value and pass an optional returnValue to the
 * generator.
 */
function nextRequest(generator, returnValue) {
  const {value, done} = generator.next(returnValue)
  return {value, done}
}

function processGoRoutines({goRoutines, channelBuffers}) {
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

function dispatcher(state) {
  processGoRoutines(state)
  state.goRoutines = clearDones(state.goRoutines)
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
