---
title: "The model doesn't decide what happens next. A 157-line script does."
date: 2026-11-24
summary: "How agent-kit's recipe router turns a failed step into one next move, why that choice lives in plain Python instead of the model, and the one rule it still can't enforce."
tags: [agent-kit, claude-code, agents, loop-engineering]
draft: false
---

## The problem

When a coding agent hits a failure, the most important decision in the whole run is the boring one: what now? Try again? Try something different? Stop and get a person?

Left to the model, that decision drifts. On one turn a red test means "refine the fix." On the next, the same red test means "probably flaky, ship it." The model isn't being careless. It's just making a judgment call fresh every time, with whatever is in its context, and judgment calls made fresh every time don't come out the same.

In the first post I said the kit's routing lives in a small tested Python script. This post is about that script: what it is, why it exists, and where it stops.

## What the kit did

### What it is

The recipe router is one file, recipe_router.py, 157 lines of standard library Python. Every defect and feature recipe in the kit calls it after each stage. The recipe hands it a handful of facts:

- which stage just ran (repro, fix, verify, regression, code-review, pre-pr, ship or prod-verify)
- that stage's result, as a fixed word from the stage's contract
- the attempt number and the retry cap
- the verifier's confidence, and whether the area is marked sensitive
- whether the global pause flag is set, and how much of the run's consumption cap is used

It prints back exactly one action and a reason:

```text router actions
advance · re-fix · re-repro · reject · rollback · escalate · stop-budget · halt-paused
```

That's the whole interface. It reads nothing but its arguments and one tracked limits file. No brain, no network, no model. The recipe supplies every fact, and the router supplies the decision.

### Why it's a script and not a prompt

The kit has one cardinal rule for loops: every retry has to change strategy. A retry that repeats the same action is a bug, not a retry.

You can write that rule into a prompt. The model will agree with it and then, on a bad turn, retry the same idea in different words anyway. Putting the rule in code means the decision is the same on every run, and it can be tested. The test file runs 27 cases against the router with no database and no network, and all 27 pass today.

The router doesn't route by "did it fail." It routes by how it failed. A few examples straight from the code:

**Same-area regression goes back to the fix, with the failing assertion as new context.** The fix touched the right area and broke something nearby, so another pass at the fix with that new information is a real change of strategy.

**An unrelated-area break escalates at once, with no retry.** If a fix in checkout breaks search, the fix went past its blast radius. Retrying won't help, and that's the scariest signal a loop can get, so it goes to a person.

**A flaky test advances.** It gets quarantined, not counted as a gate failure.

**A repro that ran and didn't reproduce is a real negative.** The router returns reject, which means triage may close the ticket once a person confirms. It never auto-fixes something it couldn't make fail.

**A repro that couldn't tell is not a negative.** If the tooling broke or the environment didn't come up, the result is inconclusive, and the router retries the repro instead of rejecting the ticket. Mixing those two up is how a real bug gets closed as "can't reproduce."

**A green verify can still escalate.** If the verifier passes but its confidence is under the bar and the area is marked sensitive, the router sends it to a person anyway.

**Zero tests ran means the gate didn't run.** An empty regression slice escalates. The router will never call an empty run a pass.

Every retry path has a cap. When the attempt counter reaches it, the same failure that would have meant "re-fix" now means "escalate," with the cap in the reason.

### How it fails closed

The part I care about most is the order of the checks and what happens with bad input.

The pause flag is checked first, before any retry or ship. If someone has paused the loops, nothing else matters. The test file has a case for exactly that: a run that's paused and over its cap at the same time halts as paused.

The safety flags fail closed on input the router doesn't recognize. If the pause flag comes in as "True" with a capital, or "maybe," the router can't prove the loop is unpaused, so it halts. If the sensitive flag comes in garbled, the area is treated as sensitive. A typo in a flag always lands on the safe side.

Unknown values escalate too. An unknown stage escalates. A result word from the old vocabulary, like the retired hyphenated "not-reproduced," escalates with a note that the word is stale, instead of being quietly mapped to something close. When the kit dropped its old self-healing lane, a leftover "drift" result started escalating rather than routing to a skill that no longer exists. There are tests for both.

One choice runs the other way on purpose. A pre-PR check that comes back with only warnings advances. A medium issue that isn't allowed to block would otherwise send the loop around forever, so it rides along in the report and the PR body where a person sees it.

The onboarding loop has its own router built the same way, with actions like relearn, requiz and stop-stagnant. Same idea: one quiz round in, one move out.

> $ git commit -m
> The model does the work. The router decides what the work was worth.

## What broke

### The limit

The router is only as honest as the word it's handed.

It decides what to do with "same-area-regression," but it doesn't decide that a failure was same-area. The regression stage does that, and the stage is a skill a model runs. If that classification is wrong, the router makes a perfectly consistent decision on a wrong fact. The kit pushes back on this elsewhere, with blind judges that never see the fixer's reasoning and contracts that pin each result to a fixed vocabulary, but the router itself takes the label on trust.

There's a second gap, and it's an open question for me. The cardinal rule is meant to hold across runs, not only inside one. A ticket that already escalated, or already ran out of retries last time, shouldn't quietly get the identical strategy again. The recipe engine's docs say so, and the recipe reads the ticket's history from the brain before the loop starts. But the router takes no history argument. That cross-run rule lives in the recipe's instructions, which means it lives with the model again. I haven't decided yet whether to pass prior attempts into the router or keep it purely about the current run.

## What I changed

Nothing in the router changed for this post. It's an explainer of how the router works today, and the open question above is the next change if I make one.

## Try it

The router and its test file are in [agent-kit](https://github.com/travist6983/agent-kit), under the defect loop's scripts and the loops tests. The tests are the faster read: each line is one failure and the move it should get.
