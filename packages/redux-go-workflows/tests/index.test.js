import test from 'tape'

import configureStore from 'redux-mock-store'
import {createMiddleware} from '../src/index'


const simple = ({dispatch, take}) => function*() {
  const action = yield take('ACTION')

  dispatch({type: 'DONE', payload: action})
}


const full = ({getState, dispatch, take}) => function*() {
  yield take('ACTION')

  dispatch({type: 'PUT1'})
  dispatch({type: 'PUT2'})
  const payload = getState()

  dispatch({type: 'PUT3', payload})
  yield take('PAUSE')
  dispatch({type: 'RESUMED'})
}


test('simple transaction works', function(t) {
  t.plan(1)
  // setup redux
  const middleware = createMiddleware()
  const mockStore = configureStore([middleware.middleware])
  
  middleware.register(simple)
  const initialState = {}
  const store = mockStore(initialState)

  // go
  store.dispatch({type: 'ACTION'})
  const action = store.getActions().find(x => x.type === 'DONE')

  t.deepEqual(action, {type: 'DONE', payload: {type: 'ACTION'}})
})


test('complex transaction works', function (t) {
  t.plan(4)
  // setup redux
  const middleware = createMiddleware()
  const mockStore = configureStore([middleware.middleware])
  
  middleware.register(full)
  const initialState = {state: 'da state'}
  const store = mockStore(initialState)

  store.dispatch({type: 'ACTION'})
  const actions = store.getActions()

  t.equal(actions[0].type, 'PUT1')
  t.equal(actions[1].type, 'PUT2')
  t.deepEqual(actions[2], {type: 'PUT3', payload: {state: 'da state'}})
  store.dispatch({type: 'PAUSE'})
  const actions2 = store.getActions()

  t.equal(actions2.find(x => x.type === 'RESUMED') !== null, true)
})

