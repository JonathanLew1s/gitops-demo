---
id: live-drift
title: Edit production by hand and watch it get reverted
deck: live-drift
risk: reversible
reset: none (Argo CD reverts it itself)
---

# Edit production by hand and watch it get reverted

## Preconditions
```sh
kubectl -n $NS get deploy web -o jsonpath='{.spec.replicas}{"\n"}'   # note it; the scene expects 1
kubectl -n $NS get rollout podinfo -o jsonpath='{.status.phase}{"\n"}'   # Healthy (no rollout in progress)
kubectl -n argocd get application $ARGO_APP -o jsonpath='{.status.sync.status}{"\n"}'   # Synced
kubectl -n $NS describe resourcequota platform-quota | grep pods   # room for 5 more pods
```

## Say
"A well-meaning engineer fixes something quickly on the server. Watch what the platform does about it."

## Do
Advance one step per cue.
1. `kubectl -n $NS scale deployment web --replicas=5` — "a quick manual fix"
2. `kubectl -n $NS get pods -l app.kubernetes.io/name=web -w` (Ctrl-C after a few lines) — extra copies appear; point at the tiles on the lesson page
3. `kubectl -n argocd get application $ARGO_APP` — "OutOfSync: git says 1, the cluster says 5"
4. Wait. Self-heal restores git's value, usually within 10 to 30 seconds.

## See
Extra pod tiles appear on the lesson page, then disappear. Argo CD shows OutOfSync, then Synced.

## Check
```sh
kubectl -n $NS get deploy web -o jsonpath='{.spec.replicas}{"\n"}'   # back to the original value
kubectl -n argocd get application $ARGO_APP -o jsonpath='{.status.sync.status}{"\n"}'   # Synced
```

## Plan B
If it has not reverted after 60 seconds, run the Argo refresh in env.md and check `kubectl -n argocd get application $ARGO_APP -o jsonpath='{.spec.syncPolicy}'` still has `selfHeal: true`. If not, restore with `kubectl -n $NS scale deployment web --replicas=<original>` and say so plainly.

## Reset
None needed. If you stopped early: `kubectl -n $NS scale deployment web --replicas=<original>`.
