import { computeSettlements } from './settlements'
type Bill = { paid_by_user_id: string; total_amount: unknown; currency: string; splits: { user_id: string; amount: unknown }[] }
type Payment = { from_user_id: string; to_user_id: string; amount: unknown; currency: string }
export function outstandingTransfers(expenses: Bill[], payments: Payment[]) {
  const groups = new Map<string, Map<string, number>>()
  function add(currency: string, id: string, amount: number) {
    if (!groups.has(currency)) groups.set(currency, new Map())
    const g = groups.get(currency)!; g.set(id, (g.get(id) ?? 0) + amount)
  }
  for (const e of expenses) {
    add(e.currency, e.paid_by_user_id, Number(e.total_amount))
    for (const s of e.splits) add(e.currency, s.user_id, -Number(s.amount))
  }
  for (const p of payments) {
    add(p.currency, p.from_user_id, Number(p.amount))
    add(p.currency, p.to_user_id, -Number(p.amount))
  }
  return [...groups].flatMap(([currency, group]) => computeSettlements([...group].map(([user_id, net]) => ({ user_id, net: Math.round(net * 100) / 100 }))).map(t => ({ ...t, currency })))
}
