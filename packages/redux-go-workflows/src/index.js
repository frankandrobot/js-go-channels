import {checkGenerator, LinkedListBuffer} from 'js-go-channels'


const takeRequest = 'reduxTake'
const take = actionType => ({
  type: takeRequest,
  payload: {actionType}
})
const slurp = (takeRequests, iterator, nextValue) => {
  const {value, done} = iterator.next(nextValue)
  
  if (done) {
    return
  }
  if (value.type !== takeRequest) {
    throw new Error(`Unsupported request ${value}`)
  }
  const {payload: {actionType}} = value

  // save in takeRequests
  takeRequests[actionType] = takeRequests[actionType] || new LinkedListBuffer()
  takeRequests[actionType].add({iterator})
}

export function createMiddleware() {
  let _dispatch = () => { throw new Error('unsupported') }
  let _getState = () => { throw new Error('unsupported') }
  const dispatch = (...args) => _dispatch(...args)
  const getState = () => _getState()
  const takeRequests = {}
  
  return {
    register(...generatorFns) {
      for(const generatorFn of generatorFns) {
        const generator = generatorFn({dispatch, getState, take})
        const iterator = checkGenerator(generator)
      
        slurp(takeRequests, iterator)
      }
    },
  
    middleware({dispatch: d, getState: g}) {
      _dispatch = d
      _getState = g
      return next => action => {
        const pending = takeRequests[action.type]

        if (pending) {
          const {iterator} = pending.pop() || {}

          if (iterator) {
            slurp(takeRequests, iterator, action)
          }
        }
        return next(action)
      }
    },
  }
}
