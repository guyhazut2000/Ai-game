# Start work on a task

Follow **docs/workflow.md** Section 7 (Plans and tasks) and Sections 1–2 (check branch, work on branch).

Do the following:

1. **Identify the plan:** If the user specified a plan file (e.g. `combat-damage`), use `docs/plans/<name>.md`. Otherwise list plan files in `docs/plans/*.md` (exclude README and _template) and ask which plan, or use the one that matches the current branch.
2. **Check branch and repo state** — Follow workflow Section 1: run `git status`, resolve uncommitted changes, run `git pull`.
3. **Create or use feature branch** — Branch name should match the plan (e.g. `feature/combat-damage`). If no feature branch exists, create it from base (main/develop). If already on the feature branch, continue.
4. **Pick a task:** From the plan file, find the next task with `- [ ]` (not done). If the user said which task (e.g. "task 2" or the task text), use that. Mark it `(in progress)` in the plan file (e.g. `- [ ] Task text (in progress)`).
5. **Implement the task** — Make the code/docs changes; run tests and lint; fix any failures.
6. **Remind:** Tell the user: "When this task works, run `/complete-task` to mark it done and commit. If more tasks remain, run `/start-task` again for the next one."

Read docs/workflow.md for the full rules.
