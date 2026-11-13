---
id: reset-all
title: Return everything to the session start
deck: none
risk: reversible
reset: none
---

# Return everything to the session start

Use between rehearsals, or after a session. Everything is git, so this is a pull request that restores the known-good tree.

## Preconditions
```sh
cd $DEMO_REPO && git fetch -q --tags && git switch main && git pull --ff-only && git status --short   # clean
git rev-parse --short $RESTORE_TAG
```

## Say
(Not spoken.)

## Do
1. Demo repo: `git switch -c reset-all && git restore --source=$RESTORE_TAG --staged --worktree app` then `git diff --cached --stat`. If empty, nothing to do. Otherwise commit, push, `gh pr create --fill`, `gh pr checks --watch`, `gh pr merge --squash --delete-branch`, refresh Argo.
2. If a canary is paused: run the promote command in env.md.
3. Platform quota: if `kubectl -n $NS get resourcequota platform-quota -o jsonpath='{.spec.hard.pods}'` is not 6, set `pods: "6"` in `$PLATFORM_QUOTA_FILE` through a PR in the platform repo (separate worktree), merge, refresh.
4. Remove leftovers: `kubectl -n $NS delete secret demo-fake --ignore-not-found`.
5. If you added collaborators or a ruleset in a rehearsal, remove them in the repo settings.

## See
The lesson page shows v1 in red, one backend tile, chapter 0 only unlocked.

## Check
Run the `preflight` scene.

## Plan B
If Argo does not pick up the reset, refresh it (env.md). Only as a last resort use `kubectl -n $NS rollout`-style manual fixes, and tell the room why.

## Reset
Not applicable.
