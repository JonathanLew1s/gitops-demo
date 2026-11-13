---
id: live-sandbox
title: Your first commit, in a throwaway sandbox
deck: live-sandbox
risk: read-only
reset: delete the sandbox folder
---

# Your first commit, in a throwaway sandbox

Nothing here touches the demo repo or the cluster.

## Preconditions
```sh
git --version
SB=$(mktemp -d) && echo "$SB"
```

## Say
"Git is a track-changes system for a folder. Watch: I will make a folder, save one snapshot, and then ask Git what it knows."

## Do
Advance one step per cue. Narrate each before running.
1. `cd $SB && git init demo && cd demo` — "an empty history"
2. `echo "hello" > notes.txt && git status` — "Git notices a new file, but is not recording it yet"
3. `git add notes.txt && git commit -m "first note"` — "that is a snapshot, with my name, the time and a reason"
4. `git log --oneline --graph` — "the history, and the short code identifying that snapshot"
5. `echo "second line" >> notes.txt && git diff` — "exactly what changed, line by line"

## See
Terminal output only. The red and green diff in step 5 matches the "What is Git?" slide.

## Check
```sh
cd $SB/demo && git log --oneline | wc -l   # 1
git diff --stat                            # shows notes.txt changed
```

## Plan B
If `git commit` complains about identity, run `git config user.name "Demo"` and `git config user.email demo@example.com` inside the sandbox only, then retry.

## Reset
```sh
rm -rf "$SB"
```
