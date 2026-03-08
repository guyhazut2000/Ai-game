# Mark task completed

Follow **docs/workflow.md** Section 7 (Plans and tasks) and Section 2 (commit).

Do the following:

1. **Identify the plan and task:** Open the plan file (e.g. the one with a task marked `(in progress)`, or the plan the user names). The completed task is the one marked `(in progress)` or the one the user specifies.
2. **Verify it works:** Run tests and lint (e.g. `npm run test`, `npm run lint` in the relevant workspace). If anything fails, do not mark complete — fix first or tell the user.
3. **Update the plan file:** Change that task from `- [ ]` to `- [x]` and remove `(in progress)` if present. Save the file.
4. **Commit:** Stage the plan file and any code changes; commit with a clear message (e.g. "feat(combat): add damage formula and tests" or "docs(plan): complete task X for feature Y").
5. **Next steps:** If there are still tasks with `- [ ]` in the plan, say: "Task marked complete. Run `/start-task` for the next task." If all tasks are done, say: "All tasks for this feature are complete. Run `/create-pr` and `/document-changes` per docs/workflow.md Sections 4 and 5."

Read docs/workflow.md for the full rules.
