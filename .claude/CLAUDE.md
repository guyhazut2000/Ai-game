# Claude Code — Project configuration

This project is a multiplayer online RPG (browser-based, React + Three.js, microservices backend). When working in this repository, follow the conventions below.

## Workflow and branches

- **Feature work, branches, PRs, and merges:** Follow **docs/workflow.md**. It defines how to check branch state, work on a feature branch, open pull requests, and document changes. Read the relevant section before performing any of these actions.
- **Plans and tasks:** Feature plans and task lists live in **docs/plans/** (one .md file per feature, kebab-case). Follow docs/workflow.md Section 7: create plans with Goal and Tasks (`- [ ]` / `- [x]`); start a task (check branch, feature branch, implement); complete a task only when it works (verify, then mark done in the plan and commit). When all tasks are done, open a PR and document changes.

## Architecture and versioning

- **Architecture and tech stack:** See **PROJECT_ARCHITECTURE.md** for the full system design, services, repo layout, and technology choices. Prefer those over ad-hoc alternatives.
- **Changelog and versioning:** For releases or significant changes, update **PROJECT_ARCHITECTURE.md** Section 13 (Versioning and Changelog) or **CHANGELOG.md** with Added / Fixed / Removed as described in docs/workflow.md.

## Summary

1. Follow docs/workflow.md for all branch, feature, PR, and documentation workflow.
2. Use docs/plans/ for feature plans and tasks; follow Section 7 of docs/workflow.md for the task lifecycle.
3. Use PROJECT_ARCHITECTURE.md for architecture, stack, and changelog (Section 13).
