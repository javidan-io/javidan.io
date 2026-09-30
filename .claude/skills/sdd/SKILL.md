---
name: sdd
description: Spec-Driven Development workflow for javidan.io. Use at the START of any request that would change code, content or configuration — propose an approach with alternatives and tradeoffs, wait for the Commander's approval, then convert the approved approach into an ordered task list and implement one task at a time. Also use when asked to "write a spec", "plan this", or when a prompt asks for an implementation without a prior approved approach.
---

# Spec-Driven Development

Two rules govern all work on this repository. They are not advisory.

## Rule 1 — Never code first

On receiving any prompt that implies a change, you MUST NOT write code. Instead,
reply with this sentence verbatim:

> Propose an approach first. Show alternatives to my solution, highlight tradeoffs. Do not write code until I approve.

Then propose. Then stop and wait for the Commander's explicit approval.

Reading, searching and inspecting the codebase before proposing is not only
allowed, it is expected — a proposal written without reading the code is a guess.
The prohibition is on *writing*: no Edit, no Write, no `sed -i`, no heredoc into
a tracked file, until approval lands.

### What counts as approval

Explicit words from the Commander: "approved", "go", "do it", "option B", "yes".
Silence is not approval. A follow-up question is not approval. Approval of one
task is not approval of the next.

### The proposal format

1. **What's there now** — the relevant current state, cited as `file.ts:line`.
2. **Ambiguities** — anything in the prompt that could be read two ways. State
   the interpretation you will proceed under; ask only when the readings lead to
   materially different work.
3. **Options** — your recommendation plus at least one genuine alternative.
   Every option gets its tradeoff stated. A table works well for three or more.
4. **Recommendation** — one option, named, with the reason in a sentence.

Never present options you would not implement. Never recommend by omission.

## Rule 2 — One task at a time

Once an approach is approved, convert it into a mini-spec: an ordered task list
of concrete items, each with a clear "done" criterion.

| # | Task | Done when |
|---|------|-----------|
| 1 | Concrete, single-concern change | An observable, checkable condition |

Rules for the list:

- Order by dependency — a task never needs a later task to work.
- One concern per task. "Add the schema field and build the component" is two.
- The "done when" must be checkable by someone else: a command that passes, a
  route that renders, a file that exists. Not "looks right".
- Scope the list to what was approved. A task nobody approved does not belong in
  it.

Then implement the tasks **in order, one at a time**. Finish a task — including
its done-criterion check — before opening the next. Do not batch. Do not jump
ahead because a later task looks trivial.

If implementing a task reveals the plan was wrong, stop and say so. Return to
Rule 1 with a revised proposal rather than improvising a different design
mid-list.

## Rule 3 — Commit titles

After each significant change, provide a proper commit title before moving on.
Follow the repository's existing convention, visible in `git log`:

```
<type>: <lowercase imperative summary>
```

Types in use here: `content`, `data`, `chore`, `feat`, `fix`.

## Checklist before replying to a change request

- [ ] Did I read the relevant code before proposing?
- [ ] Did I state the required sentence verbatim?
- [ ] Does every option carry a tradeoff?
- [ ] Did I name one recommendation?
- [ ] Am I about to write code without approval? If yes — stop.
