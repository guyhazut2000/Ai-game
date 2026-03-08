---
name: work-on-feature
description: Full feature workflow — check branch, create branch, implement, test, commit, PR, document changes. Follow docs/workflow.md.
disable-model-invocation: true
---

# Work on feature (full workflow)

Execute this workflow when the user wants to work on a feature or fix from start to finish. **Always follow docs/workflow.md** for the authoritative rules; this skill summarizes and references it.

## Steps

1. **Check branch and repo state** (docs/workflow.md Section 1)
   - Run `git status`; note current branch and uncommitted files.
   - If dirty: commit or stash, then `git pull` to get latest on current branch.

2. **Create or switch to feature/fix branch** (docs/workflow.md Section 2)
   - Branch naming: `feature/short-name` or `fix/short-name`.
   - Create from base: `git checkout -b feature/<name>` (or fix) from main/develop.

3. **Implement and test**
   - Make the requested code changes.
   - Run tests and lint (e.g. `npm run test`, `npm run lint`); fix failures.
   - Commit with clear, present-tense messages; one logical change per commit when practical.

4. **Pull request** (docs/workflow.md Section 4)
   - Push branch: `git push -u origin <branch-name>`.
   - Open PR from feature/fix branch into target (e.g. main). Use short title and description (what, why, how to test).

5. **Document changes** (docs/workflow.md Section 5)
   - Update PROJECT_ARCHITECTURE.md Section 13 or CHANGELOG.md with Added / Fixed / Removed for this release or PR.
   - Commit the changelog update or include it in the PR.

When in doubt, re-read the corresponding section of **docs/workflow.md**.
