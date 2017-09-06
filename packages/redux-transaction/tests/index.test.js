import test from 'tape'

import configureStore from 'redux-mock-store'
import {take, put, getState, createTransactionMiddleware} from '../src/index'


function *simple() {
  const action = yield take('ACTION')
  yield put({type: 'DONE'})
}

function *full() {
  const action = yield take('ACTION')
  yield put({type: 'PUT1'})
  yield put({type: 'PUT2'})
  const payload = yield getState()
  yield put({type: 'PUT3', payload})
  yield take('PAUSE')
  yield put({type: 'RESUMED'})
}

test('simple transaction works', function (t) {
  t.plan(1)
  // setup redux
  const middleware = createTransactionMiddleware()
  const mockStore = configureStore([middleware.transactionMiddleware])
  middleware.registerTransaction(simple)
  const initialState = {}
  const store = mockStore(initialState)
  // go
  store.dispatch({type: 'ACTION'})
  const actions = store.getActions().map(x => x.type)
  t.equal(actions.find(x => x === 'DONE'), 'DONE')
});

test('complex transaction works', function (t) {
  t.plan(4)
  // setup redux
  const middleware = createTransactionMiddleware()
  const mockStore = configureStore([middleware.transactionMiddleware])
  middleware.registerTransaction(full)
  const initialState = {state: 'da state'}
  const store = mockStore(initialState)
  store.dispatch({type: 'ACTION'})
  const actions = store.getActions()
  t.equal(actions[0].type, 'PUT1')
  t.equal(actions[1].type, 'PUT2')
  t.deepEqual(actions[2], {type: 'PUT3', payload: {state: 'da state'}})
  store.dispatch({type: 'PAUSE'})
  const actions2 = store.getActions()
  t.equal(actions2.find(x => x.type === 'RESUMED') != null, true)
});
