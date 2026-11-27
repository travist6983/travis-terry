---
title: "My code reviewer doesn't get a vote anymore"
date: 2026-11-26
summary: "How agent-kit's code reviewer stopped deciding which of its own findings are real: three fresh validators vote, a script counts, and a finding that says a fix hides the bug can't be outvoted."
tags: [agent-kit, claude-code, agents, code-review]
draft: false
---

The kit has a rule I keep coming back to: a producer never grades its own work. The fixer doesn't verify its own fix. A fresh agent does. This week I found the one place the kit was breaking that rule, and it was the code reviewer.

## The problem

The reviewer works in two steps. First, six specialists (frontend, backend, data, security, tests and performance) plus a masking pass read the diff and propose findings. Second, the reviewer that sent them out reads everything they found, decides which findings are real, and writes the verdict.

That second step is the problem. The same context that writes "approve" or "request changes" was also deciding which evidence counted. If it leaned toward a clean review, it could drop the inconvenient finding. If it leaned the other way, it could keep a weak one. Either way, nobody outside that one context checked the call.

One kind of finding makes this worse. The masking pass looks for a fix that hides the bug instead of fixing it: an exception swallowed, a log line suppressed, a narrow special case that turns the replay green. Miss one of those and the loop ships a bug it has just taught itself to stop seeing.

## What the kit did

### The reviewer only counts now

PR 19 split the reviewer's job in two. It still collects what the specialists propose, but it no longer judges any of it. The flow is now:

```text dev-code-review
specialists propose → candidates → ballot → 3 validators vote ∥ → script tallies → verdict
```

The reviewer merges the specialists' output into one candidates file without filtering it. A script, finding_votes.py, turns that file into a ballot. Each finding gets an id built from its file, line, bug class and issue text, duplicates are merged, and the specialist's own confidence and suggested fix are stripped off so a validator can't anchor on them.

Then three fresh agents vote on every finding, each in its own context. A vote is confirm, reject or pre-existing (the problem was already there before this change), with a confidence from 0 to 100.

The script does the counting. An ordinary finding is kept only when the specialist was at least 80 percent sure and at least 2 of the 3 validators confirm it at 80 or higher. If fewer than two ballots come back usable, the script writes no review at all, and the router escalates instead of sending the fix back for another try. A review that produced no verdict says nothing about the fix, so another pass at the fix would just repeat the same action.

The numbers live in the kit's limits file, and the script has no default for them. Three validators and a quorum of two are argued, not measured. They can be tuned later by replaying the tally against the reviewer's eval set, which costs no model calls.

### Some findings can't be voted down

Two kinds of finding are protected: a masking finding, and anything rated critical. They go on the ballot no matter how sure the specialist was, and the vote works differently:

- **Every validator rejects it:** it's dropped. That's the only way it leaves.
- **Every validator confirms it:** it stays, and a confirmed masking finding blocks the PR.
- **Anything else:** one confirm, a "pre-existing" vote, a low-confidence confirm, an abstain or a garbled ballot. The finding stays, the verdict becomes needs-human, and the router sends it to a person. It never goes back to the fixer.

Two out of three is the right bar for noise. It's the wrong bar for "this fix hides the bug." If even one validator sees masking, that disagreement isn't the fixer's to settle. A protected finding also can't be hidden by the nit cap or by any of the volume caps on posted comments.

There's no setting for this rule. The script's own comment says why: a number that could be turned off would reopen the hole it closes.

### How deep to look comes from the diff

The same PR added review_depth.py, which picks one of three depths from the actual diff:

- **Quick:** one combined spawn that carries all six lenses. Only for 3 files or fewer, 50 changed lines or fewer, no risky paths, and never for a fix the loop itself produced.
- **Standard:** the six specialist spawns.
- **Deep:** the six, plus an extra security pass over the risky files.

A touch on the kit's denylist (migrations, secrets, auth, infra, CI), a shared core file, an area marked sensitive or an edit to the conventions file goes deep. So does anything the script can't read. No depth drops a lens, and a depth can only be raised.

### The checks block now

Each of these scripts has a check that re-derives the result from the files on disk. Until the last commit of PR 19, nothing called them. Now the pre-PR gate does. A review that reaches it without a vote record or a depth record, or that fails any of the three checks, blocks the PR. A check that can't run blocks too. The step that posts review comments refuses a review that fails the vote check.

## What broke

Two bugs in the depth selector, both found while building it. Neither came from a real run.

**A file name with a newline in it.** A changed path like `.github/workflows/x`, a newline, then `y.yml`. The denylist scan reads paths one line at a time, so it saw two paths. The CI folder is on the denylist, so the first half got a hit, but that hit matched no real changed file and was thrown away. The diff came back quick. A change to a CI workflow should always be deep.

**An empty evidence argument.** The loop tells the selector a review is for its own fix by passing an evidence folder. If the shell variable holding that folder was unset, the argument arrived empty, and the script read empty as "no evidence," which meant "not a loop fix," which could mean quick.

Both bugs have the same shape. An unknown got read as the safe answer. The kit's rule is the opposite: when a fact is unknown, the review moves up.

Some limits are still open. That each validator really ran in a fresh context is self-reported, not proven. The quorum and the depth bounds are argued, not measured. The validators add model calls to every review, so the live PR review loop now refuses to run until someone records a timing measurement. And a small incoming PR in a sensitive area outside the denylist still plans quick, because nothing maps paths to sensitive areas yet.

## What I changed

```fixes
@@ validators @@ [PR 19](https://github.com/travist6983/agent-kit/pull/19)
- **The reviewer graded its own evidence.** The context that wrote the verdict also decided which findings were real.
+ **Three fresh validators vote, a script counts.** The reviewer merges and counts and never votes. Fewer than two usable ballots means no review, and the router escalates.
@@ protected findings @@ [33df24a](https://github.com/travist6983/agent-kit/commit/33df24a1bbf11ac007215d7c99a8c37a61ff672f)
- **A masking finding could be outvoted.** Under a plain 2 of 3 quorum, one validator who saw a hidden bug lost to two who didn't.
+ **Only a unanimous reject drops it.** Any split sets the verdict to needs-human and goes to a person, with no setting that turns it off.
@@ review depth @@ [9dde3ef](https://github.com/travist6983/agent-kit/commit/9dde3efbf15385913912775571eae97aa5e3fa30)
- **A newline in a file name hid a denylist hit.** The hit matched no changed file, was discarded, and a CI change planned quick.
+ **A hit it can't map back means the scan failed.** Any path with a newline or control character, or any unmatched hit, plans deep.
@@ review depth @@ [174e427](https://github.com/travist6983/agent-kit/commit/174e427b0d5339f5d8a1a3d542a1096a5980de03)
- **An empty evidence argument read as "not a loop fix."** An unset variable could plan a loop's own fix as quick.
+ **Empty evidence is unreadable evidence.** It plans deep.
@@ gates @@ [1ec2ca3](https://github.com/travist6983/agent-kit/commit/1ec2ca36414e5703a34e6d0dfaef4d736117afee)
- **The checks were advice.** Each script could re-derive its result, but nothing called the checks.
+ **The pre-PR gate runs all three.** A missing record, a failed check or a check that can't run blocks the PR.
```

> $ git commit -m
> The reviewer still finds things. It just doesn't get to decide they're real.

## Try it

The vote script, the depth selector and the pre-PR gate are in [agent-kit](https://github.com/travist6983/agent-kit), under the code review and pre-PR skills. Their tests run offline: 165 checks for the vote script, 318 for the depth selector and 12 for the gate, all passing today.
