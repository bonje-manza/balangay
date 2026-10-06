# Balangay Personal Finance

Balangay is an offline-first personal finance tracker tracking multi-account liquid balances, cashflow, and spending budgets for Philippine Peso (PHP).

## Language

**Account**:
A liquid financial repository holding money, such as a bank account, e-wallet, physical cash, or credit card.
_Avoid_: Wallet, pocket, fund

**Running Balance**:
The live calculated balance of an account derived from its initial balance combined with all ledger transactions.
_Avoid_: Total, current funds, ledger sum

**Transaction**:
An immutable record of monetary movement belonging to an account at a specific date.
_Avoid_: Entry, record, log

**Balance Adjustment**:
A ledger transaction correcting an account's running balance to reflect actual physical funds after untracked periods, without counting as income, expense, or transfer.
_Avoid_: Balance reset, manual override, reconciliation correction, correction expense

**Adjustment Direction**:
The direction (`increase` or `decrease`) of a balance adjustment indicating whether funds were added or subtracted to reach the target balance.
_Avoid_: Sign, adjustment type, plus/minus

**Target Balance**:
The physical or statement balance entered by the user representing the actual verified funds in an account during reconciliation.
_Avoid_: New balance, ending balance, override amount
