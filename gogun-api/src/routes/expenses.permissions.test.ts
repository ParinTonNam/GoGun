import assert from 'node:assert/strict'
import { once } from 'node:events'
import type { AddressInfo } from 'node:net'
import { test, type TestContext } from 'node:test'
import express from 'express'
import prisma from '../lib/prisma'
import { requireTripMember } from '../middleware/trip'
import expensesRouter from './expenses'

// Prisma delegates expose methods through proxies; replace via assignment
// instead of node:test's descriptor-based mock.method.
function stub<T extends object, K extends keyof T, F extends (...args: any[]) => any>(
  t: TestContext, target: T, key: K, implementation: F,
) {
  const original = target[key]
  const mocked = t.mock.fn(implementation)
  target[key] = mocked as unknown as T[K]
  t.after(() => { target[key] = original })
  return mocked
}

async function errorCode(response: globalThis.Response): Promise<string> {
  const body = await response.json() as { error: { code: string } }
  return body.error.code
}

// Exercise the production membership middleware and router without a database.
test('expense permissions', async t => {
  const app = express()
  app.use(express.json())
  app.use((req, _res, next) => {
    req.user = {
      id: 'user-1', username: 'test', email: 'test@example.com',
      display_name: 'Test', avatar_color: 'blue', phone: null,
      is_guest: false, created_at: new Date(),
    }
    next()
  })
  app.use('/trips/:tripId/expenses', requireTripMember, expensesRouter)
  const server = app.listen(0, '127.0.0.1')
  t.after(() => new Promise<void>((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve())
    server.closeAllConnections()
  }))
  await once(server, 'listening')
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/trips/trip-1/expenses`
  const payload = {
    name: 'Lunch', category: 'food', total_amount: 10, currency: 'JPY',
    paid_by_user_id: 'user-1', splits: [{ user_id: 'user-1', amount: 10 }],
  }
  const expense = {
    ...payload, id: 'expense-1', trip_id: 'trip-1', created_at: new Date(),
    paid_by: { id: 'user-1', display_name: 'Test', avatar_color: 'blue' },
  }
  const writes = [
    { method: 'POST', path: '', status: 201 },
    { method: 'PATCH', path: '/expense-1', status: 200 },
    { method: 'DELETE', path: '/expense-1', status: 200 },
  ]

  for (const role of ['organizer', 'member', 'declined', 'outsider']) {
    for (const allowed of [false, true]) {
      await t.test(`${role}, allow_member_expenses=${allowed}`, async t => {
        const membership = stub(t, prisma.tripMember, 'findUnique', async () =>
          role === 'outsider' ? null : {
            id: 'membership-1', trip_id: 'trip-1', user_id: 'user-1',
            role: role === 'organizer' ? 'organizer' : 'member',
            status: role === 'declined' ? 'declined' : 'joined', joined_at: new Date(),
          })
        const trip = stub(t, prisma.trip, 'findUnique', async () => ({
          allow_member_expenses: allowed, allow_member_expense_edit: true, currency: 'JPY',
        }))
        const find = stub(t, prisma.expense, 'findFirst', async () => expense)
        const create = stub(t, prisma.expense, 'create', async () => expense)
        const remove = stub(t, prisma.expense, 'deleteMany', async () => ({ count: 1 }))
        const count = stub(t, prisma.tripMember, 'count', async () => 1)
        stub(t, prisma.transferSlip, 'findMany', async () => [])
        const transaction = stub(t, prisma, '$transaction', async () => expense)
        const canAdd = role === 'organizer' || (role === 'member' && allowed)
        const canEdit = role === 'organizer' || role === 'member'
        for (const route of writes) {
          const response = await fetch(base + route.path, {
            method: route.method, headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
          const permitted = route.method === 'PATCH' ? canEdit : canAdd
          assert.equal(response.status, permitted ? route.status : 403, route.method)
          if (!permitted) assert.equal(await errorCode(response), 'FORBIDDEN')
          else await response.json()
        }
        assert.equal(membership.mock.callCount(), 3)
        assert.equal(create.mock.callCount(), canAdd ? 1 : 0)
        assert.equal(transaction.mock.callCount(), canEdit ? 1 : 0)
        assert.equal(remove.mock.callCount(), canAdd ? 1 : 0)
        assert.equal(find.mock.callCount(), (canEdit ? 1 : 0) + (canAdd ? 1 : 0))
        assert.equal(count.mock.callCount(), (canEdit ? 1 : 0) + (canAdd ? 1 : 0))
        assert.equal(trip.mock.callCount(), role === 'member' ? (allowed ? 4 : 3) : 0)
        if (role === 'member') {
          assert.deepEqual((trip.mock.calls[0].arguments as unknown[])[0], {
            where: { id: 'trip-1' }, select: { allow_member_expenses: true },
          })
        }

        stub(t, prisma.expense, 'findMany', async () => [])
        stub(t, prisma.tripMember, 'findMany', async () => [])
        for (const path of ['', '/balance', '/settlements']) {
          const response = await fetch(base + path)
          assert.equal(response.status, ['organizer', 'member'].includes(role) ? 200 : 403, path)
          await response.json()
        }

        if (canAdd || canEdit) {
          // Authorized requests still reach the existing input validation.
          for (const method of ['POST', 'PATCH']) {
            if (method === 'POST' && !canAdd) continue
            const response = await fetch(base + (method === 'PATCH' ? '/expense-1' : ''), {
              method, headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...payload, total_amount: -1 }),
            })
            assert.equal(response.status, 400)
            assert.equal(await errorCode(response), 'VALIDATION_ERROR')
          }
          assert.equal(create.mock.callCount(), canAdd ? 1 : 0)
          assert.equal(transaction.mock.callCount(), canEdit ? 1 : 0)
        }
      })
    }
  }

  for (const scenario of [
    { name: 'member cannot modify another payer\'s expense', role: 'member', payer: 'user-2', edit: true, status: 403 },
    { name: 'member cannot modify own expense when editing is disabled', role: 'member', payer: 'user-1', edit: false, status: 403 },
    { name: 'organizer can delete another payer\'s expense', role: 'organizer', payer: 'user-2', edit: false, status: 200 },
  ]) {
    await t.test(scenario.name, async t => {
      stub(t, prisma.tripMember, 'findUnique', async () => ({ role: scenario.role, status: 'joined' }))
      stub(t, prisma.trip, 'findUnique', async () => ({
        allow_member_expenses: true, allow_member_expense_edit: scenario.edit,
      }))
      stub(t, prisma.expense, 'findFirst', async () => ({ ...expense, paid_by_user_id: scenario.payer }))
      const remove = stub(t, prisma.expense, 'deleteMany', async () => ({ count: 1 }))
      const transaction = stub(t, prisma, '$transaction', async () => expense)

      for (const method of ['PATCH', 'DELETE']) {
        const response = await fetch(`${base}/expense-1`, {
          method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Updated' }),
        })
        assert.equal(response.status, scenario.status, method)
        if (scenario.status === 403) assert.equal(await errorCode(response), 'FORBIDDEN')
        else await response.json()
      }
      assert.equal(remove.mock.callCount(), scenario.status === 200 ? 1 : 0)
      assert.equal(transaction.mock.callCount(), scenario.status === 200 ? 1 : 0)
      if (scenario.status === 200) {
        assert.deepEqual((remove.mock.calls[0].arguments as unknown[])[0], {
          where: { id: 'expense-1', trip_id: 'trip-1' },
        })
      }
    })
  }

  await t.test('member delete keeps the payer restriction on the database write', async t => {
    stub(t, prisma.tripMember, 'findUnique', async () => ({ role: 'member', status: 'joined' }))
    stub(t, prisma.trip, 'findUnique', async () => ({
      allow_member_expenses: true, allow_member_expense_edit: true,
    }))
    stub(t, prisma.expense, 'findFirst', async () => expense)
    const remove = stub(t, prisma.expense, 'deleteMany', async () => ({ count: 0 }))
    const response = await fetch(`${base}/expense-1`, { method: 'DELETE' })
    assert.equal(response.status, 404)
    assert.equal(await errorCode(response), 'NOT_FOUND')
    assert.deepEqual((remove.mock.calls[0].arguments as unknown[])[0], {
      where: { id: 'expense-1', trip_id: 'trip-1', paid_by_user_id: 'user-1' },
    })
  })

  await t.test('member denied when the trip is missing', async t => {
    stub(t, prisma.tripMember, 'findUnique', async () => ({ role: 'member', status: 'joined' }))
    stub(t, prisma.trip, 'findUnique', async () => null)
    stub(t, prisma.expense, 'findFirst', async () => expense)
    for (const route of writes) {
      const response = await fetch(base + route.path, {
        method: route.method, headers: { 'Content-Type': 'application/json' }, body: '{}',
      })
      assert.equal(response.status, 403)
      assert.equal(await errorCode(response), 'FORBIDDEN')
    }
  })
})
