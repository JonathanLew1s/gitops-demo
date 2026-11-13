---
id: handshake
title: Guard-rails - the app team asks, the platform team decides
deck: handshake
risk: needs-human-approval
reset: revert both pull requests (app replicas, platform quota)
---

# Guard-rails: the app team asks, the platform team decides

Two repos, two teams. The app team's change deploys but is capped by the platform-owned quota.

## Preconditions
```sh
kubectl -n $NS describe resourcequota platform-quota | grep pods          # note the cap (6)
kubectl -n argocd get application gitops-demo gitops-demo-platform        # both Synced Healthy
kubectl -n $NS get rollout podinfo -o jsonpath='{.spec.replicas} {.status.phase}{"\n"}'   # note replicas; Healthy
cd $DEMO_REPO && git switch main && git pull --ff-only && git status --short
```
Also check that `app/podinfo-rollout.yaml` `spec.replicas` is lower than the cap minus the web pods.

## Say
"Developers can ask for anything. Only the platform team can say yes to capacity, and both decisions are recorded."

## Do
Advance one step per cue.
1. **App team PR.** In `$DEMO_REPO`: `git switch -c more-capacity`, set `spec.replicas: 8` in `app/podinfo-rollout.yaml`, commit, push, `gh pr create --fill`, wait for checks, merge, refresh Argo.
2. Show the gap: `kubectl -n $NS get rollout podinfo` (rehearsed: wanted 8, only 5 running) and `kubectl -n $NS get events --field-selector reason=FailedCreate | tail -3` ("exceeded quota"). The page shows fewer tiles than requested.
3. **Platform team PR.** In a separate worktree of `$PLATFORM_REPO`: branch from `origin/main`, edit `$PLATFORM_QUOTA_FILE`, set `pods: "12"` (and keep CPU/memory requests above need), commit, push, open the PR, wait for its checks, merge (this change touches only a manifest, so the platform repo may run no checks; confirm with `gh pr checks` and say so), refresh the `argocd-applications` app and `gitops-demo-platform`. The quota changes within about 10 seconds.
4. **Nudge the supervisor.** Kubernetes backs off retrying after the quota rejection and the backoff grows, so the missing pods do not appear by themselves for minutes. Say so, then: `kubectl -n $NS annotate rs $(kubectl -n $NS get rs --no-headers | awk '$2>0 && /^podinfo/{print $1}') demo.nudge=$(date +%s) --overwrite`. Rehearsed: 8 of 8 within 6 seconds.
5. Show the pods appear: `kubectl -n $NS get pods`.

## See
Step 2: red/short on the page and `exceeded quota` in events. Step 4: all tiles appear without anyone touching the app.

## Check
```sh
kubectl -n $NS get rollout podinfo -o jsonpath='{.status.availableReplicas}{"\n"}'   # 8
kubectl -n $NS describe resourcequota platform-quota | grep pods                     # pods: N/12
```

## Plan B
If pods are still missing after the nudge, wait 10 seconds and nudge once more. If the quota change does not apply: refresh `gitops-demo-platform` and `argocd-applications`. If the platform repo check fails, read the failure aloud: the platform repo guards itself too.

## Reset
Revert both: in the demo repo restore `app/podinfo-rollout.yaml` from `$RESTORE_TAG` via a PR; in the platform repo set `pods` back to `"6"` via a PR. Confirm `Synced Healthy` on both apps.
