"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeSettlements = computeSettlements;
function computeSettlements(balances) {
    const creditors = balances
        .filter(b => b.net > 0.005)
        .map(b => ({ user_id: b.user_id, net: b.net }))
        .sort((a, b) => b.net - a.net);
    const debtors = balances
        .filter(b => b.net < -0.005)
        .map(b => ({ user_id: b.user_id, net: -b.net }))
        .sort((a, b) => b.net - a.net);
    const transfers = [];
    let ci = 0;
    let di = 0;
    while (ci < creditors.length && di < debtors.length) {
        const amount = Math.min(creditors[ci].net, debtors[di].net);
        if (amount > 0.005) {
            transfers.push({
                from_user_id: debtors[di].user_id,
                to_user_id: creditors[ci].user_id,
                amount: Math.round(amount * 100) / 100,
            });
        }
        creditors[ci].net -= amount;
        debtors[di].net -= amount;
        if (creditors[ci].net < 0.005)
            ci++;
        if (debtors[di].net < 0.005)
            di++;
    }
    return transfers;
}
