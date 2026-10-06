# Balance Adjustments as Dedicated Ledger Transactions

To reconcile account balances after untracked financial periods without falsifying income or expense reports, we represent balance adjustments as explicit ledger transactions rather than overwriting account initial balances or creating separate snapshot tables.

## Status
Accepted

## Context
Users occasionally miss tracking expenses or receipts across several days or weeks, creating discrepancies between real-world balances and Balangay's running balances. The user wants to adjust an account's running balance directly without categorizing the adjustment as an expense, income, or transfer.

## Considered Options
1. **Direct Account `initialBalance` Mutation**: Overwrites the account's starting balance. Rejected because it mutates the account from the beginning of time, distorting past history and eliminating audit trails.
2. **Account Checkpoint Snapshots**: Pinning an account balance to an absolute value at a date. Rejected because it complicates running balance recalculations when historical transactions are backdated or updated.
3. **Explicit Ledger Transaction (`type: 'adjustment'`)**: An auditable transaction that applies an adjustment delta to the account at a specific date, excluded from cashflow and budget analytics.

## Consequences
- Balangay preserves an immutable audit trail of adjustments. If untracked receipts are later found, adjustments can be inspected, updated, or removed.
- Running balance and net worth computations naturally incorporate adjustment deltas.
- Monthly cashflow, daily cashflow charts, and category budgets remain strictly unpolluted by adjustment amounts.
