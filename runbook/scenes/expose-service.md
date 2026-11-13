---
id: expose-service
title: Opening a door to the internet, deliberately
deck: expose
risk: needs-human-approval
reset: remove the route again (platform PR) if the session ends without it
---

# Opening a door to the internet, deliberately

Presenter-led. The Cloudflare tunnel and DNS step uses credentials the assistant does not hold: the presenter runs that part. The assistant prepares and explains the git side.

## Preconditions
```sh
kubectl -n $NS get svc gitops-demo-ui    # ClusterIP only: no external address, not reachable from outside
curl -s -o /dev/null -m 6 -w '%{http_code}\n' $SITE   # expect NOT 200 before the door is opened (404/52x). If 200, the route is already live: say so and skip to "See".
```

## Say
"Right now this site is private to the cluster. Making it public is a deliberate, reviewed act, not a side effect."

## Do
1. Show it is private: the Service has no external IP; `kubectl -n $NS get svc`.
2. Show how it will be exposed: an outbound-only tunnel from the cluster to Cloudflare. "No inbound firewall hole, no public IP on the cluster."
3. The platform change: a pull request in the platform repo adding the route (hostname to the service) to the tunnel config. Open it, let checks run, merge on approval (platform repo, not the demo repo).
4. Presenter: run the tunnel/DNS script with the credentials.
5. Open the public URL. Show the certificate in the browser: issued and renewed at the edge, nobody booked a calendar reminder.

## See
The public URL goes from "not found" to the lesson page; the padlock shows a valid certificate.

## Check
```sh
curl -s -o /dev/null -w '%{http_code}\n' $SITE   # 200
curl -sI $SITE | head -3
```

## Plan B
If the DNS script or token fails, say so, and use the port-forward fallback in env.md. The exposure model is the lesson, not the live DNS.

## Reset
Remove the route from the tunnel config through a platform PR and re-run the script if you need the door closed again.
