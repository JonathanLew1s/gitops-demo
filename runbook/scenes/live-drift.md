---
id: live-drift
title: Edit production by hand and watch it get reverted
deck: live-drift
risk: reversible
reset: none (Argo CD reverts it itself)
---

# Edit production by hand and watch it get reverted

Rehearsed: Argo CD reverted the change in about 3 seconds. That is too fast to see the status flip on a dashboard, so the evidence is the events and the pods.

## Preconditions
```sh
kubectl -n $NS get deploy web -o jsonpath='{.spec.replicas}{"\n"}'      # note it; the scene expects 1
kubectl -n $NS get rollout podinfo -o jsonpath='{.status.phase}{"\n"}'  # Healthy (no rollout in progress)
kubectl -n argocd get application $ARGO_APP -o jsonpath='{.status.sync.status}{"\n"}'   # Synced
kubectl -n $NS describe resourcequota platform-quota | grep pods          # room for 4 more pods
```

## Say
"A well-meaning engineer fixes something quickly on the server. Watch what the platform does about it."

## Do
Advance one step per cue.
1. `kubectl -n $NS scale deployment web --replicas=5` — "a quick manual fix"
2. Immediately: `kubectl -n $NS get pods -l app.kubernetes.io/name=web` — extra pods are being created
3. `kubectl -n argocd get events --field-selector involvedObject.name=$ARGO_APP --sort-by=.lastTimestamp | tail -6` — read out: "Synced → OutOfSync … Initiated automated sync … OutOfSync → Synced". "Git says 1. The cluster said 5. The platform put it back."
4. `kubectl -n $NS get pods -l app.kubernetes.io/name=web` — back to one (the extras are terminating)

## See
Terminal only: extra pods appear, then terminate; the event list tells the story. (Web pods are not tiles on the lesson page, so do not wait for tiles.)

## Check
```sh
kubectl -n $NS get deploy web -o jsonpath='{.spec.replicas}{"\n"}'   # back to the original value
kubectl -n argocd get application $ARGO_APP -o jsonpath='{.status.sync.status}{"\n"}'   # Synced
```

## Plan B
If it has not reverted after 60 seconds, run the Argo refresh in env.md and check `kubectl -n argocd get application $ARGO_APP -o jsonpath='{.spec.syncPolicy}'` still has `selfHeal: true`. If not, restore with `kubectl -n $NS scale deployment web --replicas=<original>` and say so plainly.

## Reset
None needed. If you stopped early: `kubectl -n $NS scale deployment web --replicas=<original>`.
