'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.initialStateFn = undefined;
exports.go = go;
exports.newChannel = newChannel;
exports.close = close;
exports.select = select;
exports.range = range;

var _utils = require('./utils');

var initialStateFn = exports.initialStateFn = function () {
  babelHelpers.newArrowCheck(undefined, undefined);
  return {
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
    rangeRequests: []
  };
}.bind(undefined);

var state = initialStateFn();

var cTakeRequest = 'take';
var cPutRequest = 'put';
var cCloseRequest = 'close';
var cSelectRequest = 'select';

var putCloseError = new Error('Cannot put on a closed channel');

var dummyIterator = function () {
  babelHelpers.newArrowCheck(undefined, undefined);
  return {
    next: function next() {
      babelHelpers.newArrowCheck(undefined, undefined);
      return { value: undefined, done: true };
    }.bind(undefined),
    throw: function _throw() {
      babelHelpers.newArrowCheck(undefined, undefined);
      return { value: undefined, done: true };
    }.bind(undefined),
    return: function _return() {
      babelHelpers.newArrowCheck(undefined, undefined);
      return { value: undefined, done: true };
    }.bind(undefined)
  };
}.bind(undefined);

/**
 * Does what it says. Need to take into account the case when the
 * consumer is a pending select, pending take. `select`s have a
 * different signature.
 * @param {Iterator} consumer
 * @param {Object} message
 * @param {Object} extraArgs
 * @param {string} extraArgs.chanId
 */
function _createConsumerMessage(consumer, message, _ref) {
  var chanId = _ref.chanId;
  var consumerIterator = consumer.iterator,
      requestType = consumer.type,
      payload = consumer.payload;

  if (requestType === cSelectRequest) {
    var selectedChanIds = payload.selectedChanIds;

    var i = selectedChanIds.indexOf(chanId);
    var response = new Array(selectedChanIds.length);
    response[i] = message;
    return [consumerIterator, response];
  } else if (requestType === cTakeRequest) {
    return [consumerIterator, message];
  }
  throw new Error(`Unknown request type ${requestType}`);
}

function _addConsumer(_ref2) {
  var dataConsumers = _ref2.dataConsumers,
      chanId = _ref2.chanId,
      _ref2$consumer = _ref2.consumer,
      iterator = _ref2$consumer.iterator,
      requestType = _ref2$consumer.requestType,
      payload = _ref2$consumer.payload;

  dataConsumers[chanId].add({
    iterator,
    type: requestType,
    payload
  });
}

function scheduler(_ref3) {
  var _this = this;

  var _ref3$state = _ref3.state,
      dataProducers = _ref3$state.dataProducers,
      dataConsumers = _ref3$state.dataConsumers,
      channels = _ref3$state.channels,
      lastSelected = _ref3$state.lastSelected,
      _ref3$generator = _ref3.generator,
      iterator = _ref3$generator.iterator,
      request = _ref3$generator.request,
      stopScheduler = _ref3.stopScheduler;

  // Give the iterator the iteratorMessage and pass the result to the
  // scheduler
  var nextTick = function (iterator, iteratorMessage) {
    babelHelpers.newArrowCheck(this, _this);

    var _iterator$next = iterator.next(iteratorMessage),
        request = _iterator$next.value,
        stopScheduler = _iterator$next.done;

    setTimeout(function () {
      babelHelpers.newArrowCheck(this, _this);
      return scheduler({
        state: { dataProducers, dataConsumers, channels, lastSelected },
        generator: {
          iterator,
          request
        },
        stopScheduler
      });
    }.bind(this), 0);
  }.bind(this);
  // Give the iterator the error and pass the result to the scheduler
  var nextTickThrow = function (iterator, error) {
    babelHelpers.newArrowCheck(this, _this);

    var _iterator$throw = iterator.throw(error),
        request = _iterator$throw.value,
        stopScheduler = _iterator$throw.done;

    setTimeout(function () {
      babelHelpers.newArrowCheck(this, _this);
      return scheduler({
        state: { dataProducers, dataConsumers, channels, lastSelected },
        generator: {
          iterator,
          request
        },
        stopScheduler
      });
    }.bind(this), 0);
  }.bind(this);
  // if no request, then at start of generator, so get one
  if (!request && !stopScheduler) {
    return nextTick(iterator);
  }
  // if this generator is done, then goodbye
  if (stopScheduler) {
    return;
  }
  var requestType = request.type,
      chanId = request.chanId,
      payload = request.payload;

  switch (requestType) {
    case cTakeRequest:
      {
        // check if the channel is closed
        if (!channels[chanId]) {
          // if the channel is closed (buffer doesn't exist), then pass
          // back undefined, done = true to the iterator.
          return nextTick(iterator, { value: undefined, done: true });
        }
        // do we have any sleeping data producers?
        var producer = dataProducers[chanId].pop();
        if (producer) {
          var producerIterator = producer.iterator,
              msg = producer.payload.msg;
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
              iterator,
              requestType,
              payload
            }
          });
        }
        return;
      }
    // select returns the first data producer that fires. Sends back
    // an array to the iterator. Just fire the first channel that
    // receives a message: go thru the selected channels and try to
    // get values. stop at the first that has a value.
    case cSelectRequest:
      {
        var selectedChanIds = payload.selectedChanIds;

        var lastSelectedId = `${iterator.__goId}:${selectedChanIds}`;
        var chanData = null;
        var _producer = null;
        // mod by the number of selected channels so that we never get an
        // out-of-bounds exception
        var unboundedLastSelected = typeof lastSelected[lastSelectedId] !== 'undefined' ? lastSelected[lastSelectedId] : -1;
        var last = (unboundedLastSelected + 1) % selectedChanIds.length;
        delete lastSelected[lastSelectedId];
        // do we have any sleeping producers? but start from the last selected
        for (var i = last; i < selectedChanIds.length; i++) {
          var _chanId = selectedChanIds[i];
          if (!channels[_chanId]) {
            // if channel was closed then send undefined
            chanData = { value: undefined, done: true, chanNum: i };
            break;
          }
          _producer = dataProducers[_chanId].pop();
          if (_producer) {
            var _producer2 = _producer,
                _msg = _producer2.payload.msg;

            chanData = { value: _msg, done: false, chanNum: i };
            break;
          }
        }
        if (chanData) {
          // set last selected
          lastSelected[lastSelectedId] = chanData.chanNum;
          // wake up the producer
          _producer && nextTick(_producer.iterator);
          var response = new Array(selectedChanIds.length);
          response[chanData.chanNum] = {
            value: chanData.value,
            done: chanData.done
          };
          nextTick(iterator, response);
        } else {
          // There were no sleeping producers, so add ourselves to the
          // waiting list of all the non-closed producers.
          for (var _i = 0; _i < selectedChanIds.length; _i++) {
            if (dataConsumers[selectedChanIds[_i]]) {
              _addConsumer({
                dataConsumers,
                chanId: selectedChanIds[_i],
                consumer: {
                  iterator,
                  requestType,
                  payload
                }
              });
            }
          }
        }
        return;
      }
    case cPutRequest:
      {
        // First check if the channel is closed.
        if (!channels[chanId]) {
          nextTickThrow(iterator, putCloseError);
          return;
        }
        var _msg2 = payload.msg;
        // do we have any takers?

        var consumer = dataConsumers[chanId].pop();
        if (consumer) {
          nextTick(iterator);
          nextTick.apply(undefined, babelHelpers.toConsumableArray(_createConsumerMessage(consumer, { value: _msg2, done: false }, { chanId })));
        } else {
          // let's wait for a data consumer
          dataProducers[chanId].add({ iterator, payload, type: requestType });
        }
        return;
      }
    case cCloseRequest:
      {
        if (!channels[chanId]) {
          nextTickThrow(iterator, new Error('Channel is already closed'));
          return;
        }
        // turn off channel
        delete channels[chanId];
        // tell any pending consumers the channel is closed
        var consumers = dataConsumers[chanId];
        var _consumer = consumers.pop();
        while (_consumer) {
          nextTick.apply(undefined, babelHelpers.toConsumableArray(_createConsumerMessage(_consumer, { value: undefined, done: true }, { chanId })));
          _consumer = consumers.pop();
        }
        delete dataConsumers[chanId];
        // hope we don't have pending producers
        var producers = dataProducers[chanId];
        var _producer3 = producers.pop();
        while (_producer3) {
          var _producer4 = _producer3,
              _producerIterator = _producer4.iterator;

          nextTickThrow(_producerIterator, putCloseError);
          _producer3 = producers.pop();
        }
        delete dataProducers[chanId];
        nextTick(iterator);
        return;
      }
  }
}

function go(generator) {
  var iterator = (0, _utils.checkGenerator)(generator);
  iterator.__goId = (0, _utils.uuid)();
  // so `go` kicks off the scheduler
  scheduler({
    state,
    generator: {
      iterator,
      request: undefined,
      done: false
    }
  });
}

function newChannel() {
  var channels = state.channels,
      dataProducers = state.dataProducers,
      dataConsumers = state.dataConsumers;

  var chanId = (0, _utils.uuid)();
  channels[chanId] = true;
  dataProducers[chanId] = new _utils.LinkedListBuffer();
  dataConsumers[chanId] = new _utils.LinkedListBuffer();
  var channel = {
    get _id() {
      return chanId;
    },
    take(_msgId) {
      return {
        chanId,
        type: cTakeRequest,
        payload: {}
      };
    },
    put(msg) {
      return {
        chanId,
        type: cPutRequest,
        payload: { msg }
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
          iterator: dummyIterator(),
          request: channel.put(msg)
        },
        stopScheduler: false
      });
    }
  };
  return channel;
}

function close(channel, _msgId) {
  return {
    _msgId,
    chanId: channel._id,
    type: cCloseRequest,
    payload: {}
  };
}

function select() {
  var _this2 = this;

  for (var _len = arguments.length, channels = Array(_len), _key = 0; _key < _len; _key++) {
    channels[_key] = arguments[_key];
  }

  return {
    type: cSelectRequest,
    payload: { selectedChanIds: channels.map(function (x) {
        babelHelpers.newArrowCheck(this, _this2);
        return x._id;
      }.bind(this)) || [] }
  };
}

function range(channel) {
  return {
    // This actually registers the callback
    forEach(callback) {
      var _this3 = this;

      // Internally, it's an iterator
      var iterator = Object.assign(dummyIterator(), {
        next: function next(_ref4) {
          var value = _ref4.value,
              done = _ref4.done;
          babelHelpers.newArrowCheck(this, _this3);

          if (done) {
            // tell the scheduler we're done and don't update
            // callback
            return { value: undefined, done: true };
          }
          // pass the value to the callback
          var unsub = callback(value);
          if (unsub === false) {
            // tell the scheduler we're done if callback requests to
            // unsubscribe
            return { value: undefined, done: true };
          }
          // tell the scheduler that the next request is for another
          // take
          return { value: channel.take(), done: false };
        }.bind(this)
      });
      // queue self
      scheduler({
        state,
        generator: {
          iterator,
          request: channel.take()
        },
        stopScheduler: false
      });
    }
  };
}
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.uuid = uuid;
exports.checkGenerator = checkGenerator;

var BufferItem = exports.BufferItem = function BufferItem(data, next) {
  babelHelpers.classCallCheck(this, BufferItem);

  this.data = data;
  this.next = next;
};

var LinkedListBuffer = exports.LinkedListBuffer = function () {
  function LinkedListBuffer() {
    babelHelpers.classCallCheck(this, LinkedListBuffer);

    this.head = undefined;
    this.tail = undefined;
  }

  babelHelpers.createClass(LinkedListBuffer, [{
    key: 'add',
    value: function add(item) {
      var bufferItem = new BufferItem(item);
      // first item ever
      if (!this.head) {
        this.head = bufferItem;
        this.tail = bufferItem;
        return;
      }
      this.tail.next = bufferItem;
    }
  }, {
    key: 'pop',
    value: function pop() {
      if (!this.head) {
        return undefined;
      }
      var item = this.head;
      this.head = this.head.next;
      return item.data;
    }
  }]);
  return LinkedListBuffer;
}();

var id = 0;

function uuid() {
  // Note that we're not using generators to avoid having generators
  // as a libary dependency.
  return id++;
}

function checkGenerator(generator) {
  // check if generator
  if (!generator || typeof generator !== 'function') {
    throw new Error('Need a generator');
  }
  var iterator = generator();
  if (!iterator || typeof iterator[Symbol.iterator] !== 'function') {
    throw new Error('Need an iterator');
  }
  return iterator;
}

//# sourceMappingURL=index.js.map