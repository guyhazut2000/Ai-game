# Working on a feature

Follow **docs/workflow.md** for the full rules. Do the following:

1. **Check branch and repo state** — Use the "Check branch and repo state" section of docs/workflow.md: verify current branch (e.g. main or develop), ensure clean or committed state, pull latest.
2. **Create or switch to feature branch** — Create a branch with `feature/short-name` or `fix/short-name` from the base branch.
3. **Implement the feature** — Make the requested changes; run tests and lint (e.g. npm run test, npm run lint) and fix any failures.
4. **Commit with clear messages** — Use present-tense, descriptive commit messages; one logical change per commit when practical.
5. **When done** — Remind the user to open a PR (per the "Pull request" section of docs/workflow.md) and to document changes (per the "Document changes" section) in PROJECT_ARCHITECTURE.md Section 13 or CHANGELOG.md.

Read docs/workflow.md for the exact steps and rules for agents.
