var _this = this;

import { LinkedListBuffer, uuid, checkGenerator } from './utils';

export var initialStateFn = function () {
  babelHelpers.newArrowCheck(this, _this);
  return {
    channels: {},
    dataProducers: {},
    dataConsumers: {},

    lastSelected: {},

    rangeRequests: []
  };
}.bind(this);

var state = initialStateFn();

var cTakeRequest = 'take';
var cPutRequest = 'put';
var cCloseRequest = 'close';
var cSelectRequest = 'select';

var putCloseError = new Error('Cannot put on a closed channel');

var dummyIterator = function () {
  babelHelpers.newArrowCheck(this, _this);
  return {
    next: function next() {
      babelHelpers.newArrowCheck(this, _this);
      return { value: undefined, done: true };
    }.bind(this),
    throw: function _throw() {
      babelHelpers.newArrowCheck(this, _this);
      return { value: undefined, done: true };
    }.bind(this),
    return: function _return() {
      babelHelpers.newArrowCheck(this, _this);
      return { value: undefined, done: true };
    }.bind(this)
  };
}.bind(this);

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
  throw new Error('Unknown request type ' + String(requestType));
}

function _addConsumer(_ref2) {
  var dataConsumers = _ref2.dataConsumers,
      chanId = _ref2.chanId,
      _ref2$consumer = _ref2.consumer,
      iterator = _ref2$consumer.iterator,
      requestType = _ref2$consumer.requestType,
      payload = _ref2$consumer.payload;

  dataConsumers[chanId].add({
    iterator: iterator,
    type: requestType,
    payload: payload
  });
}

function scheduler(_ref3) {
  var _this2 = this;

  var _ref3$state = _ref3.state,
      dataProducers = _ref3$state.dataProducers,
      dataConsumers = _ref3$state.dataConsumers,
      channels = _ref3$state.channels,
      lastSelected = _ref3$state.lastSelected,
      _ref3$generator = _ref3.generator,
      iterator = _ref3$generator.iterator,
      request = _ref3$generator.request,
      stopScheduler = _ref3.stopScheduler;

  var nextTick = function (iterator, iteratorMessage) {
    babelHelpers.newArrowCheck(this, _this2);

    var _iterator$next = iterator.next(iteratorMessage),
        request = _iterator$next.value,
        stopScheduler = _iterator$next.done;

    setTimeout(function () {
      babelHelpers.newArrowCheck(this, _this2);
      return scheduler({
        state: { dataProducers: dataProducers, dataConsumers: dataConsumers, channels: channels, lastSelected: lastSelected },
        generator: {
          iterator: iterator,
          request: request
        },
        stopScheduler: stopScheduler
      });
    }.bind(this), 0);
  }.bind(this);

  var nextTickThrow = function (iterator, error) {
    babelHelpers.newArrowCheck(this, _this2);

    var _iterator$throw = iterator.throw(error),
        request = _iterator$throw.value,
        stopScheduler = _iterator$throw.done;

    setTimeout(function () {
      babelHelpers.newArrowCheck(this, _this2);
      return scheduler({
        state: { dataProducers: dataProducers, dataConsumers: dataConsumers, channels: channels, lastSelected: lastSelected },
        generator: {
          iterator: iterator,
          request: request
        },
        stopScheduler: stopScheduler
      });
    }.bind(this), 0);
  }.bind(this);

  if (!request && !stopScheduler) {
    return nextTick(iterator);
  }

  if (stopScheduler) {
    return;
  }
  var requestType = request.type,
      chanId = request.chanId,
      payload = request.payload;

  switch (requestType) {
    case cTakeRequest:
      {
        if (!channels[chanId]) {
          return nextTick(iterator, { value: undefined, done: true });
        }

        var producer = dataProducers[chanId].pop();
        if (producer) {
          var producerIterator = producer.iterator,
              msg = producer.payload.msg;

          nextTick(iterator, { value: msg, done: false });

          nextTick(producerIterator);
        } else {
          _addConsumer({
            dataConsumers: dataConsumers,
            chanId: chanId,
            consumer: {
              iterator: iterator,
              requestType: requestType,
              payload: payload
            }
          });
        }
        return;
      }

    case cSelectRequest:
      {
        var selectedChanIds = payload.selectedChanIds;

        var lastSelectedId = String(iterator.__goId) + ':' + String(selectedChanIds);
        var chanData = null;
        var _producer = null;

        var unboundedLastSelected = typeof lastSelected[lastSelectedId] !== 'undefined' ? lastSelected[lastSelectedId] : -1;
        var last = (unboundedLastSelected + 1) % selectedChanIds.length;
        delete lastSelected[lastSelectedId];

        for (var i = last; i < selectedChanIds.length; i++) {
          var _chanId = selectedChanIds[i];
          if (!channels[_chanId]) {
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
          lastSelected[lastSelectedId] = chanData.chanNum;

          _producer && nextTick(_producer.iterator);
          var response = new Array(selectedChanIds.length);
          response[chanData.chanNum] = {
            value: chanData.value,
            done: chanData.done
          };
          nextTick(iterator, response);
        } else {
          for (var _i = 0; _i < selectedChanIds.length; _i++) {
            if (dataConsumers[selectedChanIds[_i]]) {
              _addConsumer({
                dataConsumers: dataConsumers,
                chanId: selectedChanIds[_i],
                consumer: {
                  iterator: iterator,
                  requestType: requestType,
                  payload: payload
                }
              });
            }
          }
        }
        return;
      }
    case cPutRequest:
      {
        if (!channels[chanId]) {
          nextTickThrow(iterator, putCloseError);
          return;
        }
        var _msg2 = payload.msg;

        var consumer = dataConsumers[chanId].pop();
        if (consumer) {
          nextTick(iterator);
          nextTick.apply(undefined, _createConsumerMessage(consumer, { value: _msg2, done: false }, { chanId: chanId }));
        } else {
          dataProducers[chanId].add({ iterator: iterator, payload: payload, type: requestType });
        }
        return;
      }
    case cCloseRequest:
      {
        if (!channels[chanId]) {
          nextTickThrow(iterator, new Error('Channel is already closed'));
          return;
        }

        delete channels[chanId];

        var consumers = dataConsumers[chanId];
        var _consumer = consumers.pop();
        while (_consumer) {
          nextTick.apply(undefined, _createConsumerMessage(_consumer, { value: undefined, done: true }, { chanId: chanId }));
          _consumer = consumers.pop();
        }
        delete dataConsumers[chanId];

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

export function go(generator) {
  var iterator = checkGenerator(generator);
  iterator.__goId = uuid();

  scheduler({
    state: state,
    generator: {
      iterator: iterator,
      request: undefined,
      done: false
    }
  });
}

export function newChannel() {
  var channels = state.channels,
      dataProducers = state.dataProducers,
      dataConsumers = state.dataConsumers;

  var chanId = uuid();
  channels[chanId] = true;
  dataProducers[chanId] = new LinkedListBuffer();
  dataConsumers[chanId] = new LinkedListBuffer();
  var channel = {
    get _id() {
      return chanId;
    },
    take: function take(_msgId) {
      return {
        chanId: chanId,
        type: cTakeRequest,
        payload: {}
      };
    },
    put: function put(msg) {
      return {
        chanId: chanId,
        type: cPutRequest,
        payload: { msg: msg }
      };
    },
    asyncPut: function asyncPut(msg) {
      if (!channels[chanId]) {
        throw putCloseError;
      }
      scheduler({
        state: state,
        generator: {
          iterator: dummyIterator(),
          request: channel.put(msg)
        },
        stopScheduler: false
      });
    }
  };
  return channel;
}

export function close(channel, _msgId) {
  return {
    _msgId: _msgId,
    chanId: channel._id,
    type: cCloseRequest,
    payload: {}
  };
}

export function select() {
  var _this3 = this;

  for (var _len = arguments.length, channels = Array(_len), _key = 0; _key < _len; _key++) {
    channels[_key] = arguments[_key];
  }

  return {
    type: cSelectRequest,
    payload: { selectedChanIds: channels.map(function (x) {
        babelHelpers.newArrowCheck(this, _this3);
        return x._id;
      }.bind(this)) || [] }
  };
}

export function range(channel) {
  return {
    forEach: function forEach(callback) {
      var _this4 = this;

      var iterator = Object.assign(dummyIterator(), {
        next: function next(_ref4) {
          var value = _ref4.value,
              done = _ref4.done;
          babelHelpers.newArrowCheck(this, _this4);

          if (done) {
            return { value: undefined, done: true };
          }

          var unsub = callback(value);
          if (unsub === false) {
            return { value: undefined, done: true };
          }

          return { value: channel.take(), done: false };
        }.bind(this)
      });

      scheduler({
        state: state,
        generator: {
          iterator: iterator,
          request: channel.take()
        },
        stopScheduler: false
      });
    }
  };
}
//# sourceMappingURL=index.js.map