# js-go-channels

## Installation

TODO

## Gotchas

### Javascript doesn't have multi-return types

In go, you can write the following

``` go
ch := make(chan string)
go func() {
	val := <-ch
	val, more := <- ch
}()

```

JS is a saner language in this regard (words I never thought I would
write). Instead `js-go-channel` channels return objects of type
`{value, done}`. You can use destructuring and renaming to get the
same result.

```javascript
const ch = newChannel()
go(function*() {
  const {value: msg1} = yield ch.take() //ignore done
  console.log(msg1)
  const {value: msg2, done} = yield ch.take()
  if (!done) {
    console.log(msg2)
  }
})

```

### You can't `yield` inside a callback

Can you spot the bug?

``` js
const elem = //... some DOM element
const ch = newChannel()
elem.addEventListener('mouseup', function() {
  yield ch.put('mouseup')
});
```

If you're using Babel, the above code won't even compile. Instead you
should use an async version of `put` (which can be a good idea since
blocking UI events doesn't really make sense). Under the hood,
`asyncPut` uses an infinite buffer.

``` js
elem.addEventListener('mouseup', function() {
  ch.asyncPut('mouseup') // this works!
});

```

### The common golang synchronization pattern won't work.

```js
func main() {
  const messages = newChannel()
  go(function* () { yield messages.put("ping") })
  const {value: msg} = messages.take()
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
    const {value: msg} = yield messages.take() 
    console.log(msg)
  })
}

```

### Don't forget to `yield`

Can you spot the bug?

```js
const output = newChannel()
const input = newChannel()
go(function* () { 
  output.put("out")
  const {value: msg} = yield input.take()
})
``` 

To make `put`/`take` work, you need to `yield` inside of a "go"
routine. As is, this code will run but *silently fail*. Currently, the
only workaround is to use types or write a custom eslint rule that
agressively checks for `take`/`put` usage.

