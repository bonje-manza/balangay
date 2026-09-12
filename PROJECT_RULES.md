# Project Rules & Guidelines: Finance Tracker

This repository is governed by strict engineering standards, test-driven development (TDD), high-end UI/UX taste, and systematic review workflows. All contributors and AI agents operating in this codebase must adhere to the rules and skills documented below.

---

## 1. Core Engineering Principles

### 1.1 Planning & Spec Before Implementation
- **Never jump straight into code** for non-trivial features, refactors, or architectural changes.
- Explore user intent and requirements thoroughly. When requirements or design decisions are ambiguous, clarify them or formalize specifications using structured planning skills (`brainstorming`, `writing-plans`, `to-spec`, `grill-me`).
- Break down complex multi-session efforts into trackable, incremental units of work (`to-tickets`, `wayfinder`).

### 1.2 Test-Driven Development (TDD) Mandatory
- All business logic, financial calculations, data transformations, and state mutations must follow the Red-Green-Refactor cycle (`test-driven-development`, `tdd`).
- Write failing tests first. Confirm they fail for expected reasons.
- Implement the minimal code required to pass tests.
- Refactor with tests as a safety net.

### 1.3 Anti-Generic & High-End UI/UX Standards
- The finance tracker interface must feel premium, intentional, and trustworthy (`high-end-visual-design`, `design-taste-frontend`, `minimalist-ui`).
- Strictly reject "AI slop", cookie-cutter templates, overused gradient soup, and lazy card-inside-card nests.
- Establish clean visual hierarchy, deliberate typography scales, calibrated financial palettes (neutral bases with clear semantic accents for credits/debits), and smooth micro-interactions.

### 1.4 Systematic Debugging & Verification
- When encountering a bug or test failure, resist the urge to apply speculative patches. Follow root-cause diagnosis (`systematic-debugging`, `diagnosing-bugs`).
- Always run automated tests and build checks to verify fixes before declaring completion (`verification-before-completion`). Evidence before assertions always.

### 1.5 Code Quality & Output Enforcement
- Complete, unabridged code generation is strictly enforced (`full-output-enforcement`). Placeholders like `// TODO: implement remaining logic` or truncated snippets are prohibited.
- Maintain TypeScript strictness, clean domain boundaries, and explicit contracts (`setup-ts-deep-modules`, `domain-modeling`).

---

## 2. Installed Skill Packages

The following skill suites were installed via the `skills` CLI:

```bash
npx skills add obra/superpowers
npx skills add mattpocock/skills
npx skills add leonxlnx/taste-skill
```

Total installed skills: **64**.

### Superpowers (`obra/superpowers`)
> **Installation Command:** `npx skills add obra/superpowers`  
> **Overview:** Disciplined software engineering workflows including test-driven development, systematic debugging, planning, and code review guardrails.  
> **Total Skills:** 14

| Skill Name | Path | Description |
| :--- | :--- | :--- |
| **[`brainstorming`](.agents/skills/brainstorming/SKILL.md)** | `.agents/skills/brainstorming/SKILL.md` | You MUST use this before any creative work - creating features, building components, adding functionality, or modifying behavior. Explores user intent, requirements and design before implementation. |
| **[`dispatching-parallel-agents`](.agents/skills/dispatching-parallel-agents/SKILL.md)** | `.agents/skills/dispatching-parallel-agents/SKILL.md` | Use when facing 2+ independent tasks that can be worked on without shared state or sequential dependencies |
| **[`executing-plans`](.agents/skills/executing-plans/SKILL.md)** | `.agents/skills/executing-plans/SKILL.md` | Use when you have a written implementation plan to execute in a separate session with review checkpoints |
| **[`finishing-a-development-branch`](.agents/skills/finishing-a-development-branch/SKILL.md)** | `.agents/skills/finishing-a-development-branch/SKILL.md` | Use when implementation is complete, all tests pass, and you need to decide how to integrate the work |
| **[`receiving-code-review`](.agents/skills/receiving-code-review/SKILL.md)** | `.agents/skills/receiving-code-review/SKILL.md` | Use when receiving code review feedback, before implementing suggestions, especially if feedback seems unclear or technically questionable - requires technical rigor and verification, not performative agreement or blind implementation |
| **[`requesting-code-review`](.agents/skills/requesting-code-review/SKILL.md)** | `.agents/skills/requesting-code-review/SKILL.md` | Use when completing tasks, implementing major features, or before merging to verify work meets requirements |
| **[`subagent-driven-development`](.agents/skills/subagent-driven-development/SKILL.md)** | `.agents/skills/subagent-driven-development/SKILL.md` | Use when executing implementation plans with independent tasks in the current session |
| **[`systematic-debugging`](.agents/skills/systematic-debugging/SKILL.md)** | `.agents/skills/systematic-debugging/SKILL.md` | Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes |
| **[`test-driven-development`](.agents/skills/test-driven-development/SKILL.md)** | `.agents/skills/test-driven-development/SKILL.md` | Use when implementing any feature or bugfix, before writing implementation code |
| **[`using-git-worktrees`](.agents/skills/using-git-worktrees/SKILL.md)** | `.agents/skills/using-git-worktrees/SKILL.md` | Use when starting feature work that needs isolation from current workspace or before executing implementation plans - ensures an isolated workspace exists via native tools or git worktree fallback |
| **[`using-superpowers`](.agents/skills/using-superpowers/SKILL.md)** | `.agents/skills/using-superpowers/SKILL.md` | Use when starting any conversation - establishes how to find and use skills, requiring skill invocation before ANY response including clarifying questions |
| **[`verification-before-completion`](.agents/skills/verification-before-completion/SKILL.md)** | `.agents/skills/verification-before-completion/SKILL.md` | Use when about to claim work is complete, fixed, or passing, before committing or creating PRs - requires running verification commands and confirming output before making any success claims; evidence before assertions always |
| **[`writing-plans`](.agents/skills/writing-plans/SKILL.md)** | `.agents/skills/writing-plans/SKILL.md` | Use when you have a spec or requirements for a multi-step task, before touching code |
| **[`writing-skills`](.agents/skills/writing-skills/SKILL.md)** | `.agents/skills/writing-skills/SKILL.md` | Use when creating new skills, editing existing skills, or verifying skills work before deployment |

---

### Matt Pocock Skills (`mattpocock/skills`)
> **Installation Command:** `npx skills add mattpocock/skills`  
> **Overview:** Engineering excellence, spec-driven development, architecture modeling, interactive grilling/clarifications, and codebase design tools.  
> **Total Skills:** 37

| Skill Name | Path | Description |
| :--- | :--- | :--- |
| **[`ask-matt`](.agents/skills/ask-matt/SKILL.md)** | `.agents/skills/ask-matt/SKILL.md` | Ask which skill or flow fits your situation. A router over the skills in this repo. |
| **[`claude-handoff`](.agents/skills/claude-handoff/SKILL.md)** | `.agents/skills/claude-handoff/SKILL.md` | Hand the current conversation off to a fresh background agent that picks up the work immediately. |
| **[`code-review`](.agents/skills/code-review/SKILL.md)** | `.agents/skills/code-review/SKILL.md` | Review the changes since a fixed point (commit, branch, tag, or merge-base) along two axes: Standards (does the code follow this repo's documented coding standards?) and Spec (does the code match what the originating issue/spec asked for?). Runs both reviews in parallel sub-agents and reports them side by side. Use when the user wants to review a branch, a PR, work-in-progress changes, or asks to \"review since X\". |
| **[`codebase-design`](.agents/skills/codebase-design/SKILL.md)** | `.agents/skills/codebase-design/SKILL.md` | Shared vocabulary for designing deep modules. Use when the user wants to design or improve a module's interface, find deepening opportunities, decide where a seam goes, make code more testable or AI-navigable, or when another skill needs the deep-module vocabulary. |
| **[`diagnosing-bugs`](.agents/skills/diagnosing-bugs/SKILL.md)** | `.agents/skills/diagnosing-bugs/SKILL.md` | Diagnosis loop for hard bugs and performance regressions. Use when the user says "diagnose"/"debug this", or reports something broken/throwing/failing/slow. |
| **[`domain-modeling`](.agents/skills/domain-modeling/SKILL.md)** | `.agents/skills/domain-modeling/SKILL.md` | Build and sharpen a project's domain model. Use when discussing codebase terminology, writing or editing a CONTEXT.md, or recording or editing an ADR. |
| **[`git-guardrails-claude-code`](.agents/skills/git-guardrails-claude-code/SKILL.md)** | `.agents/skills/git-guardrails-claude-code/SKILL.md` | Set up Claude Code hooks to block dangerous git commands (push, reset --hard, clean, branch -D, etc.) before they execute. Use when user wants to prevent destructive git operations, add git safety hooks, or block git push/reset in Claude Code. |
| **[`grill-me`](.agents/skills/grill-me/SKILL.md)** | `.agents/skills/grill-me/SKILL.md` | A relentless interview to sharpen a plan or design. |
| **[`grill-with-docs`](.agents/skills/grill-with-docs/SKILL.md)** | `.agents/skills/grill-with-docs/SKILL.md` | A relentless interview to sharpen a plan or design, which also creates docs (ADR's and glossary) as we go. |
| **[`grilling`](.agents/skills/grilling/SKILL.md)** | `.agents/skills/grilling/SKILL.md` | Grill the user relentlessly about a plan, decision, or idea. Use when the user wants to stress-test their thinking, or uses any 'grill' trigger phrases. |
| **[`handoff`](.agents/skills/handoff/SKILL.md)** | `.agents/skills/handoff/SKILL.md` | Compact the current conversation into a handoff document for another agent to pick up. |
| **[`implement`](.agents/skills/implement/SKILL.md)** | `.agents/skills/implement/SKILL.md` | Implement a piece of work based on a spec or set of tickets. |
| **[`implement-spec`](.agents/skills/implement-spec/SKILL.md)** | `.agents/skills/implement-spec/SKILL.md` | Implement a specification in code. |
| **[`improve-codebase-architecture`](.agents/skills/improve-codebase-architecture/SKILL.md)** | `.agents/skills/improve-codebase-architecture/SKILL.md` | Scan a codebase for deepening opportunities, present them as a visual HTML report, then grill through whichever one you pick. |
| **[`loop-me`](.agents/skills/loop-me/SKILL.md)** | `.agents/skills/loop-me/SKILL.md` | Grill me about specs for the workflows I want to build, within this workspace. |
| **[`migrate-to-shoehorn`](.agents/skills/migrate-to-shoehorn/SKILL.md)** | `.agents/skills/migrate-to-shoehorn/SKILL.md` | Migrate test files from `as` type assertions to @total-typescript/shoehorn. Use when user mentions shoehorn, wants to replace `as` in tests, or needs partial test data. |
| **[`prototype`](.agents/skills/prototype/SKILL.md)** | `.agents/skills/prototype/SKILL.md` | Build a throwaway prototype to answer a design question. Use when the user wants to sanity-check whether a state model or logic feels right, or explore what a UI should look like. |
| **[`research`](.agents/skills/research/SKILL.md)** | `.agents/skills/research/SKILL.md` | Investigate a question against high-trust primary sources and capture the findings as a Markdown file in the repo. Use when the user wants a topic researched, docs or API facts gathered, or reading legwork delegated to a background agent. |
| **[`resolving-merge-conflicts`](.agents/skills/resolving-merge-conflicts/SKILL.md)** | `.agents/skills/resolving-merge-conflicts/SKILL.md` | Use when you need to resolve an in-progress git merge/rebase conflict. |
| **[`retro`](.agents/skills/retro/SKILL.md)** | `.agents/skills/retro/SKILL.md` | Conduct a retrospective on a coding session. |
| **[`scaffold-exercises`](.agents/skills/scaffold-exercises/SKILL.md)** | `.agents/skills/scaffold-exercises/SKILL.md` | Create exercise directory structures with sections, problems, solutions, and explainers that pass linting. Use when user wants to scaffold exercises, create exercise stubs, or set up a new course section. |
| **[`setup-matt-pocock-skills`](.agents/skills/setup-matt-pocock-skills/SKILL.md)** | `.agents/skills/setup-matt-pocock-skills/SKILL.md` | Configure this repo for the engineering skills: set up its issue tracker, triage label vocabulary, and domain doc layout. Run once before first use of the other engineering skills. |
| **[`setup-pre-commit`](.agents/skills/setup-pre-commit/SKILL.md)** | `.agents/skills/setup-pre-commit/SKILL.md` | Set up Husky pre-commit hooks with lint-staged (Prettier), type checking, and tests in the current repo. Use when user wants to add pre-commit hooks, set up Husky, configure lint-staged, or add commit-time formatting/typechecking/testing. |
| **[`setup-ts-deep-modules`](.agents/skills/setup-ts-deep-modules/SKILL.md)** | `.agents/skills/setup-ts-deep-modules/SKILL.md` | Wire dependency-cruiser into a TypeScript repo so each package is a deep module, with implementation hidden in subfolders and reachable only through its entry-point files. User-invoked. |
| **[`tdd`](.agents/skills/tdd/SKILL.md)** | `.agents/skills/tdd/SKILL.md` | Test-driven development. Use when the user wants to build features or fix bugs test-first, mentions "red-green-refactor", or wants integration tests. |
| **[`teach`](.agents/skills/teach/SKILL.md)** | `.agents/skills/teach/SKILL.md` | Teach the user a new skill or concept, within this workspace. |
| **[`to-questionnaire`](.agents/skills/to-questionnaire/SKILL.md)** | `.agents/skills/to-questionnaire/SKILL.md` | Turn a decision you can't fully answer into a questionnaire for someone else to fill in. |
| **[`to-spec`](.agents/skills/to-spec/SKILL.md)** | `.agents/skills/to-spec/SKILL.md` | Turn the current conversation into a spec and publish it to the project issue tracker: no interview, just synthesis of what you've already discussed. |
| **[`to-tickets`](.agents/skills/to-tickets/SKILL.md)** | `.agents/skills/to-tickets/SKILL.md` | Break a plan, spec, or the current conversation into a set of tracer-bullet tickets, each declaring its blocking edges, published to the configured tracker (edges as text in one file per ticket locally, or native blocking links on a real tracker). |
| **[`triage`](.agents/skills/triage/SKILL.md)** | `.agents/skills/triage/SKILL.md` | Move issues and external PRs through a state machine of triage roles, categorise, verify, grill if needed, and write agent-ready briefs. |
| **[`wait-what`](.agents/skills/wait-what/SKILL.md)** | `.agents/skills/wait-what/SKILL.md` | Stop. That last message did not land: re-pitch it. |
| **[`wayfinder`](.agents/skills/wayfinder/SKILL.md)** | `.agents/skills/wayfinder/SKILL.md` | Plan a huge chunk of work (more than one agent session can hold) as a shared map of decision tickets on your issue tracker, and resolve them one at a time until the way to the destination is clear. |
| **[`wizard`](.agents/skills/wizard/SKILL.md)** | `.agents/skills/wizard/SKILL.md` | Generate an interactive bash wizard that walks a human through steps only they can perform. Use when provisioning infrastructure, setting up credentials or CI secrets, walking an unfamiliar third-party dashboard, or running a one-off migration or cutover. Don't invoke this for steps the agent can perform itself. |
| **[`writing-beats`](.agents/skills/writing-beats/SKILL.md)** | `.agents/skills/writing-beats/SKILL.md` | Writing, exploit; assemble raw material into a journey of beats, grounding each term before a beat leans on it. |
| **[`writing-for-agents`](.agents/skills/writing-for-agents/SKILL.md)** | `.agents/skills/writing-for-agents/SKILL.md` | Writing documents for agents. Use when creating or editing skills, or modifying AGENTS.md or CLAUDE.md. |
| **[`writing-fragments`](.agents/skills/writing-fragments/SKILL.md)** | `.agents/skills/writing-fragments/SKILL.md` | Writing, explore: mine raw fragments, no structure yet. |
| **[`writing-shape`](.agents/skills/writing-shape/SKILL.md)** | `.agents/skills/writing-shape/SKILL.md` | Writing, exploit: shape raw material into an article, paragraph by paragraph. |

---

### Taste Skill (`leonxlnx/taste-skill`)
> **Installation Command:** `npx skills add leonxlnx/taste-skill`  
> **Overview:** High-end visual design systems, anti-slop aesthetic standards, full output enforcement, responsive layout direction, and motion guidelines.  
> **Total Skills:** 13

| Skill Name | Path | Description |
| :--- | :--- | :--- |
| **[`brandkit`](.agents/skills/brandkit/SKILL.md)** | `.agents/skills/brandkit/SKILL.md` | Premium brand-kit image generation skill for creating high-end brand-guidelines boards, logo systems, identity decks, and visual-world presentations. Trained for minimalist, cinematic, editorial, dark-tech, luxury, cultural, security, gaming, developer-tool, and consumer-app brand systems. Optimized for intentional logo concepting, refined composition, sparse typography, strong symbolic meaning, premium mockups, art-directed imagery, and flexible grid layouts. |
| **[`design-taste-frontend`](.agents/skills/design-taste-frontend/SKILL.md)** | `.agents/skills/design-taste-frontend/SKILL.md` | Anti-slop frontend skill for landing pages, portfolios, and redesigns. The agent reads the brief, infers the right design direction, and ships interfaces that do not look templated. Real design systems when applicable, audit-first on redesigns, strict pre-flight check. |
| **[`design-taste-frontend-v1`](.agents/skills/design-taste-frontend-v1/SKILL.md)** | `.agents/skills/design-taste-frontend-v1/SKILL.md` | The original v1 taste-skill, preserved for projects depending on its exact behavior. The current default is `design-taste-frontend` (v2 experimental), which is a substantial rewrite. Use this v1 install name only if you need exact backward compatibility. |
| **[`full-output-enforcement`](.agents/skills/full-output-enforcement/SKILL.md)** | `.agents/skills/full-output-enforcement/SKILL.md` | Overrides default LLM truncation behavior. Enforces complete code generation, bans placeholder patterns, and handles token-limit splits cleanly. Apply to any task requiring exhaustive, unabridged output. |
| **[`gpt-taste`](.agents/skills/gpt-taste/SKILL.md)** | `.agents/skills/gpt-taste/SKILL.md` | Elite UX/UI & Advanced GSAP Motion Engineer. Enforces Python-driven true randomization for layout variance, strict AIDA page structure, wide editorial typography (bans 6-line wraps), gapless bento grids, strict GSAP ScrollTriggers (pinning, stacking, scrubbing), inline micro-images, and massive section spacing. |
| **[`high-end-visual-design`](.agents/skills/high-end-visual-design/SKILL.md)** | `.agents/skills/high-end-visual-design/SKILL.md` | Teaches the AI to design like a high-end agency. Defines the exact fonts, spacing, shadows, card structures, and animations that make a website feel expensive. Blocks all the common defaults that make AI designs look cheap or generic. |
| **[`image-to-code`](.agents/skills/image-to-code/SKILL.md)** | `.agents/skills/image-to-code/SKILL.md` | Elite website image-to-code skill for Codex. For visually important web tasks, it must first generate the design image(s) itself, deeply analyze them, then implement the website to match them as closely as possible. In Codex, it must prefer large, readable, section-specific images instead of tiny compressed boards, generate fresh standalone images for sections or detail views instead of cropping old ones, avoid lazy under-generation, avoid cards-inside-cards-inside-cards UI, and keep the hero clean, spacious, readable, and visible on a small laptop. |
| **[`imagegen-frontend-mobile`](.agents/skills/imagegen-frontend-mobile/SKILL.md)** | `.agents/skills/imagegen-frontend-mobile/SKILL.md` | Elite mobile app image-generation skill for creating premium, app-native screen concepts and flows. Designed for iOS, Android, and cross-platform mobile products. Prioritizes clean hierarchy, comfortably readable text, strong multi-screen consistency, controlled color palettes, non-generic creative direction, textured surfaces, image-led composition, tasteful custom iconography, and clean phone mockup framing. By default, screens should be shown inside a subtle premium iPhone or similar phone mockup with a visible frame, while the main focus stays on the app content itself. This skill generates images only. It does not write code. |
| **[`imagegen-frontend-web`](.agents/skills/imagegen-frontend-web/SKILL.md)** | `.agents/skills/imagegen-frontend-web/SKILL.md` | Elite frontend image-direction skill for generating premium, conversion-aware website design references. CRITICAL OUTPUT RULE — generate ONE separate horizontal image FOR EVERY section. A landing page with 8 sections produces 8 images. Never compress multiple sections into one image. Enforces composition variety (not always left-text / right-image), background-image freedom, varied CTAs, varied hero scales (giant / mid / mini minimalist), narrative concept spine, second-read moments, and a single consistent palette across all images. Optimized for landing pages, marketing sites, and product comps that developers or coding models can accurately recreate. |
| **[`industrial-brutalist-ui`](.agents/skills/industrial-brutalist-ui/SKILL.md)** | `.agents/skills/industrial-brutalist-ui/SKILL.md` | Raw mechanical interfaces fusing Swiss typographic print with military terminal aesthetics. Rigid grids, extreme type scale contrast, utilitarian color, analog degradation effects. For data-heavy dashboards, portfolios, or editorial sites that need to feel like declassified blueprints. |
| **[`minimalist-ui`](.agents/skills/minimalist-ui/SKILL.md)** | `.agents/skills/minimalist-ui/SKILL.md` | Clean editorial-style interfaces. Warm monochrome palette, typographic contrast, flat bento grids, muted pastels. No gradients, no heavy shadows. |
| **[`redesign-existing-projects`](.agents/skills/redesign-existing-projects/SKILL.md)** | `.agents/skills/redesign-existing-projects/SKILL.md` | Upgrades existing websites and apps to premium quality. Audits current design, identifies generic AI patterns, and applies high-end design standards without breaking functionality. Works with any CSS framework or vanilla CSS. |
| **[`stitch-design-taste`](.agents/skills/stitch-design-taste/SKILL.md)** | `.agents/skills/stitch-design-taste/SKILL.md` | Semantic Design System Skill for Google Stitch. Generates agent-friendly DESIGN.md files that enforce premium, anti-generic UI standards — strict typography, calibrated color, asymmetric layouts, perpetual micro-motion, and hardware-accelerated performance. |

---

## 3. Workflow & Skill Mapping Matrix

Refer to this matrix when executing tasks within this project:

| Phase | Recommended Skills |
| :--- | :--- |
| **Ideation & Brainstorming** | [`brainstorming`](.agents/skills/brainstorming/SKILL.md), [`grill-me`](.agents/skills/grill-me/SKILL.md), [`writing-fragments`](.agents/skills/writing-fragments/SKILL.md) |
| **Specifications & Planning** | [`writing-plans`](.agents/skills/writing-plans/SKILL.md), [`to-spec`](.agents/skills/to-spec/SKILL.md), [`to-tickets`](.agents/skills/to-tickets/SKILL.md), [`wayfinder`](.agents/skills/wayfinder/SKILL.md) |
| **Architecture & Modeling** | [`codebase-design`](.agents/skills/codebase-design/SKILL.md), [`domain-modeling`](.agents/skills/domain-modeling/SKILL.md), [`setup-ts-deep-modules`](.agents/skills/setup-ts-deep-modules/SKILL.md) |
| **UI/UX & Frontend Design** | [`design-taste-frontend`](.agents/skills/design-taste-frontend/SKILL.md), [`high-end-visual-design`](.agents/skills/high-end-visual-design/SKILL.md), [`minimalist-ui`](.agents/skills/minimalist-ui/SKILL.md), [`industrial-brutalist-ui`](.agents/skills/industrial-brutalist-ui/SKILL.md), [`brandkit`](.agents/skills/brandkit/SKILL.md), [`stitch-design-taste`](.agents/skills/stitch-design-taste/SKILL.md) |
| **Feature Implementation** | [`test-driven-development`](.agents/skills/test-driven-development/SKILL.md), [`tdd`](.agents/skills/tdd/SKILL.md), [`implement`](.agents/skills/implement/SKILL.md), [`executing-plans`](.agents/skills/executing-plans/SKILL.md), [`subagent-driven-development`](.agents/skills/subagent-driven-development/SKILL.md) |
| **Debugging & Problem Solving** | [`systematic-debugging`](.agents/skills/systematic-debugging/SKILL.md), [`diagnosing-bugs`](.agents/skills/diagnosing-bugs/SKILL.md), [`resolving-merge-conflicts`](.agents/skills/resolving-merge-conflicts/SKILL.md) |
| **Review, Verification & Polish** | [`verification-before-completion`](.agents/skills/verification-before-completion/SKILL.md), [`requesting-code-review`](.agents/skills/requesting-code-review/SKILL.md), [`receiving-code-review`](.agents/skills/receiving-code-review/SKILL.md), [`full-output-enforcement`](.agents/skills/full-output-enforcement/SKILL.md) |
| **Branch & Git Management** | [`finishing-a-development-branch`](.agents/skills/finishing-a-development-branch/SKILL.md), [`using-git-worktrees`](.agents/skills/using-git-worktrees/SKILL.md), [`setup-pre-commit`](.agents/skills/setup-pre-commit/SKILL.md) |

---

## 4. Operational Guardrails

1. **Evidence First:** Do not assert a fix or feature works without running the test suite or command output to prove it.
2. **Preserve Context:** When handing off or switching sessions, use structured summaries or handoff skills ([`handoff`](.agents/skills/handoff/SKILL.md), [`claude-handoff`](.agents/skills/claude-handoff/SKILL.md)).
3. **No Unfinished Output:** Never truncate files or leave placeholders (`full-output-enforcement`).
4. **Skill Updates:** When adding new skills via `npx skills add`, keep `PROJECT_RULES.md` and `skills-lock.json` updated.
