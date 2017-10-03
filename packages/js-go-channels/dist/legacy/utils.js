'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LinkedListBuffer = exports.BufferItem = undefined;

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

exports.uuid = uuid;
exports.checkGenerator = checkGenerator;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var BufferItem = exports.BufferItem = function BufferItem(data, next) {
  (0, _classCallCheck3.default)(this, BufferItem);

  this.data = data;
  this.next = next;
};

var LinkedListBuffer = exports.LinkedListBuffer = function () {
  function LinkedListBuffer() {
    (0, _classCallCheck3.default)(this, LinkedListBuffer);

    this.head = undefined;
    this.tail = undefined;
  }

  (0, _createClass3.default)(LinkedListBuffer, [{
    key: 'add',
    value: function add(item) {
      var bufferItem = new BufferItem(item);

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
  return id++;
}

function checkGenerator(generator) {
  if (!generator || typeof generator !== 'function') {
    throw new Error('Need a generator');
  }
  var iterator = generator();
  if (!iterator || typeof iterator[Symbol.iterator] !== 'function') {
    throw new Error('Need an iterator');
  }
  return iterator;
}
//# sourceMappingURL=utils.js.map