import "babel-polyfill"

import {BufferItem, LinkedListBuffer, uuid} from './utils'
import {Channel, TakeRequest, PutRequest} from './channel'
import {runDispatcher} from './dispatcher'


const state = {
  /**
   * map of channel messages
   */
  channelBuffers: {},
  /**
   * Each goRoutine consists of a
   * - generator
   * - request, which is the current generator value
   * - done, which tells if the goRoutine exited
   */
  goRoutines: [],
}

export function newChannel() {
  const {channelBuffers} = state
  const id = uuid()
  channelBuffers[id] = new LinkedListBuffer()
  return new Channel({id})
}

export function go(iterator) {
  const {goRoutines} = state
  const startDispatcher = goRoutines.length === 0
  goRoutines.push({
    generator: iterator(),
    request: undefined,
  })
  // if we didn't have any goRoutines, then restart the dispatcher
  runDispatcher(state)
}
