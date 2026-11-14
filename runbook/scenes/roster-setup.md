---
id: roster-setup
title: Get everyone on GitHub, give them roles, and put their names on the slides
deck: get-on-github
risk: reversible
reset: delete the roster ConfigMap and remove the collaborators from both repositories
---

# Get everyone on GitHub, give them roles, and put their names on the slides

The room creates (or brings) free GitHub accounts. You record first names and usernames, invite them, assign the four roles, and write the roster the deck reads. The deck then shows real names on every cast slide.

The roster is a ConfigMap named `roster` in `$NS`. It is deliberately **not in git**: first names and handles go on the projector and in the cluster, never into the public repository's history. Argo CD ignores it because it does not manage it.

## Preconditions
```sh
gh auth status
kubectl -n $NS get configmap roster 2>&1 | grep -c NotFound                      # 1 (no roster yet)
gh api repos/$PRACTICE_REPO_SLUG/collaborators --jq '[.[].login]'               # only the owner
gh api repos/$DEMO_REPO_SLUG/collaborators --jq '[.[].login]'                   # only the owner
```
The deck slide "Get on GitHub" is on screen.

## Say
"Tell me your first name and your GitHub username. I will add you, and your name will appear on the screen."

## Do
Advance one cue at a time. People arrive in a trickle: handle them as they come.
1. Take each person's **first name** and **username** exactly as given. Read it back and ask them to confirm the spelling. Never guess a username from a name or email.
2. Check it exists: `gh api users/<username> --jq .login`. If it fails, ask again. Do not invite a near match without the person confirming it.
3. Invite with Write access to **both** repositories (the room edits one and reviews on the other):
   ```sh
   gh api -X PUT repos/$PRACTICE_REPO_SLUG/collaborators/<username> -f permission=push --jq '.invitee.login'
   gh api -X PUT repos/$DEMO_REPO_SLUG/collaborators/<username>    -f permission=push --jq '.invitee.login'
   ```
4. Write the roster. Assign the first four people the roles in order: author, reviewer-1, reviewer-2, owner. Everyone is also listed under `people`. Build it from `runbook/roster.example.json`, replacing the example names, into a scratch file `$F`, then:
   ```sh
   python3 -c "import json,sys; json.load(open(sys.argv[1]))" $F      # must parse
   kubectl -n $NS create configmap roster --from-file=roster.json=$F --dry-run=client -o yaml | kubectl apply -f -
   ```
5. Wait about a minute for the file to reach the web pod, then confirm: `kubectl -n $NS exec deploy/web -- cat /etc/roster/roster.json`. The names appear on the "Get on GitHub" and "Today's cast" slides without a reload (they refresh every few seconds).
6. Check acceptance as people reply: `gh api repos/$PRACTICE_REPO_SLUG/collaborators --jq '[.[].login]'`. Anyone who has not accepted cannot commit.

### Rotate the roles (between exercises)
Shift the four role assignments to the next four people from `people`, rewrite the same ConfigMap with the apply command above, and say who now has which role. The slides update on their own.

## See
Names and handles appear as chips on the "Get on GitHub" slide, and as four role cards on "Today's cast".

## Check
```sh
kubectl -n $NS exec deploy/web -- cat /etc/roster/roster.json | python3 -c "import json,sys; d=json.load(sys.stdin); print(sorted(d['roles']))"   # author, owner, reviewer-1, reviewer-2
gh api repos/$PRACTICE_REPO_SLUG/collaborators --jq 'length'                    # owner plus everyone invited
```

## Plan B
- **The names do not appear:** the file can take up to about a minute to reach the pod. Check with the `exec` command in step 5. If it is there, hard-reload the deck (Cmd-Shift-R). The deck falls back to the plain role names if the roster is missing: nothing breaks.
- **A username does not exist:** the person may have mistyped it or not finished sign-up. Move on and come back; they can watch in the meantime.
- **A person cannot accept the invitation:** invitations also appear at https://github.com/$PRACTICE_REPO_SLUG/invitations when logged in. One person without write access can still watch.
- **Fewer than four people:** assign what you have. Empty roles show as "Volunteer needed", and the presenter can fill one.

## Reset
Run after the session.
```sh
kubectl -n $NS delete configmap roster --ignore-not-found
for r in $PRACTICE_REPO_SLUG $DEMO_REPO_SLUG; do
  for u in $(gh api repos/$r/collaborators --jq '.[].login' | grep -v '^JonathanLew1s$'); do gh api -X DELETE repos/$r/collaborators/$u; done
  for i in $(gh api repos/$r/invitations --jq '.[].id'); do gh api -X DELETE repos/$r/invitations/$i; done
done
```
