import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createLatestRequest } from './latestRequest.ts'

function deferred() {
  let resolve, reject
  const promise = new Promise((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

function setup() {
  const requests = createLatestRequest()
  const state = { items: [], error: null, loading: false }
  const load = (response) => requests.run(() => response.promise, {
    start: () => { state.loading = true; state.error = null },
    success: (items) => { state.items = items },
    error: (error) => { state.error = error.message },
    finish: () => { state.loading = false },
  })
  return { requests, state, load }
}

for (const enabled of [true, false]) {
  test(`ignores an older response after low-stock toggle becomes ${enabled}`, async () => {
    const { state, load } = setup()
    const older = deferred()
    const latest = deferred()
    const pendingOlder = load(older)
    const pendingLatest = load(latest)
    const expected = enabled ? ['low stock'] : ['healthy', 'low stock']
    latest.resolve(expected)
    await pendingLatest
    older.resolve(enabled ? ['healthy', 'low stock'] : ['low stock'])
    await pendingOlder
    assert.deepEqual(state, { items: expected, error: null, loading: false })
  })
}

for (const fails of [true, false]) {
  test(`stale ${fails ? 'failure' : 'success'} cannot end loading or set an error`, async () => {
    const { state, load } = setup()
    const older = deferred()
    const latest = deferred()
    const pendingOlder = load(older)
    const pendingLatest = load(latest)
    if (fails) older.reject(new Error('stale error'))
    else older.resolve(['stale items'])
    await pendingOlder
    assert.deepEqual(state, { items: [], error: null, loading: true })
    latest.resolve(['current items'])
    await pendingLatest
    assert.deepEqual(state, { items: ['current items'], error: null, loading: false })
  })
}

test('an older success cannot replace the latest error', async () => {
  const { state, load } = setup()
  const older = deferred()
  const latest = deferred()
  const pendingOlder = load(older)
  const pendingLatest = load(latest)
  latest.reject(new Error('current error'))
  await pendingLatest
  older.resolve(['stale items'])
  await pendingOlder
  assert.deepEqual(state, { items: [], error: 'current error', loading: false })
})

test('cleanup invalidates pending responses and permits a subsequent load', async () => {
  const { requests, state, load } = setup()
  const older = deferred()
  const pendingOlder = load(older)
  requests.invalidate()
  older.resolve(['stale items'])
  await pendingOlder
  assert.deepEqual(state, { items: [], error: null, loading: true })
  const latest = deferred()
  const pendingLatest = load(latest)
  latest.resolve(['current items'])
  await pendingLatest
  assert.deepEqual(state, { items: ['current items'], error: null, loading: false })
})
