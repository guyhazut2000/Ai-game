# Development Workflow

This document is the **single source of truth** for how to work on features, branches, pull requests, and documentation. All Cursor commands, skills, and agents must follow these rules.

---

## 1. Check Branch and Repo State

Before starting any feature or fix:

**Rules for agents:**

1. **Verify current branch:** Confirm you are on the correct base branch (e.g. `main` or `develop`). If you need to start a new feature, you should be on the base branch before creating a new branch.
2. **Ensure clean or committed state:** No uncommitted changes that would be lost, or commit/stash them first. Run `git status` and resolve any dirty state.
3. **Pull latest:** Run `git pull` (or `git pull --rebase` if that is the project policy) so the base branch is up to date.

**Steps:**

1. Run `git status` and note current branch and any uncommitted files.
2. If there are uncommitted changes, either commit them (with a clear message) or stash them (`git stash`).
3. Run `git pull` from the current branch to get latest changes.

---

## 2. Work on a Branch

All feature work and non-trivial fixes happen on a **feature or fix branch**, not directly on `main`.

**Rules for agents:**

1. **Branch naming:** Use `feature/short-name` for new features and `fix/short-name` for bug fixes (e.g. `feature/combat-damage`, `fix/chat-disconnect`).
2. **Create branch from base:** Create the new branch from the up-to-date base (e.g. `main` or `develop`).
3. **Implement and test:** Make changes; run tests and lint (e.g. `npm run test`, `npm run lint`) before committing.
4. **Commit messages:** Use clear, present-tense messages (e.g. "Add damage formula to combat engine", "Fix WebSocket reconnect on disconnect"). One logical change per commit when practical.

**Steps:**

1. From the base branch, run `git checkout -b feature/my-feature` (or `fix/my-fix`).
2. Implement the change. Run tests and lint; fix any failures.
3. Commit with a clear message: `git add ...` then `git commit -m "Short description"`.
4. Repeat as needed for additional logical commits.

---

## 3. Merge Strategy

**Rules for agents:**

1. **Do not merge directly to `main`** in normal workflow. All integration happens via **pull requests** (see Section 4).
2. **Solo / learning exception:** If the project is solo and the maintainer explicitly wants to merge locally without a PR, they may do so after reviewing their own changes; document this in the repo if used.
3. **Default:** Merging to `main` (or `develop`) is done only after a PR is opened, reviewed (if applicable), and merged via the host (e.g. GitHub/GitLab).

---

## 4. Pull Request

When the feature or fix is ready for integration:

**Rules for agents:**

1. **Push the branch:** Ensure the feature/fix branch is pushed to the remote: `git push -u origin <branch-name>`.
2. **Open a PR:** Create a pull request from the feature/fix branch **into** the target branch (e.g. `main` or `develop`).
3. **PR title:** Use a short, descriptive title (e.g. "Add combat damage calculation", "Fix chat reconnection").
4. **PR description:** Include what changed, why, and how to test (or link to docs/workflow.md). Optionally list key files and any breaking changes.

**PR description template (suggested):**

- **What:** Brief summary of the change.
- **Why:** Reason or ticket reference.
- **How to test:** Steps or scenarios.
- **Notes:** Breaking changes, follow-up work, or links to PROJECT_ARCHITECTURE.md / docs.

---

## 5. Document Changes

For every **release** or **significant change** (e.g. new feature, major fix, removed API), update the project’s changelog so version history is clear.

**Rules for agents:**

1. **Where to document:** Update **PROJECT_ARCHITECTURE.md** Section 13 (Versioning and Changelog), **or** a dedicated **CHANGELOG.md** in the repo root or under `docs/`. Use one place consistently; if CHANGELOG.md exists, use it; otherwise use Section 13.
2. **Format:** For each version or release, add entries under:
   - **Added** — New features, systems, or capabilities.
   - **Fixed** — Bug fixes and corrections.
   - **Removed** — Deprecated or removed features/APIs.
3. **When:** Document as part of the PR (e.g. a "Changelog" section in the PR description or a commit that updates the changelog before merge), or immediately after a release tag.

**Steps:**

1. Open PROJECT_ARCHITECTURE.md (Section 13) or CHANGELOG.md.
2. Under the current version (or "Unreleased"), add bullets under Added / Fixed / Removed as applicable.
3. Commit the doc change (e.g. "docs: add X to changelog") or include it in the PR.

---

## 6. Agent Skills (Vercel / skills.sh)

This project can use **Vercel agent skills** (e.g. React best practices) via the [skills.sh](https://skills.sh) ecosystem.

**Setup (once per clone or when adding skills):**

```bash
npx skills add vercel-labs/agent-skills
```

- When prompted, choose **project** (not global) so skills are versioned with the repo.
- If Cursor shows skills as "Rules" instead of "Skills", try reinstalling with **Copy** instead of Symlink.

**Optional:** Install only specific skills to keep the set small:

```bash
npx skills add vercel-labs/agent-skills --list
npx skills add vercel-labs/agent-skills --skill react-best-practices
```

After installation, commit any new or updated files under `.cursor/` and `.agents/` (Vercel skills install to `.agents/skills/`) so the team shares the same skills.

---

## 7. Plans and Tasks (software lifecycle per feature)

Plans and task lists live in **docs/plans/** so both Cursor and Claude can read and update them. Each feature follows: **Plan (creates tasks) → Start task → Implement → Complete task (when it works) → PR / Document.**

### Plan file location and format

- **Path:** `docs/plans/<feature-name>.md` (e.g. `docs/plans/combat-damage.md`). Use kebab-case for the filename.
- **Structure:** Each plan file must include:
  - **Goal:** One or two sentences describing the feature.
  - **Tasks:** A list of checkboxes. Use `- [ ]` for not done and `- [x]` for done. Optionally mark the current task with `(in progress)`.
  - **Acceptance (optional):** How to verify the feature is done (e.g. tests pass, manual check).

**Rules for agents:**

1. **Creating a plan:** Use `/create-plan` or create a new file in `docs/plans/<feature-name>.md` with Goal, Tasks (`- [ ]` items), and optional Acceptance. Branch name should match (e.g. `feature/combat-damage`).
2. **Starting a task:** Use `/start-task`. Follow Section 1 (check branch) and Section 2 (work on branch). Open the plan file, identify the next or chosen task, mark it `(in progress)`, and implement it. Remind the user to run `/complete-task` when it works.
3. **Completing a task:** Use `/complete-task`. Verify the task works (run tests and lint). Then update the plan file: change `- [ ]` to `- [x]` for that task and remove `(in progress)`. Commit the change. If all tasks are done, remind the user to run `/create-pr` and `/document-changes` (Sections 4 and 5).
4. **One plan = one feature:** One plan file and one feature branch per feature; all tasks for that feature are in the same plan file.

### Lifecycle summary

| Phase | Action | Command or doc |
|-------|--------|-----------------|
| Plan | Create plan with tasks in docs/plans/ | `/create-plan` or new file in docs/plans/ |
| Start task | Check branch, create/use feature branch, implement one task | `/start-task` |
| Verify | Run tests/lint | Part of `/complete-task` |
| Complete task | Mark task done in plan, commit | `/complete-task` |
| Feature done | Open PR, document changes | `/create-pr`, `/document-changes` |
