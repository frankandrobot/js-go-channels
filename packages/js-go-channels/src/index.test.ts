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

import { newChannel, go, select, close, range } from "./index";

const tick = async (timeoutCounts = 5) => {
  for (let i = 0; i < timeoutCounts; i++) {
    await new Promise((resolve) => setTimeout(resolve));
  }
};

test("go needs a generator", () => {
  // @ts-ignore
  expect(() => go("25")).toThrowError(/Need a generator/i);
  expect(() =>
    // @ts-ignore
    go(function () {
      return 35;
    })
  ).toThrowError(/Need an iterator/i);
});

// basic usage
// =====================================

test("basic go usage", async () => {
  expect.assertions(1);
  const ch = newChannel();

  go(function* () {
    yield ch.put("hello");
  });

  go(function* () {
    const { value: msg } = yield ch.take();
    expect(msg).toEqual("hello");
  });

  await tick();
});

test("go with multiple puts", async () => {
  expect.assertions(2);
  const ch = newChannel();

  go(function* () {
    yield ch.put("hello");
    yield ch.put("world");
  });

  go(function* () {
    const { value: msg1 } = yield ch.take();
    expect(msg1).toEqual("hello");
    const { value: msg2 } = yield ch.take();
    expect(msg2).toEqual("world");
  });

  await tick();
});

test("go with two channels", async () => {
  expect.assertions(2);
  const ch1 = newChannel();
  const ch2 = newChannel();

  go(function* () {
    yield ch1.put("hello");
  });
  go(function* () {
    yield ch2.put("world");
  });

  go(function* () {
    const { value: msg1 } = yield ch1.take();
    expect(msg1).toEqual("hello");
    const { value: msg2 } = yield ch2.take();
    expect(msg2).toEqual("world");
  });

  await tick();
});

test("go with multiple puts and delayed takes", async () => {
  expect.assertions(2);
  const ch = newChannel();

  go(function* () {
    yield ch.put("hello");
  });
  go(function* () {
    yield ch.put("world");
  });
  go(function* () {
    const { value: msg1 } = yield ch.take();
    expect(msg1).toEqual("hello");
  });
  go(function* () {
    const { value: msg2 } = yield ch.take();
    expect(msg2).toEqual("world");
  });

  await tick();
});

test("asyncPut works", async () => {
  expect.assertions(2);
  const ch = newChannel();
  const ch2 = newChannel();

  ch.asyncPut("before");

  go(function* () {
    const { value: msg } = yield ch.take();
    expect(msg).toEqual("before");
  });
  go(function* () {
    const { value: msg } = yield ch2.take();
    expect(msg).toEqual("after");
  });

  ch2.asyncPut("after");

  await tick();
});

// putting on a pending consumer
// ===================================

test("putting a pending take works", async () => {
  expect.assertions(1);
  const c1 = newChannel();

  go(function* () {
    const val = yield c1.take();
    expect(val).toEqual({ value: "hi", done: false });
  });
  go(function* () {
    yield c1.put("hi");
  });

  await tick();
});

test("put on a pending select works", async () => {
  expect.assertions(2);
  const c1 = newChannel();

  go(function* () {
    const [val1] = yield select(c1);
    expect(typeof val1).not.toBe("undefined");
    expect(val1).toEqual({ value: "hi", done: false });
  });
  go(function* () {
    yield c1.put("hi");
  });

  await tick();
});

test("async putting a pending take works", async () => {
  expect.assertions(1);
  const c1 = newChannel();

  go(function* () {
    const val = yield c1.take();
    expect(val).toEqual({ value: "hi", done: false });
  });
  c1.asyncPut("hi");

  await tick();
});

test("async put on a pending select works", async () => {
  expect.assertions(2);
  const c1 = newChannel();

  go(function* () {
    const [val1] = yield select(c1);
    expect(typeof val1).not.toBe("undefined");
    expect(val1).toEqual({ value: "hi", done: false });
  });
  c1.asyncPut("hi");

  await tick();
});

// close
// ====================================

test("close should work", async () => {
  expect.assertions(6);
  const chan = newChannel<string>();

  go(function* () {
    const { value: val1, done: done1 } = yield chan.take();
    expect(done1).toEqual(false);
    expect(val1).toEqual("hi");
    const { value: val2, done: done2 } = yield chan.take();
    expect(done2).toEqual(false);
    expect(val2).toEqual("good");
    const { value: val3, done: done3 } = yield chan.take();
    expect(done3).toEqual(true);
    expect(val3).toEqual(undefined);
  });

  go(function* () {
    yield chan.put("hi");
    yield chan.put("good");
    close(chan);
  });

  await tick();
});

test("close should work with repl example", async () => {
  expect.assertions(2);
  const ch = newChannel();

  go(function* () {
    const { value, done } = yield ch.take();
    expect(value).toBeUndefined();
    expect(done).toBeTruthy();
  });
  setTimeout(() => close(ch), 0);

  await tick();
});

test("pending consumers throw error on close", async () => {
  expect.assertions(1);
  const ch = newChannel();
  let err: Error | undefined;

  go(function* () {
    try {
      yield ch.put("hi ho");
    } catch (e) {
      err = e as Error;
    }
    expect(err?.message).toMatch(/Cannot put on a closed channel/i);
  });

  close(ch);

  await tick();
});

test("closing twice throws an error", async () => {
  expect.assertions(1);
  const chan = newChannel();
  let err: Error | undefined;

  go(function* () {
    yield close(chan);
    yield close(chan);
  });

  await tick();

  expect(err?.message).toMatch(/Channel is already closed/i);
});

test("putting on a closed channel throws an error", async () => {
  expect.assertions(1);
  const chan = newChannel();
  let err: Error | undefined;

  close(chan);

  go(function* () {
    try {
      yield chan.put("something");
    } catch (e) {
      err = e as Error;
    } finally {
      expect(err?.message).toMatch(/Cannot put on a closed channel/i);
    }
  });

  await tick();
});

test("async putting on a closed channel throws error", async () => {
  expect.assertions(1);
  const chan = newChannel();
  let err: Error | undefined;

  close(chan);

  go(function* () {
    try {
      chan.asyncPut("something");
    } catch (e) {
      err = e as Error;
    } finally {
      expect(err?.message).toMatch(/Cannot put on a closed channel/i);
    }
  });

  await tick();
});

test("async putting before channel closed is fine", async () => {
  expect.assertions(1);
  const chan = newChannel();
  expect(() => chan.asyncPut("something")).not.toThrowError(/closed channel/i);
  close(chan);
  await tick();
});

test("close works with select", async () => {
  expect.assertions(2);
  const c1 = newChannel();
  const c2 = newChannel();
  close(c1);

  go(function* () {
    yield c2.put("two");
  });

  go(function* () {
    for (let i = 1; i <= 2; i++) {
      const [val1, val2] = yield select(c1, c2);
      if (typeof val1 !== "undefined") {
        expect(val1).toEqual({ value: undefined, done: true });
      } else if (typeof val2 !== "undefined") {
        expect(val2).toEqual({ value: "two", done: false });
      }
    }
  });

  await tick();
});

// closing pending consumer

test("closing a pending take works", async () => {
  expect.assertions(1);
  const c1 = newChannel();

  go(function* () {
    const val = yield c1.take();
    expect(val).toEqual({ value: undefined, done: true });
  });

  close(c1);

  await tick();
});

test("closing a pending select works", async () => {
  expect.assertions(2);
  const c1 = newChannel();

  go(function* () {
    const [val1] = yield select(c1);
    expect(typeof val1).not.toBe("undefined");
    expect(val1).toEqual({ value: undefined, done: true });
  });

  close(c1);

  await tick();
});

// misc
// ====================================

describe("misc", () => {
  test("go with timeout", async () => {
    expect.assertions(1);
    const c1 = newChannel();

    go(function* () {
      setTimeout(() => c1.asyncPut("one"), 100);
    });

    go(function* () {
      const { value: msg } = yield c1.take();
      expect(msg).toEqual("one");
    });

    // TODO remove timeout
    await new Promise((resolve) => setTimeout(resolve, 100));
    await tick();
  });
});

describe("select", () => {
  test("select", async () => {
    expect.assertions(2);
    const c1 = newChannel();
    const c2 = newChannel();

    go(function* () {
      yield c1.put("one");
      yield c2.put("two");
    });

    go(function* () {
      for (let i = 1; i <= 2; i++) {
        const [val1, val2] = yield select(c1, c2);
        if (typeof val1 !== "undefined") {
          expect(val1).toEqual({ value: "one", done: false });
        } else if (typeof val2 !== "undefined") {
          expect(val2).toEqual({ value: "two", done: false });
        }
      }
    });

    await tick();
  });

  test("select round robin", async () => {
    expect.assertions(2);
    const c1 = newChannel();
    const c2 = newChannel();

    go(function* () {
      yield c1.put("one");
    });
    go(function* () {
      yield c2.put("two");
    });

    go(function* () {
      for (let i = 1; i <= 2; i++) {
        const [val1, val2] = yield select(c1, c2);
        if (typeof val1 !== "undefined") {
          expect(val1).toEqual({ value: "one", done: false });
        } else if (typeof val2 !== "undefined") {
          expect(val2).toEqual({ value: "two", done: false });
        }
      }
    });

    await tick();
  });

  test("select roundrobins with closed channels", async () => {
    expect.assertions(2);
    const c1 = newChannel();
    const c2 = newChannel();
    close(c1);
    close(c2);

    go(function* () {
      for (let i = 1; i <= 2; i++) {
        const [val1, val2] = yield select(c1, c2);
        if (typeof val1 !== "undefined") {
          expect(val1).toEqual({ value: undefined, done: true });
        } else if (typeof val2 !== "undefined") {
          expect(val2).toEqual({ value: undefined, done: true });
        }
      }
    });

    await tick();
  });

  test("selecting the same channels works across go routines", async () => {
    expect.assertions(3);
    const c1 = newChannel();
    const c2 = newChannel();
    close(c1);
    close(c2);

    go(function* () {
      yield c1.take();
      yield c2.take();
      // wait for the close to happen
      const [val1, val2] = yield select(c1, c2);
      expect(val1).toEqual({ value: undefined, done: true });
    });

    go(function* () {
      yield c1.take();
      yield c2.take();
      // wait for the close to happen
      for (let i = 1; i <= 2; i++) {
        const [val1, val2] = yield select(c1, c2);
        if (i === 1) {
          expect(val1).toEqual({ value: undefined, done: true });
        } else if (i === 2) {
          expect(val2).toEqual({ value: undefined, done: true });
        }
      }
    });

    await tick();
  });
});

// range
// ===========================

test("range works", function (t) {
  t.plan(2);
  const c1 = newChannel();
  let i = 0;
  go(function* () {
    yield c1.put("hello");
  });
  range(c1).forEach((value) => {
    if (i === 0) {
      t.equal(value, "hello");
    } else if (i === 1) {
      t.equal(value, "goodbye");
    } else {
      t.equal(1, 2, "should not be here");
    }
    i++;
  });
  go(function* () {
    yield c1.put("goodbye");
    close(c1);
  });
});

test("range unsubscribe works", function (t) {
  t.plan(1);
  const c1 = newChannel();
  let i = 0;
  go(function* () {
    yield c1.put("hello");
  });
  range(c1).forEach((value) => {
    if (i === 0) {
      t.equal(value, "hello");
      i++;
      return false;
    }
    t.equal(1, 2, "should not be here");
  });
  go(function* () {
    yield c1.put("goodbye");
    close(c1);
  });
});
