import "babel-polyfill"

import {BufferItem, LinkedListBuffer, uuid} from './utils'
import {Channel, TakeRequest, PutRequest} from './channel'
import {select} from './select'
import {close} from './close'
import {runDispatcher, initialStateFn} from './dispatcher'


const state = initialStateFn()

export function newChannel() {
  const {channelBuffers} = state
  const id = uuid()
  channelBuffers[id] = new LinkedListBuffer()
  return new Channel({id, channelBuffers})
}

export function go(generator) {
  // check if generator
  if (!generator || typeof generator !== 'function' ) {
    throw new Error('Need a generator');
  }
  const iterator = generator()
  if (!iterator || typeof iterator[Symbol.iterator] !== 'function' ) {
    throw new Error('Need an iterator');
  }
  const {goRoutines} = state
  const startDispatcher = goRoutines.length === 0
  goRoutines.push({
    iterator,
    request: undefined,
  })
  // if we didn't have any goRoutines, then restart the dispatcher
  runDispatcher(state)
}

export function range(channel) {
  const {rangeRequests} = state
  rangeRequests
  return {
    forEach(onNext, onError, onCompleted) {
      next(fn(...args), { onNext, onError, onCompleted });
    }
  }
}

export {
  select,
  close,
}
