---
id: live-unlock
title: Unlock the next chapter through a real pull request
deck: live-unlock
risk: needs-human-approval
reset: revert the unlock commit through a second PR (or restore RESTORE_TAG)
---

# Unlock the next chapter through a real pull request

The life of a software change, end to end, on the live site.

## Preconditions
```sh
cd $DEMO_REPO && git switch main && git pull --ff-only && git status --short   # clean
gh auth status
kubectl -n argocd get application $ARGO_APP -o jsonpath='{.status.sync.status} {.status.health.status}{"\n"}'   # Synced Healthy
jq '.chapters[1].unlocked' app/site/chapters.json                               # false
```

## Say
"Nobody logs into a server. We change a text file on a branch, ask for review, and the platform does the rest."

## Do
Advance one step per cue. Narrate before each.
1. Branch: `git switch -c unlock-chapter-1` — "a safe draft; production is untouched"
2. Change exactly one value: `sed -i '/"id": 1,/s/"unlocked": false/"unlocked": true/' app/site/chapters.json` (do NOT use jq: it reformats the whole file and the diff stops being one line). Replace the placeholder body of `app/site/chapter-1.html` with the snippet below. Show `git diff`: one changed line in chapters.json plus the new chapter text.
3. Commit and push: `git commit -am "Unlock chapter 1: Git, the time machine"` then `git push -u origin unlock-chapter-1`
4. Open the pull request: `gh pr create --fill` and show the PR page and the ticker on the slide (press R on the slide).
5. Automated checks: `gh pr checks --watch` — "a robot rejects broken manifests before a human spends time"
6. **Pause for the human.** Ask the reviewer to approve in GitHub. Do not merge until the presenter says "approved". (If no ruleset is set yet, the presenter decides.)
7. Merge: `gh pr merge --squash --delete-branch`, then force Argo to look (see env.md).
8. Watch the lesson page: chapter 1 unlocks without a reload.

Chapter 1 snippet for step 2:
```html
<h3>1. Git: the time machine</h3>
<p>Git remembers every version of your files: what changed, who changed it, when, and why. You choose when to take a snapshot (a commit); Git can then show the difference between any two.</p>
<div class="callout"><b>You just watched this chapter unlock.</b> Someone changed one line in a file, asked for review, a robot checked it, a person approved it, and the platform applied it. No server was logged into.</div>
```

## See
Rehearsed: merge to live on the public site in about 16 seconds, with zero failed requests while the web tier rolled.

- The pull request appears on the slide's ticker, then turns "merged".
- The Argo CD application briefly goes OutOfSync, then Synced.
- On the lesson page the 🔒 on chapter 1 disappears and the new text shows.

## Check
```sh
curl -s $SITE/chapters.json | jq '.chapters[1].unlocked'   # true
kubectl -n argocd get application $ARGO_APP -o jsonpath='{.status.sync.status} {.status.health.status}{"\n"}'   # Synced Healthy
gh pr view --json state --jq .state                          # MERGED
```

## Plan B
1. Page not updated after merge: run the Argo refresh in env.md, wait 30 seconds.
2. Checks fail: `gh run list --limit 1` then `gh run view --log-failed`; fix on the branch, push, the checks re-run.
3. Reviewer cannot approve: stop and tell the room why. The control working is the lesson.
4. Public URL down: use the port-forward fallback in env.md.

## Reset
```sh
cd $DEMO_REPO && git switch main && git pull --ff-only
git switch -c reset-unlock && git restore --source=$RESTORE_TAG --staged --worktree app/site/chapters.json app/site/chapter-1.html
git commit -m "Reset: relock chapter 1" && git push -u origin reset-unlock && gh pr create --fill && gh pr merge --squash --delete-branch
```
