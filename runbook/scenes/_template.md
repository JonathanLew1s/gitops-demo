---
id: short-kebab-id            # must match the data-scene on the deck slide and this filename
title: One line a human can read
deck: live-slide-id           # the slide that triggers this scene
risk: read-only               # read-only | reversible | needs-human-approval
reset: what undoes it, or "none"
---

# Title

## Preconditions
Commands that must succeed before starting. If one fails, stop and say so.

## Say
What the presenter says. One or two sentences.

## Do
Numbered steps. Each step: what to tell the room, then the exact command.
Advance one step per cue from the presenter. Narrate before running.

## See
What should visibly change, and where (the page, the terminal, GitHub).

## Check
Assertions (commands with expected output). Do not move on until they pass.

## Plan B
If a Check fails or something is slow: the fallback, in order.

## Reset
How to return to the state before the scene.
