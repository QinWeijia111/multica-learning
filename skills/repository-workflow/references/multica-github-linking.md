# Multica and GitHub linking

Use the Multica issue key, such as `MUL-123`, to connect repository work to its originating issue.

## Automatic linking signals

Prefer automatic linking because it makes the relationship visible and reliable without requiring a separate manual step:

- Include the key in a newly created branch name, for example `mul-123-add-source-map`.
- Include the key in the pull request title, for example `MUL-123 Add source tracking foundation`.
- Put a closing keyword and the key in the pull request body: `Closes MUL-123`, `Fixes MUL-123`, or `Resolves MUL-123`.

Use at least the pull request title and a closing-keyword line; include the key in the branch name whenever the branch is created for the work.

`Related to MUL-123` is insufficient because it states context but does not use a recognized closing keyword. Commit messages alone also do not establish the required pull request-to-issue link: they may be hidden by squash merging and are not the pull request metadata Multica uses for the relationship.

## Fallback

If automatic linking cannot be established, manually link the pull request from the Multica issue and clearly report that fallback. If the issue key itself is unknown, do not invent one; ask for clarification or warn that automatic linking cannot be guaranteed.

The project prefers automatic linking because it survives normal review and squash-merge workflows, reduces missed bookkeeping, and keeps the Multica issue and GitHub pull request mutually traceable.
