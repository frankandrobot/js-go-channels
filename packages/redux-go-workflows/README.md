# redux-go-channels

Simple redux middleware for `js-go-channels`.

## Installation

``` bash
npm install js-go-channels
npm install redux-go-channels
```

## Usage

Create a workflow. 

``` js
// workflow.js
export function workflow({getState, dispatch, take}) {
  return function*() {
    for(;;) {
      // wait for ACTION
      const {payload} = yield take('ACTION')
      // get current state
      const state = getState()
      // do something with payload and state
      const result = //...
      // dispatch an action
      dispatch({type: 'RESULT', payload: result})
      // wait for the next ACTION
    }
  }
}
```

Register the workflow.

```js
import {createStore, applyMiddleware} from 'redux'
import {createMiddleware} from 'redux-go-workflows'

import reducer from './reducers' // created as you normally would
import workflow from './workflow' // defined above

// create the workflow middleware
const {register, middleware} = createMiddleware()
// mount it on the Store
const store = createStore(
  reducer,
  applyMiddleware(middleware)
)

// register workflow
register([workflow])
```

That's it!

You can think of a workflow as an (optionally) long-running
process. It's inspired
by [redux-thunk](https://github.com/gaearon/redux-thunk)
and [redux-saga](https://github.com/redux-saga/redux-saga) with
several differences:

- communication with a workflow is possible only by dispatching
  messages (whatever it `take`s). This preserves replayability.
- workflows can only query the store state (`getState`), `dispatch`
  messages, and wait for specific messages (`take`). That's it! No
  complicated API.
