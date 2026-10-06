---
name: multica-source-verification
description: Investigate or verify Multica implementation details against the upstream multica-ai/multica source code. Use when researching runtime behavior, tracing execution paths, resolving documentation-versus-code differences, or preparing reproducible technical evidence for Multica Learning.
---

# Multica Source Verification

Use this workflow together with the repository workflow. Keep research reproducible, evidence-based, and suitable for later tutorial writing.

## 1. Establish the research target

Before analyzing implementation details:

1. State the concrete research question.
2. Locate the upstream `multica-ai/multica` project resource.
3. Determine the full commit SHA currently checked out upstream.
4. Record that commit before drawing implementation conclusions.
5. Treat the upstream repository as read-only.

Never modify, push, branch, or open pull requests against the upstream repository during normal research.

## 2. Start from behavior

Begin with a concrete system behavior or question and narrow the investigation in this order:

```text
behavior/question
→ entry point
→ call chain
→ state/data transitions
→ result/event path
```

Use repository search, symbol search, call sites, types, and interfaces. Do not try to understand Multica by reading very large files linearly from beginning to end.

## 3. Build an evidence chain

Read [references/evidence-levels.md](references/evidence-levels.md) before classifying evidence. Support every important claim with one or more of its evidence labels.

For source evidence, record at least:

- upstream repository;
- full commit SHA;
- file path;
- symbol or semantically relevant code region;
- what the code demonstrates.

Use [references/source-map-format.md](references/source-map-format.md) to record important symbols. Prefer symbols and semantic context over line-number-only citations because line numbers drift between versions.

## 4. Separate fact from inference

Label any conclusion not directly established by source, official documentation, or experiment as `INFERENCE`. Never silently turn an inference into a verified fact.

If official documentation and current source disagree:

1. Record both accounts.
2. Identify the upstream commit studied.
3. State which behavior the implementation establishes.
4. Preserve and explain the discrepancy.

## 5. Trace cross-layer execution

For runtime questions, follow the execution through every relevant layer instead of stopping at the first function. Relevant layers may include:

- router or API entry;
- handler;
- service;
- database or state transition;
- queue or task lifecycle;
- daemon communication;
- local runtime;
- provider adapter;
- external coding agent;
- event or result upload;
- realtime or client propagation.

Include only layers relevant to the research question.

## 6. Use experiments when needed

When static reading cannot distinguish between plausible explanations, run the smallest safe experiment that can do so. Record:

- purpose;
- environment;
- command or action;
- observed result;
- limitations.

Do not perform destructive or externally impactful experiments without explicit authorization.

## 7. Produce durable artifacts

Store each investigation under `research/<topic-slug>/`. Copy [templates/research-note.md](templates/research-note.md) as the starting structure and fill it with explicit evidence labels.

Write enough evidence for a Tutorial Writer or Reviewer to understand the conclusion without repeating the full investigation. Update source tracking under `sources/` when it adds useful version or source relationships.

## 8. Apply stop conditions

Stop and report uncertainty instead of guessing when:

- the upstream commit cannot be established;
- required source is unavailable;
- two plausible interpretations remain unresolved;
- runtime behavior cannot be verified safely;
- the question depends on unavailable credentials, infrastructure, or external state.

## 9. Hand off the research

Provide a technical evidence handoff, not polished tutorial prose. Summarize:

- research question;
- upstream commit;
- key files and symbols;
- verified execution or call chain;
- evidence-backed conclusions;
- unresolved questions;
- likely tutorial implications.
