# Offline-First PWA Finance Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 100% offline-first, installable Progressive Web App (PWA) personal finance tracker tailored for the Philippines (PHP ₱ default) featuring multi-account tracking (GCash, Maya, BPI, BDO, Cash, Credit Cards), category budgets, visual analytics, JSON/CSV backup/import, optional PIN privacy lock, and a distinctive "Soft Neo-Brutalism" / "Playful Pastel Bento" design system.

**Architecture:** A client-side Single Page App built with Vite, React 19/18, and TypeScript, backed by Dexie.js (IndexedDB) for reactive, transactional local data storage with zero backend dependencies. Offline resilience and multi-device installability are handled via `vite-plugin-pwa` and Service Workers. Business logic, financial arithmetic, and data transformations are strictly decoupled and built via Test-Driven Development (TDD) using Vitest.

**Tech Stack:** React, TypeScript, Vite, Tailwind CSS, Dexie.js (IndexedDB), Vitest, `@testing-library/react`, Lucide Icons, `vite-plugin-pwa`.

**Spec:** Locked-in MVP specification confirmed during the grill-me protocol session on 2026-09-12.

## Global Constraints

- **Platform:** Progressive Web App (PWA), 100% offline-first, installable on mobile and desktop via Service Worker.
- **Persistence:** Local IndexedDB using Dexie.js. Zero external server requirement.
- **Currency:** Philippine Peso (PHP, `₱`) default with `en-PH` locale formatting.
- **Design Aesthetic:** "Soft Neo-Brutalism" / "Playful Pastel Bento"
  - Base: Warm "Oat Milk" (`#F7F2E8`)
  - Accents: Butter Yellow (`#FFED9E`), Blossom Pink (`#F2C0CA`), Pistachio (`#DAE097`), Sky Blue (`#A6CFF2`)
  - Dark Anchors: Deep obsidian/charcoal (`#111111` / `#124224`) for floating nav, CTAs, key labels
  - Shapes: Flat bento cards, 20px–32px radii, hairline borders, no heavy drop shadows or blur, sticker badges
  - Typography: Clean geometric sans (Plus Jakarta Sans / Outfit) + warm modern serif (Fraunces) accents
- **Testing:** TDD mandatory for all financial calculations, balance mutations, and state transforms (`PROJECT_RULES.md`).
- **Output:** Full unabridged code generation without placeholders (`full-output-enforcement`).

---

### Task 1: Project Scaffolding & Toolchain Setup

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/index.css`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Test: `src/App.test.tsx`

**Interfaces:**
- Produces: Running Vite dev server, Tailwind build with design tokens, Vitest test runner, and PWA manifest.

- [ ] **Step 1: Initialize Git and create `package.json` with dependencies**
Run `git init` and write `package.json` with React, Vite, TypeScript, Tailwind CSS, Dexie, Lucide React, Vitest, and testing library.
- [ ] **Step 2: Configure Tailwind CSS with the Soft Neo-Brutalism design system**
Add `#F7F2E8` (oat milk), `#FFED9E` (butter), `#F2C0CA` (blossom), `#DAE097` (pistachio), `#A6CFF2` (sky), `#111111` (dark anchor) and custom fonts (Plus Jakarta Sans, Fraunces) in `tailwind.config.js`.
- [ ] **Step 3: Configure Vite, PWA manifest, and Vitest test environment**
Create `vite.config.ts`, `vitest.config.ts`, `src/test/setup.ts` (with `fake-indexeddb` mocks).
- [ ] **Step 4: Write failing test in `src/App.test.tsx`**
Verify the app root renders without crashing and mounts the main layout container.
- [ ] **Step 5: Implement minimal `App.tsx` and run tests**
Verify `npm test` passes.
- [ ] **Step 6: Commit**
`git add . && git commit -m "chore: scaffold vite react typescript tailwind vitest pwa toolchain"`

---

### Task 2: Core Domain Types & Financial Math Engine (TDD)

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/domain/money.ts`
- Create: `src/domain/calculations.ts`
- Test: `src/domain/money.test.ts`
- Test: `src/domain/calculations.test.ts`

**Interfaces:**
- Consumes: Nothing
- Produces:
  - `Account`, `Transaction`, `Category`, `Budget`, `UserSettings` types
  - `formatPHP(amount: number): string`
  - `roundMoney(amount: number): number`
  - `calculateAccountBalances(accounts: Account[], transactions: Transaction[]): Map<string, number>`
  - `calculateNetWorth(accounts: Account[], transactions: Transaction[]): number`
  - `calculateMonthlyCashflow(transactions: Transaction[], year: number, month: number): { income: number, expense: number, net: number }`
  - `calculateCategorySpending(transactions: Transaction[], year: number, month: number): Map<string, number>`
  - `calculateBudgetProgress(budgetLimit: number, spentAmount: number): { percent: number, remaining: number, isOverBudget: boolean, isWarning: boolean }`

- [ ] **Step 1: Write failing tests for money formatting and rounding**
Cover negative amounts, zero, decimal precision, and `₱` symbol formatting.
- [ ] **Step 2: Run test to verify it fails**
Run `npx vitest run src/domain/money.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement `src/domain/money.ts` and `src/domain/types.ts`**
Pure functions handling currency and rounding.
- [ ] **Step 4: Run test to verify it passes**
Run `npx vitest run src/domain/money.test.ts`. Expected: PASS.
- [ ] **Step 5: Write failing tests for financial calculations**
Test multi-account balance reconciliation with income, expense, and transfers. Test net worth, monthly cashflow, category spending, and budget status.
- [ ] **Step 6: Run test to verify it fails**
Run `npx vitest run src/domain/calculations.test.ts`. Expected: FAIL.
- [ ] **Step 7: Implement `src/domain/calculations.ts`**
Implement aggregation and balance calculation functions.
- [ ] **Step 8: Run test to verify it passes**
Run `npx vitest run src/domain/calculations.test.ts`. Expected: PASS.
- [ ] **Step 9: Commit**
`git add src/domain && git commit -m "feat: add domain types, money formatting, and financial calculations with 100% test coverage"`

---

### Task 3: Dexie.js Offline Database & Seed Data (TDD)

**Files:**
- Create: `src/storage/db.ts`
- Create: `src/storage/seedData.ts`
- Create: `src/storage/accountRepository.ts`
- Create: `src/storage/transactionRepository.ts`
- Test: `src/storage/db.test.ts`
- Test: `src/storage/repository.test.ts`

**Interfaces:**
- Consumes: `src/domain/types.ts`
- Produces:
  - `FinanceDB` class extending `Dexie`
  - `db` singleton instance
  - `seedDefaultCategories()`, `seedStarterAccounts()`, `loadSampleDemoData()`, `clearAllData()`
  - `createTransaction(tx: Omit<Transaction, 'id'>): Promise<string>` (atomic transaction handling account balances)
  - `createTransfer(fromAccountId: string, toAccountId: string, amount: number, date: string, notes?: string): Promise<string>`

- [ ] **Step 1: Write failing test for database schema, initialization, and seeding**
Test table definitions: `accounts`, `transactions`, `categories`, `settings`. Test default category seeding and Philippine presets (GCash, Maya, BPI, Cash).
- [ ] **Step 2: Run test to verify it fails**
Run `npx vitest run src/storage/db.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement `src/storage/db.ts` and `src/storage/seedData.ts`**
Implement Dexie database with compound indices, versioning, and default seed data.
- [ ] **Step 4: Run test to verify it passes**
Run `npx vitest run src/storage/db.test.ts`. Expected: PASS.
- [ ] **Step 5: Write failing test for atomic transaction and transfer creation**
Test that transfers create linked debit/credit entries or a transfer record that correctly updates both accounts atomically.
- [ ] **Step 6: Run test to verify it fails**
Run `npx vitest run src/storage/repository.test.ts`. Expected: FAIL.
- [ ] **Step 7: Implement repository methods**
Write atomic repository operations.
- [ ] **Step 8: Run test to verify it passes**
Run `npx vitest run src/storage/repository.test.ts`. Expected: PASS.
- [ ] **Step 9: Commit**
`git add src/storage && git commit -m "feat: implement dexie indexeddb persistence, seed presets, and repositories"`

---

### Task 4: Backup, Export & Portability Engine (JSON & CSV) (TDD)

**Files:**
- Create: `src/services/backupService.ts`
- Create: `src/services/csvService.ts`
- Test: `src/services/backupService.test.ts`
- Test: `src/services/csvService.test.ts`

**Interfaces:**
- Consumes: `src/storage/db.ts`, `src/domain/types.ts`
- Produces:
  - `exportFullDatabaseJSON(): Promise<string>`
  - `importFullDatabaseJSON(jsonString: string): Promise<{ success: boolean, count: number }>`
  - `exportTransactionsToCSV(transactions: Transaction[], accounts: Account[], categories: Category[]): string`
  - `importTransactionsFromCSV(csvString: string, defaultAccountId: string): Promise<{ imported: number, errors: string[] }>`

- [ ] **Step 1: Write failing test for JSON database snapshot export and restore**
Test export contains all tables with metadata and that importing restores state completely without corruption.
- [ ] **Step 2: Run test to verify it fails**
Run `npx vitest run src/services/backupService.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement `src/services/backupService.ts`**
Atomic JSON serializer and validated importer with schema version checks.
- [ ] **Step 4: Run test to verify it passes**
Run `npx vitest run src/services/backupService.test.ts`. Expected: PASS.
- [ ] **Step 5: Write failing test for CSV transaction export and import**
Test standard CSV generation with commas, quotes, and date formatting; test parsing GCash/bank CSV lines.
- [ ] **Step 6: Run test to verify it fails**
Run `npx vitest run src/services/csvService.test.ts`. Expected: FAIL.
- [ ] **Step 7: Implement `src/services/csvService.ts`**
RFC 4180 CSV parser and exporter with smart header detection.
- [ ] **Step 8: Run test to verify it passes**
Run `npx vitest run src/services/csvService.test.ts`. Expected: PASS.
- [ ] **Step 9: Commit**
`git add src/services && git commit -m "feat: implement json backup/restore and csv export/import with test suite"`

---

### Task 5: Security & In-App PIN Lock Engine (TDD)

**Files:**
- Create: `src/services/securityService.ts`
- Create: `src/context/SecurityContext.tsx`
- Test: `src/services/securityService.test.ts`
- Test: `src/context/SecurityContext.test.tsx`

**Interfaces:**
- Consumes: `src/storage/db.ts`
- Produces:
  - `hashPin(pin: string): Promise<string>`
  - `verifyPin(pin: string, hash: string): Promise<boolean>`
  - `SecurityContext` providing `{ isLocked, isPinSet, unlock(pin), setPin(pin), removePin(), lock() }`

- [ ] **Step 1: Write failing test for PIN hashing and verification**
Test Web Crypto SHA-256 hashing and comparison.
- [ ] **Step 2: Run test to verify it fails**
Run `npx vitest run src/services/securityService.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement `src/services/securityService.ts`**
Secure hashing and constant-time verification.
- [ ] **Step 4: Run test to verify it passes**
Run `npx vitest run src/services/securityService.test.ts`. Expected: PASS.
- [ ] **Step 5: Write failing test for `SecurityContext` lock state and inactivity**
Test locking on inactivity and unlocking with valid PIN.
- [ ] **Step 6: Run test to verify it fails**
Run `npx vitest run src/context/SecurityContext.test.tsx`. Expected: FAIL.
- [ ] **Step 7: Implement `SecurityContext`**
Provide lock screen state and session storage tracking.
- [ ] **Step 8: Run test to verify it passes**
Run `npx vitest run src/context/SecurityContext.test.tsx`. Expected: PASS.
- [ ] **Step 9: Commit**
`git add src/services/securityService* src/context/SecurityContext* && git commit -m "feat: add pin security service and auth context"`

---

### Task 6: Soft Neo-Brutalism UI Design System & Bento Components

**Files:**
- Create: `src/components/ui/BentoCard.tsx`
- Create: `src/components/ui/StickerBadge.tsx`
- Create: `src/components/ui/AmountDisplay.tsx`
- Create: `src/components/ui/StickerIcons.tsx` (Sparkle ✦, Starburst, Puffy Heart, Petal Pill)
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/Modal.tsx`
- Create: `src/components/navigation/FloatingNavBar.tsx`
- Create: `src/components/security/PinLockScreen.tsx`
- Test: `src/components/ui/BentoCard.test.tsx`
- Test: `src/components/ui/AmountDisplay.test.tsx`

**Interfaces:**
- Consumes: Tailwind tokens, Lucide icons
- Produces:
  - Reusable UI kit strictly respecting the Oat Milk `#F7F2E8` canvas, flat bento cards (20-32px radius, hairline borders, no shadows/blur), pastel accent stickers, Fraunces serif accents, and dark anchor buttons.

- [ ] **Step 1: Write failing tests for BentoCard and AmountDisplay**
Verify custom pastel themes, sticker badge rendering, and PHP currency color formatting.
- [ ] **Step 2: Implement UI component primitives**
Implement `BentoCard`, `StickerBadge`, `AmountDisplay`, `StickerIcons`, `Button`, and `Modal`.
- [ ] **Step 3: Implement `FloatingNavBar` with dark anchor styling and active pill**
Implement floating dock with 5 tabs: Dashboard, Transactions, Budgets, Accounts, Settings, plus floating `+` action button.
- [ ] **Step 4: Implement `PinLockScreen`**
Soft neo-brutalist keypad modal with pastel number buttons and error vibration/shake.
- [ ] **Step 5: Run tests to verify they pass**
Run `npx vitest run src/components`. Expected: PASS.
- [ ] **Step 6: Commit**
`git add src/components && git commit -m "feat: build soft neo-brutalist bento design system components"`

---

### Task 7: Onboarding & First-Run Experience

**Files:**
- Create: `src/components/onboarding/OnboardingModal.tsx`
- Test: `src/components/onboarding/OnboardingModal.test.tsx`

**Interfaces:**
- Consumes: `src/storage/db.ts`, `src/storage/seedData.ts`
- Produces:
  - 2-step setup: confirm Philippine Peso (`₱`), select starter accounts (GCash, BPI, Cash, Maya), and one-click "Try with Sample Data" toggle.

- [ ] **Step 1: Write failing test for OnboardingModal**
Verify starter account selection, demo seed loading, and completion flag saved to `settings`.
- [ ] **Step 2: Implement `OnboardingModal.tsx`**
Warm, charming presentation with playful sticker graphics, account checkboxes, and demo toggle.
- [ ] **Step 3: Run test to verify it passes**
Run `npx vitest run src/components/onboarding/OnboardingModal.test.tsx`. Expected: PASS.
- [ ] **Step 4: Commit**
`git add src/components/onboarding && git commit -m "feat: implement charming 2-step onboarding and demo mode"`

---

### Task 8: Dashboard (Bento Hub) View

**Files:**
- Create: `src/components/dashboard/DashboardView.tsx`
- Create: `src/components/dashboard/NetWorthCard.tsx`
- Create: `src/components/dashboard/CashflowBento.tsx`
- Create: `src/components/dashboard/BudgetQuickMeter.tsx`
- Create: `src/components/dashboard/RecentActivityBento.tsx`
- Test: `src/components/dashboard/DashboardView.test.tsx`

**Interfaces:**
- Consumes: Dexie live queries, calculation engine, Bento components
- Produces:
  - High-end Bento Hub dashboard with Net Worth, monthly Cashflow (Income vs Expense), category budget meters, and recent activity.

- [ ] **Step 1: Write failing test for DashboardView**
Test accurate rendering of net worth, cashflow totals, and recent transaction list.
- [ ] **Step 2: Implement dashboard bento components**
Assemble the Bento grid with Oat Milk base, Butter/Pistachio/Sky/Pink cards, Fraunces serif headlines, and sticker badges.
- [ ] **Step 3: Run test to verify it passes**
Run `npx vitest run src/components/dashboard/DashboardView.test.tsx`. Expected: PASS.
- [ ] **Step 4: Commit**
`git add src/components/dashboard && git commit -m "feat: build dashboard bento hub with live metrics and charts"`

---

### Task 9: Transactions Ledger & Add/Edit Flow

**Files:**
- Create: `src/components/transactions/TransactionsView.tsx`
- Create: `src/components/transactions/TransactionFormModal.tsx`
- Create: `src/components/transactions/TransactionFilterBar.tsx`
- Create: `src/components/transactions/TransactionListItem.tsx`
- Test: `src/components/transactions/TransactionsView.test.tsx`

**Interfaces:**
- Consumes: Dexie live queries, repository methods
- Produces:
  - Searchable, filterable transaction ledger with date groupings
  - Modal form supporting Income, Expense, and Account Transfers
  - Category, tag, and mood tag selectors

- [ ] **Step 1: Write failing test for TransactionsView & Form**
Test adding an expense, adding an income, adding a transfer between GCash and BPI, and filtering by category.
- [ ] **Step 2: Implement Transaction Form & Ledger**
Implement form with validation, numeric keypad formatting, category icons, and transfer account pickers.
- [ ] **Step 3: Run test to verify it passes**
Run `npx vitest run src/components/transactions/TransactionsView.test.tsx`. Expected: PASS.
- [ ] **Step 4: Commit**
`git add src/components/transactions && git commit -m "feat: build transactions ledger, filter bar, and transaction form"`

---

### Task 10: Budgets & Visual Analytics View

**Files:**
- Create: `src/components/budgets/BudgetsAnalyticsView.tsx`
- Create: `src/components/budgets/CategoryBudgetCard.tsx`
- Create: `src/components/budgets/SpendingBreakdownChart.tsx`
- Create: `src/components/budgets/BudgetFormModal.tsx`
- Test: `src/components/budgets/BudgetsAnalyticsView.test.tsx`

**Interfaces:**
- Consumes: Calculations engine, category budgets from Dexie
- Produces:
  - Category spending limit meters with percentage bars, remaining amounts, and warning stickers
  - Visual spending breakdown chart (SVG donut / proportional bar)
  - Edit category budget limits modal

- [ ] **Step 1: Write failing test for BudgetsAnalyticsView**
Test monthly budget limit vs spent calculations, warning states (>80% used), and over-budget alert (>100%).
- [ ] **Step 2: Implement category budget cards and visual SVG breakdown charts**
Implement pastel progress bars, warning sticker badges, and SVG charts without bloated external chart dependencies.
- [ ] **Step 3: Run test to verify it passes**
Run `npx vitest run src/components/budgets/BudgetsAnalyticsView.test.tsx`. Expected: PASS.
- [ ] **Step 4: Commit**
`git add src/components/budgets && git commit -m "feat: build category budgets and visual spending analytics"`

---

### Task 11: Accounts Vault & Transfers View

**Files:**
- Create: `src/components/accounts/AccountsVaultView.tsx`
- Create: `src/components/accounts/AccountCard.tsx`
- Create: `src/components/accounts/AccountFormModal.tsx`
- Create: `src/components/accounts/TransferModal.tsx`
- Test: `src/components/accounts/AccountsVaultView.test.tsx`

**Interfaces:**
- Consumes: Dexie accounts and transactions, repository methods
- Produces:
  - Account cards with balances, custom colors, localized Philippine presets (GCash, Maya, BPI, BDO, Cash, Credit Card)
  - Add/Edit account modal
  - Fast Account-to-Account transfer modal

- [ ] **Step 1: Write failing test for AccountsVaultView and TransferModal**
Test creating a new account, updating balance, and executing an atomic transfer.
- [ ] **Step 2: Implement Accounts Vault components**
Build bento account cards with running balance chips, localized badges, and transfer quick-actions.
- [ ] **Step 3: Run test to verify it passes**
Run `npx vitest run src/components/accounts/AccountsVaultView.test.tsx`. Expected: PASS.
- [ ] **Step 4: Commit**
`git add src/components/accounts && git commit -m "feat: build accounts vault, account manager, and transfer modal"`

---

### Task 12: Settings, Data Backup, and Security View

**Files:**
- Create: `src/components/settings/SettingsView.tsx`
- Create: `src/components/settings/BackupModal.tsx`
- Create: `src/components/settings/CsvImportModal.tsx`
- Test: `src/components/settings/SettingsView.test.tsx`

**Interfaces:**
- Consumes: `backupService`, `csvService`, `SecurityContext`
- Produces:
  - Export full JSON backup & Restore JSON backup
  - Export CSV & Import CSV with account assignment
  - PIN lock settings (set, change, disable, inactivity timeout)
  - Reset Vault & Reload Sample Demo Data

- [ ] **Step 1: Write failing test for SettingsView**
Test trigger of JSON download, file upload restore, and PIN setting changes.
- [ ] **Step 2: Implement SettingsView, BackupModal, and CsvImportModal**
Add clear feedback, confirmations before destructive actions, and download triggers.
- [ ] **Step 3: Run test to verify it passes**
Run `npx vitest run src/components/settings/SettingsView.test.tsx`. Expected: PASS.
- [ ] **Step 4: Commit**
`git add src/components/settings && git commit -m "feat: build settings view with backup, csv import/export, and pin management"`

---

### Task 13: Service Worker PWA Offline Testing & App Integration

**Files:**
- Modify: `src/App.tsx`
- Create: `src/components/pwa/InstallPrompt.tsx`
- Modify: `vite.config.ts`
- Test: `src/integration/AppIntegration.test.tsx`

**Interfaces:**
- Consumes: All views, `SecurityContext`, PWA registration
- Produces:
  - Complete integrated offline-first application with tab switching, floating navigation, lock screen gate, and PWA install prompt.

- [ ] **Step 1: Write integration tests covering end-to-end user workflows**
Test onboarding -> add account -> add transaction -> view on dashboard -> view budgets -> export backup.
- [ ] **Step 2: Implement full integration in `App.tsx`**
Wire views to `FloatingNavBar`, manage active tab state, connect `SecurityContext` lock screen, and mount `InstallPrompt`.
- [ ] **Step 3: Run integration test suite**
Run `npx vitest run src/integration/AppIntegration.test.tsx`. Expected: PASS.
- [ ] **Step 4: Verify production build and PWA service worker generation**
Run `npm run build` and verify output in `dist/` contains `sw.js`, `manifest.webmanifest`, and assets.
- [ ] **Step 5: Commit**
`git add . && git commit -m "feat: complete pwa offline integration and end-to-end verification"`
