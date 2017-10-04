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

export class BufferItem {
  constructor(data, next) {
    this.data = data
    this.next = next
  }
}

export class LinkedListBuffer {
  constructor() {
    this.head = undefined
    this.tail = undefined
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
      return undefined
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


export function checkGenerator(generator) {
  // check if generator
  if (!generator || typeof generator !== 'function' ) {
    throw new Error('Need a generator');
  }
  const iterator = generator()
  if (!iterator || typeof iterator[Symbol.iterator] !== 'function' ) {
    throw new Error('Need an iterator');
  }
  return iterator
}
