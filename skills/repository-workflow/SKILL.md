---
name: repository-workflow
description: Coordinate repository changes from a Multica issue through branch, pull request, CI, human merge, and conditional deployment, including shared canonical chapter PRs.
---

# Repository Workflow

## Select the workflow mode

Inspect the task context before creating a branch or PR.

### Ordinary task mode

Use one focused branch and one PR for the assigned issue. Follow:

`Multica Issue → feature branch → PR → CI → human review → human merge → conditional CD / production verification`

### Shared chapter PR mode

Use this mode when chapter coordination supplies or establishes `parent_issue_key`, `chapter_branch`, or `chapter_pr`. The delivery unit is:

`Parent Chapter Issue → shared chapter branch → canonical Draft PR → research → tutorial → review / fixes → PASS → one human merge`

- Reuse the supplied Parent Issue, branch and PR; never create a role-specific branch or PR.
- If the canonical PR does not yet exist, the first repository-producing worker creates the shared branch; Source Analyst opens one Draft PR after the first useful research commit.
- Later workers fetch / check out the exact shared branch, verify the PR head, commit only their bounded stage changes, and push to that same branch.
- No intermediate merge marks stage completion. Use the structured Parent Issue handoff from `book/LEARNING_SQUAD.md`.
- `FOCUSED_DELTA` review and its fixes remain on the same PR.
- Preserve ordinary one-task-one-PR behavior when shared chapter fields are absent.

## Prepare

1. Read the current Multica issue and determine its real key.
2. Read repository `AGENTS.md` and `ROADMAP.md`, then route to the smallest task-specific authority.
3. Inspect Git status, remotes, current branch and any existing PR before editing.
4. Reuse the prepared checkout and, in chapter mode, the canonical branch / PR.
5. Read `references/multica-github-linking.md` before naming a new branch or opening a PR.

Never invent an issue key or change the intended base silently. Treat upstream `multica-ai/multica` as read-only for Multica Learning work.

## Branch and commits

- Never push normal feature work directly to `main`.
- New ordinary branches and chapter branches include the lowercase issue key.
- In chapter mode, verify `chapter_branch` rather than creating a “cleaner” replacement.
- Make small, meaningful commits and do not rewrite unrelated history.
- Do not commit generated build output unless the repository requires it.

## Validate

Run deterministic checks relevant to the change. For Multica Learning, the normal pre-handoff set is:

```bash
git diff --check
cd site
npm run check
npm test
npm run build
```

Local results validate only the checkout. CI validates the PR. CD can run only after an eligible merge, and production verification requires observing the deployed result.

## Deployment impact

Classify each PR as:

- **No deployment impact**
- **Deployment expected after merge**
- **Deployment behavior changed by this PR**

Name the existing workflow or mechanism and the minimum post-merge check when deployment applies. Do not claim CI or production success from a local build.

## Open or update the PR

For a new PR:

1. Push the branch.
2. Use the pull request template.
3. Put the actual issue key in the title and `Closes <ISSUE-ID>` in the body.
4. Include summary, verification and deployment impact.
5. In chapter mode, create it as Draft and record `parent_issue_key`, `chapter_branch` and `chapter_pr` in the Parent Issue handoff.

For an existing canonical chapter PR:

1. Verify base, head, Draft state and Parent Issue association.
2. Push only to `chapter_branch`.
3. Update the existing PR description / checks if the new stage changes them; never open a replacement.

Agents never merge. In chapter mode only the Leader, after Reviewer `PASS` and synchronization checks, may make the Draft PR ready for human review.

## Hand off

Ordinary work reports branch, commit, PR, local checks, CI status, deployment impact and human review items.

Chapter workers use the exact structured messages in `book/LEARNING_SQUAD.md`. The final Leader summary additionally reports `updated` / `not required` for ROADMAP, CHANGELOG, README, AGENTS, BOOK_ARCHITECTURE and source registry. Parent status remains `in_review` until human merge.
