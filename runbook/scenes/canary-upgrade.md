---
id: canary-upgrade
title: Upgrade the backend with a canary, two versions live at once
deck: canary-upgrade
risk: needs-human-approval
reset: restore the backend manifest from RESTORE_TAG and promote the downgrade canary
---

# Upgrade the backend with a canary, two versions live at once

Rehearsed: the full upgrade, 304 probes against the public URL, 0 failed. At the 50% pause: stable tab shows v6.5.0 red, canary tab shows v6.9.4 green, the everything view splits 50/50.

## Preconditions
```sh
cd $DEMO_REPO && git switch main && git pull --ff-only && git status --short
kubectl -n $NS get rollout podinfo -o jsonpath='{.status.phase}{"\n"}'                      # Healthy
curl -s $SITE/api/ | jq -c '{version,color}'                                                   # 6.5.0, red
kubectl -n $NS get rollout podinfo -o jsonpath='{.spec.replicas}{"\n"}'                     # 2 ideal (1 also works)
```
Three browser tabs on the lesson page: set one to "Stable version only", one to "Canary version only", one to "Everything (auto)".

## Say
"The old version is vulnerable. We are going to replace it while people are using it, without anyone noticing."

## Do
Advance one step per cue.
1. Branch and make the change: `git switch -c upgrade-podinfo`, then `sed -i 's|podinfo:6.5.0|podinfo:6.9.4|; s|value: "#c0392b"|value: "#27ae60"|; s|value: "v1: running, but out of date"|value: "v2: patched and up to date"|' app/podinfo-rollout.yaml`. Show `git diff`: three lines: version, colour, message.
2. Commit, push, `gh pr create --fill`, `gh pr checks --watch`. Pause for the approver.
3. Merge: `gh pr merge --squash --delete-branch`, refresh Argo (env.md).
4. Watch: `kubectl -n $NS get rollout podinfo -w` (Ctrl-C when Paused). About 50 seconds: new copies start, the automated tests run (`kubectl -n $NS get analysisrun`), then it pauses at 50%.
5. **The moment:** across the three tabs, stable stays red v6.5.0, canary is green v6.9.4, auto shows the mix. Both versions live, no one told.
6. Promote: run the promote command in env.md. About 20 seconds later everything is v6.9.4 and the old copies retire.

## See
The version bar splits 50/50, two tabs show different colours and versions, then every tab turns green v6.9.4. The availability bar stays green throughout.

## Check
```sh
kubectl -n $NS get rollout podinfo -o jsonpath='{.status.phase}{"\n"}'          # Healthy
curl -s $SITE/api/ | jq -c '{version,color,message}'                              # 6.9.4 green v2
kubectl -n $NS get analysisrun --sort-by=.metadata.creationTimestamp --no-headers | tail -1   # Successful
```

## Plan B
- Not paused after 90 seconds: `kubectl -n $NS get rollout podinfo -o jsonpath='{.status.message}'` and `kubectl -n $NS describe analysisrun $(kubectl -n $NS get analysisrun --sort-by=.metadata.creationTimestamp -o name | tail -1 | cut -d/ -f2)`.
- A tab shows the wrong version: check its selector; the pin is per tab and survives refresh.
- Never leave the rollout paused when the scene ends: promote or revert.

## Reset
```sh
cd $DEMO_REPO && git switch main && git pull --ff-only && git switch -c reset-upgrade
git restore --source=$RESTORE_TAG --staged --worktree app/podinfo-rollout.yaml
git commit -m "Reset: backend back to v1" && git push -u origin reset-upgrade && gh pr create --fill && gh pr merge --squash --delete-branch
```
Refresh Argo, wait for Paused, run the promote command in env.md, and confirm v6.5.0 red. (A downgrade is also a canary.)
