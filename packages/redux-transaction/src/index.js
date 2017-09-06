// public API
// ==================================

export function take(actionType) {
  return new TakeRequest(actionType)
}

export function put(action) {
  return new PutRequest(action)
}

export function getState() {
  return new GetStateRequest()
}

class TakeRequest {
  constructor(actionType) {
    this.actionType = actionType
  }
}

class PutRequest {
  constructor(action) {
    this.action = action
  }
}

class GetStateRequest {}

// Middleware
// =======================================

export function createTransactionMiddleware() {
  const transactions = []

  return {
    registerTransaction(generator) {
      // check if generator
      if (!generator || typeof generator !== 'function' ) {
        throw new Error('Need a generator');
      }
      const iterator = generator()
      if (!iterator || typeof iterator[Symbol.iterator] !== 'function' ) {
        throw new Error('Need an iterator');
      }
      transactions.push({
        iterator: generator(),
        request: undefined,
      })
    },
  
    transactionMiddleware({dispatch, getState}) {
      return next => action => {
        process({dispatch, getState, transactions, action})
        return next(action)
      }
    },
  }
}

/**
 * Get the next value and pass an optional returnValue to the
 * iterator.
 */
function nextRequest(iterator, returnValue) {
  const {value, done} = iterator.next(returnValue)
  return {value, done}
}

function process({dispatch, getState, transactions, action}) {
  // first get the requests
  transactions.forEach(transaction => {
    const {request, iterator} = transaction
    if (!request) {
      const {value, done} = nextRequest(iterator)
      Object.assign(transaction, {request: value, done})
    }
  })
  // Puts are async
  const asyncPuts = []
  transactions.forEach(transaction => {
    const {iterator} = transaction
    // keep going until you get a take that doens't match or we reach
    // the end of the iterator
    for(;;) {
      const {request, done} = transaction
      if (done) {
        break;
      } else if (request instanceof TakeRequest &&
                 request.actionType !== action.type) {
        break;
      } else if (request instanceof TakeRequest &&
          request.actionType === action.type) { // we found a winner!
          // Return the value to the iterator and get the next request.
          // Yea this is wierd but this is how iterators work.
          const {value, done} = nextRequest(iterator, action)
          Object.assign(transaction, {request: value, done})
      } else if (request instanceof PutRequest) {
        asyncPuts.push(request.action)
        // Then get the next request
        const {value, done} = nextRequest(iterator)
        Object.assign(transaction, {request: value, done})
      } else if (request instanceof GetStateRequest) {
        const state = getState()
        const {value, done} = nextRequest(iterator, state)
        Object.assign(transaction, {request: value, done})
      }
    }
  })
  asyncPuts.forEach(action => dispatch(action))
}
