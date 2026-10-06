---
name: repository-workflow
description: Coordinate repository changes that originate from Multica work, from issue review and Git branching through pull request handoff. Use whenever an agent modifies files in a Git repository for a Multica issue or project task.
---

# Repository Workflow

Follow this path for repository changes initiated from Multica:

`Multica Issue -> Agent Run -> Git branch -> Pull Request -> GitHub Actions CI -> Human Review -> Squash merge -> Multica Issue Done`

## Prepare the work

1. Read the current Multica issue carefully.
2. Identify its issue key, such as `MUL-123`.
3. Inspect the project's repository resource.
4. Inspect the current Git state before modifying anything.
5. Reuse an appropriate Multica-prepared checkout, worktree, or branch instead of creating an unnecessary clone.

If the work is issue-based but the issue key cannot be determined, do not invent one. Ask for clarification or explicitly report that automatic pull request linking cannot be guaranteed.

Read [references/multica-github-linking.md](references/multica-github-linking.md) before naming a branch or opening a pull request. Use [templates/pull-request.md](templates/pull-request.md) as the pull request body starting point.

## Work on a branch

- Never push directly to `main` for normal feature work.
- Use the existing issue-specific branch when Multica created one.
- Otherwise create a focused feature branch from the intended base.
- When creating a branch, include the lowercase Multica issue key, for example `mul-123-add-source-map`.

## Commit focused changes

- Make focused, meaningful commits.
- Do not commit generated build output unless the repository explicitly requires it.
- Check `git status` before and after the work.
- Do not rewrite unrelated history.

## Validate locally

- Run deterministic checks relevant to the changed files before opening a pull request.
- For changes under `site/`, run `npm ci` when dependencies must be reproduced, then run `npm run check` and `npm run build`.
- Run `git diff --check`.
- Report failures instead of hiding them.
- Do not claim CI passed until GitHub Actions actually completes successfully.

## Open the pull request

1. Push the feature branch.
2. Use GitHub CLI (`gh`) to create a pull request targeting `main`.
3. Include the actual Multica issue key in the title, for example `MUL-123 Add source tracking foundation`.
4. Put `Closes <ISSUE-ID>` in the body, replacing the placeholder with the actual key.
5. Include a concise summary and verification results.
6. Do not merge the pull request unless a human explicitly requests it.

## Hand off for review

After opening the pull request:

1. Verify its URL.
2. Verify the intended base and head branches.
3. Verify that the originating Multica issue can be linked to it.
4. Report the pull request on the Multica issue.
5. Leave the issue ready for human review.

Include in the final report:

- Summary of changes
- Branch name
- Commit SHA
- Pull request URL
- Local validation performed
- Current CI status, if known
- Remaining human review items
