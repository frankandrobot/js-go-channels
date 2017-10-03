'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.initialStateFn = undefined;

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _newArrowCheck2 = require('babel-runtime/helpers/newArrowCheck');

var _newArrowCheck3 = _interopRequireDefault(_newArrowCheck2);

exports.go = go;
exports.newChannel = newChannel;
exports.close = close;
exports.select = select;
exports.range = range;

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var initialStateFn = exports.initialStateFn = function () {
  (0, _newArrowCheck3.default)(undefined, undefined);
  return {
    channels: {},
    dataProducers: {},
    dataConsumers: {},

    lastSelected: {},

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
  (0, _newArrowCheck3.default)(undefined, undefined);
  return {
    next: function next() {
      (0, _newArrowCheck3.default)(undefined, undefined);
      return { value: undefined, done: true };
    }.bind(undefined),
    throw: function _throw() {
      (0, _newArrowCheck3.default)(undefined, undefined);
      return { value: undefined, done: true };
    }.bind(undefined),
    return: function _return() {
      (0, _newArrowCheck3.default)(undefined, undefined);
      return { value: undefined, done: true };
    }.bind(undefined)
  };
}.bind(undefined);

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

  var nextTick = function (iterator, iteratorMessage) {
    (0, _newArrowCheck3.default)(this, _this);

    var _iterator$next = iterator.next(iteratorMessage),
        request = _iterator$next.value,
        stopScheduler = _iterator$next.done;

    setTimeout(function () {
      (0, _newArrowCheck3.default)(this, _this);
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
    (0, _newArrowCheck3.default)(this, _this);

    var _iterator$throw = iterator.throw(error),
        request = _iterator$throw.value,
        stopScheduler = _iterator$throw.done;

    setTimeout(function () {
      (0, _newArrowCheck3.default)(this, _this);
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
          nextTick.apply(undefined, (0, _toConsumableArray3.default)(_createConsumerMessage(consumer, { value: _msg2, done: false }, { chanId: chanId })));
        } else {
          dataProducers[chanId].add({ iterator: iterator, payload: payload, type: requestType });
        }
        return;
      }
  }
}

function go(generator) {
  var iterator = (0, _utils.checkGenerator)(generator);
  iterator.__goId = (0, _utils.uuid)();

  scheduler({
    state: state,
    generator: {
      iterator: iterator,
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

function close(channel, _msgId) {
  var channels = state.channels,
      dataProducers = state.dataProducers,
      dataConsumers = state.dataConsumers;

  var chanId = channel._id;
  if (!channels[chanId]) {
    throw new Error('Channel is already closed');
  }

  delete channels[chanId];

  var consumers = dataConsumers[chanId];
  var consumer = consumers.pop();
  while (consumer) {
    var _createConsumerMessag = _createConsumerMessage(consumer, { value: undefined, done: true }, { chanId: chanId }),
        _createConsumerMessag2 = (0, _slicedToArray3.default)(_createConsumerMessag, 2),
        iterator = _createConsumerMessag2[0],
        request = _createConsumerMessag2[1];

    scheduler({
      state: state,
      generator: {
        iterator: iterator,
        request: request
      }
    });
    consumer = consumers.pop();
  }
  delete dataConsumers[chanId];

  var producers = dataProducers[chanId];
  var producer = producers.pop();
  while (producer) {
    var _producer3 = producer,
        _iterator = _producer3.iterator;

    var _iterator$throw2 = _iterator.throw(putCloseError),
        _request = _iterator$throw2.value,
        stopScheduler = _iterator$throw2.done;

    scheduler({
      state: state,
      generator: {
        iterator: _iterator,
        request: _request
      },
      stopScheduler: stopScheduler
    });
    producer = producers.pop();
  }
  delete dataProducers[chanId];
  return;
}

function select() {
  var _this2 = this;

  for (var _len = arguments.length, channels = Array(_len), _key = 0; _key < _len; _key++) {
    channels[_key] = arguments[_key];
  }

  return {
    type: cSelectRequest,
    payload: { selectedChanIds: channels.map(function (x) {
        (0, _newArrowCheck3.default)(this, _this2);
        return x._id;
      }.bind(this)) || [] }
  };
}

function range(channel) {
  return {
    forEach: function forEach(callback) {
      var _this3 = this;

      var iterator = Object.assign(dummyIterator(), {
        next: function next(_ref4) {
          var value = _ref4.value,
              done = _ref4.done;
          (0, _newArrowCheck3.default)(this, _this3);

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