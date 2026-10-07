---
name: repository-workflow
description: Coordinate repository changes that originate from Multica work, from issue review and Git branching through pull request handoff. Use whenever an agent modifies files in a Git repository for a Multica issue or project task.
---

# Repository Workflow

Follow this path for repository changes initiated from Multica:

`Multica Issue -> Agent Run -> Git branch -> Pull Request -> GitHub Actions CI -> Human Review -> Squash merge -> [if deployable: CD and production verification] -> Delivery complete`

The post-merge stage is conditional. Research notes, Skills, documentation-only changes, and other non-deployable work may end at merge. Do not invent a deployment stage when the repository has none.

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
- Treat local validation as evidence about the checkout only. It is not proof that pull-request CI passed or that production deployed successfully.

## Determine deployment impact

Before opening or handing off a pull request, inspect the repository's actual workflows and deployment configuration. Classify the change as one of:

- **No deployment impact**: no deployed artifact, service, or deployment mechanism is affected.
- **Deployment expected after merge**: the repository already deploys the affected artifact after changes reach its deployment branch.
- **Deployment behavior changed by this PR**: the change modifies the workflow or configuration that controls deployment.

Record the classification in the pull request. When deployment is expected, name the responsible workflow or mechanism if the repository identifies one, and state the smallest useful post-merge production checks. Keep these checks specific to the changed behavior; do not turn the pull request into a release plan.

Keep the evidence boundaries explicit:

- Local checks validate the working tree before the pull request.
- CI validates the proposed change before merge.
- CD delivers an eligible change after it reaches the configured deployment branch.
- Production verification checks the deployed result after CD completes.

Do not use a successful local build or CI run as evidence that a change is deployed, live, or production verified.

## Open the pull request

1. Push the feature branch.
2. Use GitHub CLI (`gh`) to create a pull request targeting `main`.
3. Include the actual Multica issue key in the title, for example `MUL-123 Add source tracking foundation`.
4. Put `Closes <ISSUE-ID>` in the body, replacing the placeholder with the actual key.
5. Include a concise summary, verification results, and deployment impact classification.
6. Do not merge the pull request unless a human explicitly requests it.

## Hand off for review

After opening the pull request:

1. Verify its URL.
2. Verify the intended base and head branches.
3. Verify that the originating Multica issue can be linked to it.
4. Report the pull request on the Multica issue.
5. Leave the issue ready for human review.

For a change with deployment impact, state what should deploy after merge, which repository workflow or mechanism is responsible when known, why it cannot be verified before merge, and what minimal production checks remain. Human merge remains the gate; feature agents do not need to merge their own pull requests to verify deployment.

If an observed post-merge deployment fails, do not describe delivery as successful. Report the failed workflow or visible symptom and recommend focused remediation or a follow-up issue. Do not silently change unrelated production configuration.

Include in the final report:

- Summary of changes
- Branch name
- Commit SHA
- Pull request URL
- Local validation performed
- Current CI status, if known
- Deployment impact
- Expected post-merge deployment, if applicable
- Required post-merge production verification
- Remaining human review items
