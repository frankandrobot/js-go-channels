export class BufferItem {
  constructor(data, next) {
    this.data = data
    this.next = next
  }
}

export class LinkedListBuffer {
  constructor() {
    this.head = null
    this.tail = null
  }

  add(item) {
    const bufferItem = new BufferItem(item)
    // first item ever
    if (!this.head) {
      this.head = bufferItem
      this.tail = bufferItem
      return
    }
    this.tail.next = bufferItem
  }

  pop() {
    if(!this.head) {
      return null
    }
    const item = this.head
    this.head = this.head.next
    return item.data
  }
}


let id = 0

export function  uuid() {
  // Note that we're not using generators to avoid having generators
  // as a libary dependency.
  return id++
}