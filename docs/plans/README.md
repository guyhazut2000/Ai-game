# Plans and tasks

Feature plans and task lists live here. Both **Cursor** and **Claude** read and update these files.

## Usage

- **Create a plan:** Use the `/create-plan` command or add a new file `docs/plans/<feature-name>.md` (kebab-case). See [workflow.md](../workflow.md) Section 7 and `_template.md` for format.
- **Start a task:** Use `/start-task` — picks a task from a plan, checks branch, creates/uses feature branch, implements. Follow [workflow.md](../workflow.md).
- **Complete a task:** Use `/complete-task` when the task works — verifies (tests/lint), marks the task done in the plan file, commits. When all tasks are done, use `/create-pr` and `/document-changes`.

## File naming

Use kebab-case: `combat-damage.md`, `login-flow.md`, `fix-chat-reconnect.md`. The filename should match the feature branch (e.g. `feature/combat-damage`).

## Lifecycle

Plan → Start task → Implement → Complete task (only when it works) → Repeat until feature done → PR + document changes.
