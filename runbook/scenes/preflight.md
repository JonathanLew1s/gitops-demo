---
id: preflight
title: Pre-session check, everything green before we start
deck: none
risk: read-only
reset: none
---

# Pre-session check

Run this 30 minutes before, and again just before starting. Read-only.

## Preconditions
```sh
gh auth status
kubectl get nodes --no-headers | grep -vc ' Ready '    # 0
```

## Say
(Not spoken. This is for the presenter.)

## Do
```sh
kubectl -n argocd get application gitops-demo gitops-demo-platform --no-headers | awk '{print $1,$2,$3}'   # both Synced Healthy
kubectl -n $NS get pods --no-headers | awk '{print $1,$2,$3}'                                              # 1 web, 1 podinfo, 1/1 Running
kubectl -n $NS get rollout podinfo -o jsonpath='{.spec.replicas} {.status.phase}{"\n"}'                  # 1 Healthy
kubectl -n $NS describe resourcequota platform-quota | grep pods                                           # pods used/6
curl -s $SITE/api/ | jq -c '{version,color,message}'                                                       # 6.5.0, red, v1
curl -s $SITE/chapters.json | jq '[.chapters[].unlocked]'                                                  # only chapter 0 true
kubectl -n $NS get secret demo-fake 2>&1 | grep -c NotFound                                                # 1
curl -s -o /dev/null -w '%{http_code}\n' 'https://api.github.com/repos/$DEMO_REPO_SLUG/pulls?per_page=1'  # 200 (the slide ticker needs this)
cd $DEMO_REPO && git fetch -q --tags && git switch main && git pull --ff-only && git diff $RESTORE_TAG --stat -- app | tail -1   # empty: matches the restore point
gh api repos/$DEMO_REPO_SLUG/rulesets --jq length ; gh api repos/$DEMO_REPO_SLUG/collaborators --jq '[.[].login]'   # note what is set up
```

## See
Every line matches the comment beside it.

## Check
All of the above. Any mismatch: fix it with `reset-all` before the session, not during.

## Plan B
If GitHub is unreachable, the deck ticker will show "unreachable"; the session still works from the terminal.

## Reset
None.
