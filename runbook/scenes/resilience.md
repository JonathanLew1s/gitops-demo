---
id: resilience
title: One copy fails, two copies do not
deck: single-copy
risk: needs-human-approval
reset: revert the scale PR (restore replicas to 1)
---

# One copy fails, two copies do not

Rehearsed: crashing the only backend copy gave about 12 seconds of outage (16 failed requests of 83). With 2 copies, crashing one gave 0 failures in three runs.

## Preconditions
```sh
cd $DEMO_REPO && git switch main && git pull --ff-only && git status --short
kubectl -n $NS get rollout podinfo -o jsonpath='{.spec.replicas} {.status.phase}{"\n"}'   # 1 Healthy
kubectl -n $NS get deploy web -o jsonpath='{.spec.replicas}{"\n"}'                          # 1
kubectl -n argocd get application $ARGO_APP -o jsonpath='{.status.sync.status} {.status.health.status}{"\n"}'   # Synced Healthy
```
The lesson page must be open and fullscreen on the "Availability" bar before step 1.

## Say
"One copy of anything is a single point of failure. Let's prove it, fix it with a reviewed change, and prove it again."

## Do
Advance one step per cue.
1. Show the page: all green, one backend tile. "One copy of the backend."
2. Crash it: `kubectl -n $NS delete pod -l app.kubernetes.io/name=podinfo --grace-period=0 --force` — "an abrupt crash, no warning". Watch the bar turn red for roughly 12 seconds while the replacement warms up.
3. Open the fix as a pull request: `cd $DEMO_REPO && git switch -c scale-to-two`, then `sed -i '0,/^  replicas: 1$/s//  replicas: 2/' app/podinfo-rollout.yaml app/web-deployment.yaml` (the first replicas line in each file), `git diff`, commit, push, `gh pr create --fill`, `gh pr checks --watch`. Pause for approval if a ruleset is set.
4. Merge: `gh pr merge --squash --delete-branch`, refresh Argo (env.md). Wait for 4 ready pods (about 20 seconds); two tiles appear.
5. Crash one backend copy again: `kubectl -n $NS delete pod $(kubectl -n $NS get pods -l app.kubernetes.io/name=podinfo -o name | head -1) --grace-period=0 --force` — the bar stays green.

## See
Step 2: red blocks on the availability bar, then green. Step 5: no red.

## Check
```sh
kubectl -n $NS get pods --no-headers | grep -c ' 1/1 *Running'   # 4 after step 4
kubectl -n $NS get rollout podinfo -o jsonpath='{.spec.replicas}{"\n"}'   # 2
```

## Plan B
- If step 2 shows no red: the pod restarted faster than expected; repeat once, or measure with the probe in env.md and show the numbers.
- If someone asks why a normal `kubectl delete` shows nothing: a graceful delete lets the old copy keep answering while the new one starts. A crash gets no grace period. That is a good thing about the platform.
- Killing a web pod as well can cause a half-second blip (its open connections drop). Say so honestly if you try it.

## Reset
Revert replicas to 1 through a PR: `git switch -c reset-replicas && git restore --source=$RESTORE_TAG --staged --worktree app/podinfo-rollout.yaml app/web-deployment.yaml`, commit, push, PR, merge, refresh Argo.
