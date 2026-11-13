---
id: approval-gate
title: Add the approvers and turn on the approval gate
deck: approvers
risk: needs-human-approval
reset: remove the ruleset, the collaborators and CODEOWNERS
---

# Add the approvers and turn on the approval gate

Verified beforehand on this repo: a free account on a public repo supports rulesets, required reviews and code-owner review. A disabled test ruleset with these exact rules was created and deleted successfully.

The gate requires **2 approvals from code owners**, and the repo admin (the presenter) can bypass it on a pull request, so the session can still change things. Direct pushes to main stay blocked even for the admin.

Two facts that decide the design:
- **Reviewers need Write access for their approval to count.** A Read collaborator can comment but their approval does not satisfy a required review.
- **The author cannot approve their own pull request.** That is what makes the demonstration work.

## Preconditions
```sh
gh auth status
gh api repos/$DEMO_REPO_SLUG --jq .visibility                  # public
gh api repos/$DEMO_REPO_SLUG/rulesets --jq length               # 0
gh api repos/$DEMO_REPO_SLUG/collaborators --jq '[.[].login]'   # only the owner
cd $DEMO_REPO && git switch main && git pull --ff-only && git status --short
```
The presenter has two GitHub usernames from the room (call them REVIEWER_ONE and REVIEWER_TWO), and the reviewers have a browser logged in to GitHub.

## Say
"Right now anyone with access could change this. We are going to add two of you as reviewers, and then I will not be able to ship my own change."

## Do
Advance one step per cue. Never invent a username: use exactly what the presenter gives you.
1. Check the usernames exist: `gh api users/REVIEWER_ONE --jq .login` and the same for the second. If either fails, stop and ask.
2. Invite them with Write access: `gh api -X PUT repos/$DEMO_REPO_SLUG/collaborators/REVIEWER_ONE -f permission=push --jq '.invitee.login'` then the same for the second. Say why Write, not Read. Show `gh api repos/$DEMO_REPO_SLUG/invitations --jq '[.[].invitee.login]'`.
3. They accept: by the email GitHub sent, or at https://github.com/$DEMO_REPO_SLUG/invitations while logged in. Wait until `gh api repos/$DEMO_REPO_SLUG/collaborators --jq '[.[].login]'` lists both. Do not continue until it does.
4. Add CODEOWNERS through a pull request, because this is also a change: `git switch -c add-codeowners`, `sed 's/@REVIEWER_ONE/@<first>/; s/@REVIEWER_TWO/@<second>/' runbook/CODEOWNERS.template > .github/CODEOWNERS`, show the file, commit, push, `gh pr create --fill`, wait for checks, `gh pr merge --squash --delete-branch`. The gate is not on yet, so this merges directly.
5. Turn on the gate: `gh api -X POST repos/$DEMO_REPO_SLUG/rulesets --input runbook/ruleset.json --jq '"ruleset \(.id) \(.enforcement)"'`. Note the id. Show it at Settings, Rules in the browser.
6. Prove it with the next scene's pull request (for example `live-unlock`): open it as the owner, show the Merge button blocked ("review required"), show the owner cannot approve it, then have BOTH reviewers approve in their browsers (one approval is not enough), and show the merge become available. Then merge. Separately show that the owner could use "Merge without waiting for requirements" (admin bypass) and say when that is appropriate: emergencies, recorded and visible.

## See
- Step 3: both usernames appear as collaborators.
- Step 6: the merge is blocked until two different people approve; the author cannot count as one.

## Check
```sh
gh api repos/$DEMO_REPO_SLUG/collaborators --jq '[.[]|{login,write:.permissions.push}]'   # both reviewers, write true
gh api repos/$DEMO_REPO_SLUG/rulesets --jq '.[]|"\(.name) \(.enforcement)"'                 # main-approval-gate active
test -f $DEMO_REPO/.github/CODEOWNERS && echo codeowners present
```

## Plan B
- A reviewer cannot accept the invitation or has no account yet: create one live (a free account takes a few minutes) or use the other reviewer; one approver is enough to demonstrate.
- A reviewer's approval does not unlock the merge: check they accepted, that they are listed with write access, and that the username in CODEOWNERS matches exactly.
- **Break glass** (the gate is blocking the session and you must continue): `gh api -X PUT repos/$DEMO_REPO_SLUG/rulesets/<id> -f enforcement=disabled`, or Settings, Rules, disable. Say plainly that you did.
- Only one reviewer is available: the gate needs 2, so use the admin bypass for the merge, or set `required_approving_review_count` to 1 in a copy of ruleset.json before step 5.

## Reset
```sh
gh api -X DELETE repos/$DEMO_REPO_SLUG/rulesets/<id>
gh api -X DELETE repos/$DEMO_REPO_SLUG/collaborators/REVIEWER_ONE
gh api -X DELETE repos/$DEMO_REPO_SLUG/collaborators/REVIEWER_TWO
```
Then remove `.github/CODEOWNERS` through a PR (restore from `$RESTORE_TAG`), and confirm with the `preflight` scene. Do this after the session so the reviewers do not keep Write access.
