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

import { LinkedListBuffer, uuid, checkGenerator } from "./utils";

interface ChannelTakeRequest {
  chanId: string;
  type: "take";
  payload: undefined;
}

interface ChannelPutRequest<Data> {
  chanId: string;
  type: "put";
  payload: { msg: Data };
}

interface ChannelSelectRequest {
  chanId?: undefined;
  type: "select";
  payload: {
    selectedChanIds: string[];
  };
}

interface ChannelCloseRequest {
  chanId: string;
  type: "close";
  payload: undefined;
}

type ChannelYieldRequest<Data> =
  | ChannelTakeRequest
  | ChannelPutRequest<Data>
  | ChannelSelectRequest
  | ChannelCloseRequest;

interface Channel<Data> {
  readonly _id: string;

  take(): ChannelTakeRequest;

  put(msg: Data): ChannelPutRequest<Data>;

  asyncPut(msg: Data): void;
}

/**
 * What goes into the "next" value of the iterator
 */
type GoNextGenerator<Data> = IteratorResult<Data, Data>;

type GoGenerator<Data> = Generator<
  ChannelYieldRequest<Data> | void, // yield result
  void, // return type
  any // TODO next arguments
> & { __goId?: string };

type GoIterator<Data> = Iterator<
  ChannelYieldRequest<Data>, // yield result
  void, // return type
  any // TODO next arguments
> & { __goId?: string };

/**
 * "consumers" are generators that "take"/"select" from the channel
 */
type Consumer<Data> = (ChannelTakeRequest | ChannelSelectRequest) & {
  iterator: GoGenerator<Data>;
};

interface Consumers<Data> {
  [key: string]: LinkedListBuffer<Consumer<Data>>;
}

/**
 * "producers" are generators that "put" into the channel.
 */
type Producer<Data> = ChannelPutRequest<Data> & {
  iterator: GoGenerator<Data>;
};

interface Producers<Data> {
  [key: string]: LinkedListBuffer<Producer<Data>>;
}

interface State {
  /**
   * map of active channels
   */
  channels: { [id: string]: true };

  dataProducers: Producers<any>;
  dataConsumers: Consumers<any>;

  /**
   * map of last selected channels
   */
  lastSelected: { [id: string]: number };

  /**
   * array of range requests
   */
  rangeRequests?: [];
}

const tag = "[js-go-channels]";

export const initialStateFn = (): State => ({
  channels: {},
  dataProducers: {},
  dataConsumers: {},
  lastSelected: {},
  rangeRequests: [],
});

const state = initialStateFn();

const putCloseError = new Error("Cannot put on a closed channel");
const closeError = new Error("Channel already closed");

const dummyIterator = function* () {};

/**
 * Does what it says. Need to take into account the case when the
 * consumer is a pending select, pending take. `select`s have a
 * different signature.
 */
function _createConsumerMessage<Data, Message>(
  consumer: Consumer<Data>,
  message: { value: Message; done: false },
  chanId: string
) {
  const { iterator: consumerIterator, type: requestType, payload } = consumer;

  switch (requestType) {
    case "select": {
      const { selectedChanIds } = payload;
      const i = selectedChanIds.indexOf(chanId);
      const response: Array<{ value: Message; done: false }> = new Array(
        selectedChanIds.length
      );
      response[i] = message;
      return [consumerIterator, response] as const;
    }
    case "take": {
      return [consumerIterator, message] as const;
    }
  }
}

function _addConsumer<Data>({
  dataConsumers,
  chanId,
  consumer: { iterator, type, payload },
}: {
  dataConsumers: Consumers<Data>;
  chanId: string;
  consumer: Consumer<Data>;
}) {
  dataConsumers[chanId]?.add({
    chanId,
    iterator,
    type,
    payload,
  } as Consumer<Data>);
}

function scheduler<Data>({
  state: { dataProducers, dataConsumers, channels, lastSelected },
  generator: { iterator, yieldRequest },
  stopScheduler,
}: {
  state: State;
  generator: {
    iterator: GoGenerator<Data>;
    yieldRequest: ChannelYieldRequest<Data> | void;
    done?: false;
  };
  stopScheduler?: boolean | undefined;
}) {
  // Give the iterator the iteratorMessage and pass the result to the
  // scheduler
  const nextTick = (
    iterator: GoGenerator<Data>,
    // TODO any
    iteratorMessage?: any
  ) => {
    const { value: yieldRequest, done: stopScheduler } =
      iterator.next(iteratorMessage);

    console.debug(tag, `go: ${iterator.__goId}`, "message received", {
      yieldRequest,
      stopScheduler,
    });

    setTimeout(
      () =>
        scheduler({
          state: { dataProducers, dataConsumers, channels, lastSelected },
          generator: {
            iterator,
            yieldRequest,
          },
          stopScheduler,
        }),
      0
    );
  };

  // Give the iterator the error and pass the result to the scheduler
  const nextTickThrow = (iterator: GoGenerator<Data>, error: unknown) => {
    const { value: yieldRequest, done: stopScheduler } =
      iterator.throw?.(error) ?? {};

    setTimeout(
      () =>
        scheduler({
          state: { dataProducers, dataConsumers, channels, lastSelected },
          generator: {
            iterator,
            yieldRequest,
          },
          stopScheduler,
        }),
      0
    );
  };

  // if no yield request, then at start of generator, so get one
  if (!yieldRequest && !stopScheduler) {
    console.debug(tag, `go: ${iterator.__goId}`, "asking for first message");
    return nextTick(iterator);
  }
  // if this generator is done, then goodbye
  if (stopScheduler || !yieldRequest) {
    console.debug(tag, `go: ${iterator.__goId}`, "stopping scheduler");
    return;
  }

  const { type: requestType, chanId, payload } = yieldRequest;

  switch (requestType) {
    case "take": {
      // check if the channel is closed
      if (!channels[chanId]) {
        // if the channel is closed (buffer doesn't exist), then pass
        // back undefined, done = true to the iterator.
        return nextTick(iterator, { value: undefined, done: true });
      }

      // do we have any sleeping data producers?
      const producer = dataProducers[chanId]?.pop();

      if (producer) {
        const {
          iterator: producerIterator,
          payload: { msg },
        } = producer;

        // give this iterator the msg
        nextTick(iterator, { value: msg, done: false });
        // also wake up the data producer
        nextTick(producerIterator);
      } else {
        // add ourselves to the waiting list and hopefully we'll be
        // woken up in the future
        _addConsumer({
          dataConsumers,
          chanId,
          consumer: {
            chanId,
            iterator,
            type: requestType,
            payload,
          },
        });
      }
      return;
    }

    // select returns the first data producer that fires. Sends back
    // an array to the iterator. Just fire the first channel that
    // receives a message: go thru the selected channels and try to
    // get values. stop at the first that has a value.
    case "select": {
      const { selectedChanIds } = payload;
      const lastSelectedId = `${iterator.__goId}:${selectedChanIds}`;

      let chanData: {
        value: undefined;
        done: boolean;
        chanIndex: number;
      } | null = null;

      let producer = null;

      // mod by the number of selected channels so that we never get an
      // out-of-bounds exception
      const unboundedLastSelected =
        typeof lastSelected[lastSelectedId] !== "undefined"
          ? lastSelected[lastSelectedId] ?? -1
          : -1;

      const last = (unboundedLastSelected + 1) % selectedChanIds.length;
      delete lastSelected[lastSelectedId];

      // do we have any sleeping producers? but start from the last selected
      for (let i = last; i < selectedChanIds.length; i++) {
        const _chanId = selectedChanIds[i]!;

        if (!channels[_chanId]) {
          // if channel was closed then send undefined
          chanData = { value: undefined, done: true, chanIndex: i };
          break;
        }

        producer = dataProducers[_chanId]?.pop();

        if (producer) {
          const {
            payload: { msg },
          } = producer;
          chanData = { value: msg, done: false, chanIndex: i };
          break;
        }
      }

      if (chanData) {
        // set last selected
        lastSelected[lastSelectedId] = chanData.chanIndex;
        // wake up the producer
        producer && nextTick(producer.iterator);
        const response: Array<Pick<typeof chanData, "done" | "value">> =
          new Array(selectedChanIds.length);

        response[chanData.chanIndex] = {
          value: chanData.value,
          done: chanData.done,
        };
        nextTick(iterator, response);
      } else {
        // There were no sleeping producers, so add ourselves to the
        // waiting list of all the non-closed producers.
        for (const selectedChanId of selectedChanIds) {
          if (dataConsumers[selectedChanId]) {
            _addConsumer({
              dataConsumers,
              chanId: selectedChanId,
              consumer: {
                iterator,
                type: requestType,
                payload: { selectedChanIds },
              },
            });
          }
        }
      }
      return;
    }

    case "put": {
      // First check if the channel is closed.
      if (!channels[chanId]) {
        nextTickThrow(iterator, putCloseError);
        return;
      }

      const { msg } = payload;
      // do we have any takers?
      const consumer = dataConsumers[chanId]?.pop();

      if (consumer) {
        // if so, then push to the first consumer, not all
        nextTick(iterator);
        const message = _createConsumerMessage(
          consumer,
          { value: msg, done: false },
          chanId
        );
        nextTick(message[0], message[1]);
      } else {
        // let's wait for a data consumer
        dataProducers[chanId]?.add({
          chanId,
          iterator,
          payload,
          type: requestType,
        });
      }
      return;
    }

    case "close":
      if (!channels[chanId]) {
        nextTickThrow(iterator, closeError);
        return;
      }
      return nextTick(iterator);

    default: {
      const x: never = requestType;
    }
  }
}

export function go<Data>(generator: () => GoGenerator<Data>) {
  const iterator = checkGenerator(generator);
  iterator.__goId = uuid();

  // so `go` kicks off the scheduler
  scheduler({
    state,
    generator: {
      iterator,
      yieldRequest: undefined,
      done: false,
    },
  });
}

export function newChannel<Data = string>() {
  const { channels, dataProducers, dataConsumers } = state;
  const chanId = uuid();
  channels[chanId] = true;
  dataProducers[chanId] = new LinkedListBuffer();
  dataConsumers[chanId] = new LinkedListBuffer();

  const channel: Channel<Data> = {
    get _id() {
      return chanId.toString();
    },
    take() {
      return {
        chanId: chanId.toString(),
        type: "take",
        payload: undefined,
      };
    },
    put(msg) {
      return {
        chanId: chanId.toString(),
        type: "put",
        payload: { msg },
      };
    },
    asyncPut(msg) {
      if (!channels[chanId]) {
        throw putCloseError;
      }
      scheduler({
        state,
        generator: {
          // pass a dummyIterator. We don't care about any errors that
          // may happen down the road, nor do we need any messages
          // from the scheduler
          iterator: dummyIterator() as GoGenerator<any>,
          yieldRequest: channel.put(msg),
        },
        stopScheduler: false,
      });
    },
  };

  return channel;
}

/**
 * Kill the channel
 */
export function close<Data>(
  channel: Channel<Data>
): ChannelCloseRequest | void {
  const { channels, dataProducers, dataConsumers } = state;
  const chanId = channel._id;

  console.debug(tag, `channel: ${chanId}`, "closing");

  if (!channels[chanId]) {
    console.debug(tag, `channel: ${chanId}`, "aborting close");
    throw closeError;
  }

  // turn off channel
  delete channels[chanId];

  // awaken any pending consumers, now that the channel is closed
  const consumers = dataConsumers[chanId];
  let consumer = consumers?.pop();

  while (consumer) {
    const { iterator, ...yieldRequest } = consumer;

    scheduler({
      state,
      generator: {
        iterator,
        yieldRequest,
      },
    });

    consumer = consumers?.pop();
  }

  delete dataConsumers[chanId];

  // hope we don't have pending producers
  const producers = dataProducers[chanId];
  let producer = producers?.pop();

  while (producer) {
    const { iterator } = producer;
    const { value: request, done: stopScheduler } =
      iterator.throw(putCloseError);

    scheduler({
      state,
      generator: {
        iterator,
        yieldRequest: request,
      },
      stopScheduler,
    });

    producer = producers?.pop();
  }

  delete dataProducers[chanId];

  return {
    chanId,
    type: "close",
    payload: undefined,
  };
}

interface Selection {
  type: "select";
  payload: {
    selectedChanIds: string[];
  };
}

export function select<Data1>(...channel: [Channel<Data1>]): Selection;

export function select<Data1, Data2>(
  ...channel: [Channel<Data1>, Channel<Data2>]
): Selection;

export function select<Data1, Data2, Data3>(
  ...channel: [Channel<Data1>, Channel<Data2>, Channel<Data3>]
): Selection;

export function select<Data1, Data2, Data3, Data4>(
  ...channel: [Channel<Data1>, Channel<Data2>, Channel<Data3>, Channel<Data4>]
): Selection;

export function select<Data1, Data2, Data3, Data4, Data5>(
  ...channel: [
    Channel<Data1>,
    Channel<Data2>,
    Channel<Data3>,
    Channel<Data4>,
    Channel<Data5>
  ]
): Selection;

/**
 * Allows you to yield for the values of the selected channels.
 */
export function select(...channels: Channel<any>[]): ChannelSelectRequest {
  return {
    type: "select",
    payload: { selectedChanIds: channels.map((x) => x._id) || [] },
  };
}

/**
 * forEach will be called each time someone `put`s to the Channel.
 */
export function range<Data>(channel: Channel<Data>) {
  return {
    // This actually registers the callback
    forEach(callback: (value: Data) => boolean | void) {
      // Internally, it's an iterator
      const iterator = Object.assign(dummyIterator(), {
        next: ({ value, done }: { value: Data; done: boolean }) => {
          if (done) {
            // tell the scheduler we're done and don't update
            // callback
            return { value: undefined, done: true };
          }
          // pass the value to the callback
          const unsubscribe = callback(value);
          if (unsubscribe === false) {
            // tell the scheduler we're done if callback requests to
            // unsubscribe
            return { value: undefined, done: true };
          }
          // tell the scheduler that the next request is for another
          // take
          return { value: channel.take(), done: false };
        },
      });
      // queue self
      scheduler({
        state,
        generator: {
          iterator,
          yieldRequest: channel.take(),
        },
        stopScheduler: false,
      });
    },
  };
}

export { LinkedListBuffer, checkGenerator };
