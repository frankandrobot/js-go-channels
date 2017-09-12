# js-go-channels

## Installation

TODO

## Gotchas

### The common golang synchronization pattern won't work.

```js
func main() {
  const messages = newChannel()
  go(function* () { yield messages.put("ping") })
  const msg = messages.take()
  console.log(msg)
}
```

The reason has to do with the way Javascript concurrency
works. Recall, it works by dispatching functions to an async
queue. Whatever function is currently executing will hog the CPU.
That means the `take` will always synchronously fire before the `put`,
and to make it block we have to use a callback. 

So the following will work just fine. And by "fine", we mean that
`main` won't finish until it receives a "ping".

``` js
func main() {
  const messages = newChannel()
  go(function* () { yield messages.put("ping") })
  go(function* () { 
    const msg = yield messages.take() 
    console.log(msg)
  })
}

```

### Don't forget to yield

Can you spot the bug?

```js
const output = newChannel()
const input = newChannel()
go(function* () { 
  output.put("out")
  const msg = yield input.take()
})
``` 

To make `put`/`take` work, you need to `yield` inside of a "go"
routine. As is, this code will run but *silently fail*. Currently, the
only workaround is to use types or write a custom eslint rule that
agressively checks for `take`/`put` usage.
