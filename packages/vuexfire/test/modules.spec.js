import test from 'ava'
import Vue from 'vue'
import Vuex from 'vuex'
import { MockFirebase } from 'firebase-mock'

import {
  firebaseMutations,
  firebaseAction,
} from '../src'

const root = new MockFirebase()

test.before(t => {
  Vue.use(Vuex)
})

const itemsActions = {
  setItemsRef: firebaseAction(({ bindFirebaseRef }, ref) => {
    bindFirebaseRef('items', ref)
  }),
  unbindItemsRef: firebaseAction(({ unbindFirebaseRef }) => {
    unbindFirebaseRef('items')
  }),
}

test.beforeEach(t => {
  t.context.store = new Vuex.Store({
    mutations: firebaseMutations,
    modules: {
      named: {
        namespaced: true,
        state: { items: [] },
        actions: itemsActions,
      },
      todos: {
        state: {
          items: [],
          options: null,
        },
        actions: Object.assign({
          setOptionsRef: firebaseAction(({ bindFirebaseRef }, ref) => {
            bindFirebaseRef('options', ref)
          }),
          unbindOptionsRef: firebaseAction(({ unbindFirebaseRef }) => {
            unbindFirebaseRef('options')
          }),
        }, itemsActions),
      },
    },
  })

  // Create a fresh ref for the test
  const ref = root.push({})
  root.flush()
  t.context.ref = ref
})

test('binds an array to a module', t => {
  t.context.store.dispatch('setItemsRef', t.context.ref)
  t.context.ref.set({
    first: { index: 0 },
    second: { index: 1 },
    third: { index: 2 },
  })
  t.context.ref.flush()

  t.deepEqual(t.context.store.state.todos.items, [
    { '.key': 'first', index: 0 },
    { '.key': 'second', index: 1 },
    { '.key': 'third', index: 2 },
  ])
  t.context.ref.child('first').child('index').set(3)
  t.context.ref.flush()
  t.deepEqual(t.context.store.state.todos.items[0].index, 3)
})

test('works on namespaced modules', t => {
  t.context.store.dispatch('named/setItemsRef', t.context.ref)
  t.context.ref.set({
    first: { index: 0 },
    second: { index: 1 },
    third: { index: 2 },
  })
  t.context.ref.flush()

  t.deepEqual(t.context.store.state.named.items, [
    { '.key': 'first', index: 0 },
    { '.key': 'second', index: 1 },
    { '.key': 'third', index: 2 },
  ])
  t.context.ref.child('first').child('index').set(3)
  t.context.ref.flush()
  t.deepEqual(t.context.store.state.named.items[0].index, 3)
})
