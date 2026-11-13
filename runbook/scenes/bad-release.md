---
id: bad-release
title: A bad release is stopped by the automated tests, then rolled back by revert
deck: bad-release
risk: needs-human-approval
reset: revert the bad release (the scene ends with that)
---

# A bad release is stopped by the automated tests, then rolled back by revert

Rehearsed: the platform aborted the bad release 19 seconds after it started, users ended on the good version, and 4 of 282 requests failed (1.4%) in that window. The revert restored Healthy in 21 seconds.

## Preconditions
```sh
kubectl -n $NS get rollout podinfo -o jsonpath='{.status.phase}{"\n"}'   # Healthy
kubectl -n $NS get analysistemplate smoke-test -o jsonpath='{.spec.metrics[0].consecutiveErrorLimit}{"\n"}'   # 0 (strict)
cd $DEMO_REPO && git switch main && git pull --ff-only && git status --short
```

## Say
"Not every release is good. The question is what happens when it isn't."

## Do
Advance one step per cue.
1. Branch: `git switch -c bad-release`. Make a "buggy" version with one command: `sed -i 's|^            - --level=info$|&\n            - --random-error=true|; s|^\(              value: "\)v[0-9]:[^"]*"|\1v3: the release with a bug"|' app/podinfo-rollout.yaml`. Show `git diff`: one added flag and a new message. Explain: this flag makes about a third of requests fail.
2. Commit, push, `gh pr create --fill`, `gh pr checks --watch`. Note: the manifest checks pass; they cannot know the software is faulty. That is what the live tests are for. Pause for the approver.
3. Merge and refresh Argo. `kubectl -n $NS get rollout podinfo -w`
4. Within about 20 seconds: `RolloutAborted`, status Degraded, analysis Error. Argo CD shows Degraded. "The platform tested the new version on a small share of traffic, saw errors, and stopped."
5. Prove users are safe: `for i in $(seq 1 10); do curl -s $SITE/api/ | jq -r .version; done | sort | uniq -c` shows only the old good version.
6. Fix it the normal way: `git revert --no-edit HEAD` on a branch, push, PR, merge, refresh Argo. About 20 seconds to Healthy. "Rollback is a reviewed commit, with the whole story in the history."

## See
Rollout turns Degraded then Healthy; a few red blocks may flicker on the availability bar during the first 20 seconds; the version bar returns to a single colour.

## Check
```sh
kubectl -n $NS get rollout podinfo -o jsonpath='{.status.phase}{"\n"}'                  # Healthy
kubectl -n $NS get pods -l app.kubernetes.io/name=podinfo -o json | jq -r '.items[].spec.containers[0].command | join(" ")' | grep -c random-error   # 0
```

## Plan B
- If the bad release is NOT aborted (the random errors can miss every sample, about 1 in 200): promote nothing. Revert it as in step 6 and say plainly that it got lucky; show the strict test config.
- If the revert does not take: refresh Argo and wait; the rollout returns to the stable copy without re-running tests.

## Reset
Step 6 is the reset. Confirm the Check passes.
