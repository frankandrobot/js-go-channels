/*
 * Copyright 2017  Uriel Avalos
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {LinkedListBuffer, uuid, checkGenerator} from './utils'


export const initialStateFn = () => ({
  /**
   * map of active channels
   */
  channels: {},
  dataProducers: {},
  dataConsumers: {},
  /**
   * map of last selected channels
   */
  lastSelected: {},
  /**
   * array of range requests
   */
  rangeRequests: [],
})

const state = initialStateFn()

const cTakeRequest = 'take'
const cPutRequest = 'put'
const cCloseRequest = 'close'
const cSelectRequest = 'select'

const putCloseError = new Error('Cannot put on a closed channel')

const dummyIterator = () => ({
  next: () => ({value: undefined, done: true}),
  throw: () => ({value: undefined, done: true}),
  return: () => ({value: undefined, done: true}),
})

/**
 * Does what it says. Need to take into account the case when the
 * consumer is a pending select, pending take. `select`s have a
 * different signature.
 * @param {Object} consumer - the consumer and message that was queued
 * @param {Iterator} consumer.iterator
 * @param {string} consumer.type - the consumer's message type
 * @param {Object} consumer.payload - the consumer's message payload
 * @param {Object} message - the message to give to the consumer
 * @param {Object} extraArgs
 * @param {string} extraArgs.chanId
 * @returns {[Iterator, Message]}
 */
function _createConsumerMessage(consumer, message, {chanId}) {
  const {
    iterator: consumerIterator,
    type: requestType,
    payload
  } = consumer
  if (requestType === cSelectRequest) {
    const {selectedChanIds} = payload
    const i = selectedChanIds.indexOf(chanId)
    const response = new Array(selectedChanIds.length)
    response[i] = message
    return [consumerIterator, response]
  } else if (requestType === cTakeRequest) {
    return [consumerIterator, message]
  }
  throw new Error(`Unknown request type ${requestType}`)
}

function _addConsumer(
  {
    dataConsumers,
    chanId,
    consumer: {
      iterator,
      requestType,
      payload,
    },
  },
) {
  dataConsumers[chanId].add({
    iterator,
    type: requestType,
    payload,
  })
}

function scheduler(
  {
    state: {
      dataProducers,
      dataConsumers,
      channels,
      lastSelected,
    },
    generator: {
      iterator,
      request,
    },
    stopScheduler
  },
) {
  // Give the iterator the iteratorMessage and pass the result to the
  // scheduler
  const nextTick = (iterator, iteratorMessage) => {
    const {
      value: request,
      done: stopScheduler,
    } = iterator.next(iteratorMessage)
    setTimeout(
      () => scheduler({
        state: {dataProducers, dataConsumers, channels, lastSelected},
        generator: {
          iterator,
          request,
        },
        stopScheduler,
      }),
      0
    )
  }
  // Give the iterator the error and pass the result to the scheduler
  const nextTickThrow = (iterator, error) => {
    const {
      value: request,
      done: stopScheduler,
    } = iterator.throw(error)
    setTimeout(
      () => scheduler({
        state: {dataProducers, dataConsumers, channels, lastSelected},
        generator: {
          iterator,
          request,
        },
        stopScheduler,
      }),
      0
    )
  }
  // if no request, then at start of generator, so get one
  if (!request && !stopScheduler) {
    return nextTick(iterator)
  }
  // if this generator is done, then goodbye
  if (stopScheduler) {
    return
  }
  const {type: requestType, chanId, payload} = request
  switch(requestType) {
  case cTakeRequest: {
    // check if the channel is closed
    if (!channels[chanId]) {
      // if the channel is closed (buffer doesn't exist), then pass
      // back undefined, done = true to the iterator.
      return nextTick(iterator, {value: undefined, done: true})
    }
    // do we have any sleeping data producers?
    const producer = dataProducers[chanId].pop()
    if (producer) {
      const {iterator: producerIterator, payload: {msg}} = producer
      // give this iterator the msg
      nextTick(iterator, {value: msg, done: false})
      // also wake up the data producer
      nextTick(producerIterator)
    } else {
      // add ourselves to the waiting list and hopefully we'll be
      // woken up in the future
      _addConsumer({
        dataConsumers,
        chanId,
        consumer: {
          iterator,
          requestType,
          payload,
        },
      })
    }
    return
  }
    // select returns the first data producer that fires. Sends back
    // an array to the iterator. Just fire the first channel that
    // receives a message: go thru the selected channels and try to
    // get values. stop at the first that has a value.
  case cSelectRequest: {
    const {selectedChanIds} = payload
    const lastSelectedId = `${iterator.__goId}:${selectedChanIds}`
    let chanData = null
    let producer = null
    // mod by the number of selected channels so that we never get an
    // out-of-bounds exception
    const unboundedLastSelected =
          typeof lastSelected[lastSelectedId] !== 'undefined'
          ? lastSelected[lastSelectedId]
          : -1
    const last = (unboundedLastSelected + 1) % selectedChanIds.length
    delete lastSelected[lastSelectedId]
    // do we have any sleeping producers? but start from the last selected
    for(let i=last; i<selectedChanIds.length; i++) {
      const _chanId = selectedChanIds[i]
      if (!channels[_chanId]) {
        // if channel was closed then send undefined
        chanData = {value: undefined, done: true, chanNum: i}
        break
      } 
      producer = dataProducers[_chanId].pop()
      if (producer) {
        const {payload: {msg}} = producer
        chanData = {value: msg, done: false, chanNum: i}
        break
      }
    }
    if (chanData) {
      // set last selected
      lastSelected[lastSelectedId] = chanData.chanNum
      // wake up the producer
      producer && nextTick(producer.iterator)
      const response = new Array(selectedChanIds.length)
      response[chanData.chanNum] = {
        value: chanData.value,
        done: chanData.done
      }
      nextTick(iterator, response)
    } else {
      // There were no sleeping producers, so add ourselves to the
      // waiting list of all the non-closed producers.
      for(let i=0; i<selectedChanIds.length; i++) {
        if (dataConsumers[selectedChanIds[i]]) {
          _addConsumer({
            dataConsumers,
            chanId: selectedChanIds[i],
            consumer: {
              iterator,
              requestType,
              payload,
            },
          })
        }
      }
    }
    return
  }
  case cPutRequest: {
    // First check if the channel is closed.
    if (!channels[chanId]) {
      nextTickThrow(iterator, putCloseError)
      return
    }
    const {msg} = payload
    // do we have any takers?
    const consumer = dataConsumers[chanId].pop()
    if (consumer) {
      nextTick(iterator)
      nextTick(..._createConsumerMessage(
        consumer,
        {value: msg, done: false},
        {chanId}
      ))
    } else {
      // let's wait for a data consumer
      dataProducers[chanId].add({iterator, payload, type: requestType})
    }
    return
  }
  }
}

export function go(generator) {
  const iterator = checkGenerator(generator)
  iterator.__goId = uuid()
  // so `go` kicks off the scheduler
  scheduler({
    state,
    generator: {
      iterator,
      request: undefined,
      done: false,
    }
  })
}

export function newChannel() {
  const {channels, dataProducers, dataConsumers} = state
  const chanId = uuid()
  channels[chanId] = true
  dataProducers[chanId] = new LinkedListBuffer()
  dataConsumers[chanId] = new LinkedListBuffer()
  const channel = {
    get _id() {
      return chanId
    },
    take(_msgId) {
      return {
        chanId,
        type: cTakeRequest,
        payload: {}
      }
    },
    put(msg) {
      return {
        chanId,
        type: cPutRequest,
        payload: {msg},
      }
    },
    asyncPut(msg) {
      if (!channels[chanId]) {
        throw putCloseError
      }
      scheduler({
        state,
        generator: {
          // pass a dummyIterator. We don't care about any errors that
          // may happen down the road, nor do we need any messages
          // from the scheduler
          iterator: dummyIterator(),
          request: channel.put(msg)
        },
        stopScheduler: false
      })
    },
  }
  return channel
}

export function close(channel, _msgId) {
  const {channels, dataProducers, dataConsumers} = state
  const chanId = channel._id
  if (!channels[chanId]) {
    throw new Error('Channel is already closed')
  }
  // turn off channel
  delete channels[chanId]
  // awaken any pending consumers, now that the channel is closed
  const consumers = dataConsumers[chanId]
  let consumer = consumers.pop()
  while(consumer) {
    const {iterator, type, payload} = consumer
    const request = {chanId, type, payload}
    scheduler({
      state,
      generator: {
        iterator,
        request,
      }
    })
    consumer = consumers.pop()
  }
  delete dataConsumers[chanId]
  // hope we don't have pending producers
  const producers = dataProducers[chanId]
  let producer = producers.pop()
  while(producer) {
    const {iterator} = producer
    const {
      value: request,
      done: stopScheduler,
    } = iterator.throw(putCloseError)
    scheduler({
      state,
      generator: {
        iterator,
        request,
      },
      stopScheduler,
    })
    producer = producers.pop()
  }
  delete dataProducers[chanId]
  return
}

export function select(...channels) {
  return {
    type: cSelectRequest,
    payload: {selectedChanIds: channels.map(x => x._id) || []},
  }
}

export function range(channel) {
  return {
    // This actually registers the callback
    forEach(callback) {
        // Internally, it's an iterator
      const iterator = Object.assign(
        dummyIterator(),
        {
          next: ({value, done}) => {
            if (done) {
              // tell the scheduler we're done and don't update
              // callback
              return {value: undefined, done: true}
            }
            // pass the value to the callback
            const unsub = callback(value)
            if (unsub === false) {
              // tell the scheduler we're done if callback requests to
              // unsubscribe
              return {value: undefined, done: true}
            }
            // tell the scheduler that the next request is for another
            // take
            return {value: channel.take(), done: false}
          }
        }
      )
      // queue self
      scheduler({
        state,
        generator: {
          iterator,
          request: channel.take()
        },
        stopScheduler: false
      })
    }
  }
}
