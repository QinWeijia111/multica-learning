## Summary

- Describe the focused change.
- Explain why it is needed.

## Workflow Context

- Mode: `<ordinary task | shared chapter PR>`
- Parent issue: `<ISSUE-ID>`
- Chapter branch / canonical PR: `<not applicable | confirmed>`
- Current chapter stage: `<not applicable | source research | tutorial production | review/fixes | integration>`

## Verification

- List the local checks run and their results.
- State the current GitHub Actions status if known; do not claim success before CI completes.

## Deployment Impact

- Classification: `<no deployment impact | deployment expected after merge | deployment behavior changed by this PR>`
- Expected post-merge deployment: `<workflow or mechanism, or not applicable>`
- Required post-merge production verification: `<minimal checks, or not applicable>`
- Production status: `<not applicable, or not yet verified; update only from the observed post-merge result>`

## Multica Issue

Closes <ISSUE-ID>

Replace `<ISSUE-ID>` with the actual Multica issue key, for example `MUL-123`.

## Human Review

- Note decisions or areas that need reviewer attention.
- Leave merge approval and squash merge to a human unless explicitly requested otherwise.
- For a canonical chapter PR, keep it Draft until Reviewer `PASS` and Leader synchronization checks; never merge between stages.
