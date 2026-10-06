# Evidence Levels

Apply one or more of these labels to every important conclusion. A label communicates how the conclusion is supported, not how confident it sounds.

## SOURCE

Directly supported by inspected upstream source code at a recorded commit.

Typical evidence includes:

- a function implementation;
- a type or interface definition;
- an explicit state transition;
- a concrete call site.

Record the repository, full commit SHA, file, symbol or relevant code region, and what the code demonstrates.

## DOCS

Supported by current official Multica documentation.

Use documentation to establish intended behavior and terminology. Documentation alone must not override conflicting implementation evidence. Preserve any discrepancy between the documentation and source.

## EXPERIMENT

Observed through a controlled execution or minimal reproduction.

Record enough context to show what was actually tested: purpose, environment, command or action, observed result, and limitations. An experiment establishes only the behavior covered by those conditions.

## INFERENCE

A reasoned conclusion that is not directly established by `SOURCE`, `DOCS`, or `EXPERIMENT` evidence.

Inference is allowed, but always label it and explain the reasoning. Never present it as verified fact.

## Combining labels

An important conclusion may rely on multiple evidence types. Combine labels explicitly, such as `SOURCE + EXPERIMENT`, when source inspection and observed behavior jointly support the conclusion. Keep the evidence for each label identifiable.
