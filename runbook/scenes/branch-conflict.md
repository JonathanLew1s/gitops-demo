---
id: branch-conflict
title: Two people on one branch, then a deliberate merge conflict
deck: turn-branch-a
risk: reversible
reset: close the pull requests, delete the branches, reset main to the practice-start tag, remove the collaborators
---

# Two people on one branch, then a deliberate merge conflict

Uses the separate practice repository (`$PRACTICE_REPO_SLUG`), never the demo repository. Everything is done by the room in the GitHub web editor: nobody installs anything. Rehearsed on this repo: two branches editing the same `replicas:` line, the first merged, the second showed `CONFLICTING`, and the conflict markers appeared as on the slide.

## Preconditions
```sh
gh api repos/$PRACTICE_REPO_SLUG --jq '.visibility'                        # public
gh api repos/$PRACTICE_REPO_SLUG/branches --jq '[.[].name]'                 # ["main"] only
gh pr list -R $PRACTICE_REPO_SLUG --state open --json number --jq length    # 0
gh api repos/$PRACTICE_REPO_SLUG/commits/main --jq '.sha[0:7]'              # equals the practice-start tag
```
The presenter has the GitHub usernames of the people who will drive (two is enough; more is fine).

## Say
"Two people can work on one branch safely. When they change the same line, Git stops and asks. Let's make that happen on purpose."

## Do
1. Check each username exists: `gh api users/<name> --jq .login`. Never invent one.
2. Invite each with Write access: `gh api -X PUT repos/$PRACTICE_REPO_SLUG/collaborators/<name> -f permission=push --jq '.invitee.login'`. They must accept the email invitation (or at https://github.com/$PRACTICE_REPO_SLUG/invitations). Wait until `gh api repos/$PRACTICE_REPO_SLUG/collaborators --jq '[.[].login]'` lists them.
3. Hand over to the room: the on-screen slides (Part A, then Part B) carry the instructions. Do not narrate them.
4. When Part A is merged, check it: `gh pr list -R $PRACTICE_REPO_SLUG --state merged --json number,title,commits --jq '.[0]'` should show two commits by two authors.
5. When Part B shows the conflict, show `gh pr list -R $PRACTICE_REPO_SLUG --json number,mergeable --jq '.[]'` (one is `CONFLICTING`). Do not resolve it for them.

## See
Part A: one pull request with two authors, merged with no conflict. Part B: the second pull request says "This branch has conflicts", and the web editor shows the markers.

## Check
```sh
gh pr list -R $PRACTICE_REPO_SLUG --state all --json number,state --jq '[.[].state]'   # at least one MERGED
gh api repos/$PRACTICE_REPO_SLUG/commits/main --jq .commit.message                    # shows the group's merges
```

## Plan B
- **The room stalls or a person cannot accept the invitation:** create the conflict yourself so it still appears:
  ```sh
  SB=$(mktemp -d) && gh repo clone $PRACTICE_REPO_SLUG $SB/p && cd $SB/p
  for b in more-copies:4:"Run 4 copies of shop: peak traffic needs the headroom" fewer-copies:2:"Run 2 copies of shop: save cost, traffic is quiet"; do
    n=${b%%:*}; r=${b#*:}; v=${r%%:*}; m=${r#*:}
    git switch -c $n main && sed -i "s/replicas: .*/replicas: $v/" config/shop.yaml && git commit -am "$m" && git push -u origin $n && gh pr create --head $n --title "$m" --body "Demonstration" && git switch main
  done
  gh pr merge more-copies --squash       # the second pull request now conflicts
  ```
  Then open the conflicting pull request in the browser and resolve it live.
- **The checks fail on the resolved file:** a marker was left in. That is a good moment: the robot caught it.
- **Someone pushes a real secret or personal data:** they must not. Use only `FAKE-TOKEN-DO-NOT-USE-1234`.

## Reset
Run after the session. This is destructive for the practice repository only, so check the slug first.
```sh
test "$PRACTICE_REPO_SLUG" = JonathanLew1s/gitops-practice || { echo "wrong repo"; exit 1; }
for n in $(gh pr list -R $PRACTICE_REPO_SLUG --state open --json number --jq '.[].number'); do gh pr close -R $PRACTICE_REPO_SLUG $n; done
for b in $(gh api repos/$PRACTICE_REPO_SLUG/branches --jq '.[].name' | grep -v '^main$'); do gh api -X DELETE repos/$PRACTICE_REPO_SLUG/git/refs/heads/$b; done
SB=$(mktemp -d) && gh repo clone $PRACTICE_REPO_SLUG $SB/p && cd $SB/p && git fetch --tags && git reset --hard practice-start && git push -f origin main
for u in $(gh api repos/$PRACTICE_REPO_SLUG/collaborators --jq '.[].login' | grep -v JonathanLew1s); do gh api -X DELETE repos/$PRACTICE_REPO_SLUG/collaborators/$u; done
```
