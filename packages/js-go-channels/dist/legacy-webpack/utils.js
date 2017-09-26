export var BufferItem = function BufferItem(data, next) {
  babelHelpers.classCallCheck(this, BufferItem);

  this.data = data;
  this.next = next;
};

export var LinkedListBuffer = function () {
  function LinkedListBuffer() {
    babelHelpers.classCallCheck(this, LinkedListBuffer);

    this.head = undefined;
    this.tail = undefined;
  }

  LinkedListBuffer.prototype.add = function add(item) {
    var bufferItem = new BufferItem(item);

    if (!this.head) {
      this.head = bufferItem;
      this.tail = bufferItem;
      return;
    }
    this.tail.next = bufferItem;
  };

  LinkedListBuffer.prototype.pop = function pop() {
    if (!this.head) {
      return undefined;
    }
    var item = this.head;
    this.head = this.head.next;
    return item.data;
  };

  return LinkedListBuffer;
}();

var id = 0;

export function uuid() {
  return id++;
}

export function checkGenerator(generator) {
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