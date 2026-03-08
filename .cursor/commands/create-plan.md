# Create a feature plan

Follow **docs/workflow.md** Section 7 (Plans and tasks).

Do the following:

1. **Get feature name and goal:** Use the feature name the user gave, or infer from the conversation. Use kebab-case for the filename (e.g. `combat-damage`, `login-flow`).
2. **Create the plan file:** Create `docs/plans/<feature-name>.md` with:
   - **Goal:** One or two sentences describing the feature.
   - **Tasks:** A list of actionable items as `- [ ]` checkboxes. Break the feature into logical steps (implement, test, document). You can use `docs/plans/_template.md` as reference.
   - **Acceptance (optional):** How to verify the feature is done (e.g. tests pass, matches PROJECT_ARCHITECTURE).
3. **Branch name:** The feature branch for this plan should be `feature/<feature-name>` (same kebab-case). Remind the user to run `/start-task` when ready to begin, and that they should be on the base branch first (or run `/check-branch`).

Do not create a branch yet; the user will run `/start-task` which will check branch and create `feature/<feature-name>` from base.

Read docs/workflow.md Section 7 and docs/plans/README.md for format and lifecycle.
