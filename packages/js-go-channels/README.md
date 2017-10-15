# js-go-channels

## Installation

``` bash
npm install js-go-channels
```

## Usage
If you want to try out js-go-channels, check
out [this REPL](https://repl.it/LooH/25).

### Generators, oh my!
Your app will need to
support
[generators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_Generators) to
use this library. Node.js >= 6 supports this out of the box. Modern
desktop browsers as well. However, if you need to support mobile,
legacy browsers, or legacy Node.js, then you'll need to
use [Babel](https://babeljs.io/) to transpile your code. Please see
the [appendix](#appendix).

## Examples
### Basic Usage

```javascript
import {go, newChannel, close, select, range} from 'js-go-channels';

const ch = newChannel();

go(function*() {
  yield ch.put('hello');
  close(ch);
  // this will throw an error because you can't put on a closed
  // channel
  yield ch.put('world');
});

go(function*() {
  const msg1 = yield ch.take();
  console.log(msg1); // {value: hello, done: false}
  const msg2 = yield ch.take();
  console.log(msg2); // {value: undefined, done: true}
  const msg3 = yield ch.take();
  console.log(msg3); // {value: undefined, done: true}
});
```

### Select

```javascript
import {go, newChannel, close, select, range} from 'js-go-channels';

const ch1 = newChannel();
const ch2 = newChannel();

go(function*() {
  yield ch1.put('hello');
});

go(function*() {
  yield ch2.put('world');
});

go(function*() {
  for(;;) {
    const [msg1, msg2] = yield select(ch1, ch2);
    if (msg1) {
      console.log(msg1); //`{value: hello, done: false}
    }
    if (msg2) {
      console.log(msg2); //`{value: world, done: false}
    }
  }
});


```

### Range

``` javascript
import {go, newChannel, close, select, range} from 'js-go-channels';

const ch = newChannel();

go(function*() {
  for(let i=0; i<10; i++) {
    yield ch.put(i);
  }
});

range(ch)
  .forEach(msg => {
    console.log(msg);
    if (msg === 5) {
      // return false to stop receiving messages
      return false
    }
  });

// output: 1,2,3,4,5
```

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

```javascript
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

```javascript
elem.addEventListener('mouseup', function() {
  ch.asyncPut('mouseup') // this works!
});

```

### The common golang synchronization pattern won't work.

```javascript
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

```javascript
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

```javascript
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
aggressively checks for `take`/`put` usage.

### `for-of` loops don't (yet) support `range`
In go, the code below is valid. That is, `range` converts a channel to
an asynchronous iterator and then the `for` loop can iterate over
it. In Javascript, `for-of` loops do not yet support asynchronous
iterators. Instead we use a custom `forEach`.

``` go
ch := make(chan int)
go func() {
	ch <- 0
	time.Sleep(1*time.Second)
	ch <- 1
	close(ch)
}()
for x := range ch {
	fmt.Println(x)
}
// output: 0, 1
```

JS version:

``` js
const ch = newChannel()
go(function*() {
  yield ch.put(0)
  // recall we have to use asyncPut inside of a callback
  setTimeout(() => ch.asyncPut(1), 1000) 
})
range(ch).forEach(x => {
  console.log(x)
})
```

## <a name="appendix"></a> Appendix
### Legacy Browser support
[babel-preset-env](https://github.com/babel/babel-preset-env) makes it
super easy to support legacy browsers. The following shows a sample
`.babelrc` that compiles for IE 11:

``` json
{
  "legacy": {
    "presets": [
      [
        "env",
        {
          "targets": {
            "browsers": ["ie >= 11"]
          },
          "spec": true,
          "modules": "commonJS",
          "useBuiltIns": "usage"
        }
      ]
    ],
    "plugins": []
  }
}
```

You can then need to
add [babel-polyfill](https://babeljs.io/docs/usage/polyfill/) as a
dependency in the package.json. 

That's it! (You then need to configure webpack or equivalent to use Babel.)

*Note that babel-preset-env replaces the old babel-preset-es2015
plugin.*
