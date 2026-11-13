# Environment for this runbook

Scenes use these names. A new team edits only this file; scenes stay the same.

| Name | This team's value | Meaning |
|---|---|---|
| `DEMO_REPO` | `~/gitops-demo` | local clone of the application repo (what Argo CD deploys) |
| `DEMO_REPO_SLUG` | `JonathanLew1s/gitops-demo` | GitHub owner/name of that repo |
| `NS` | `gitops-demo` | the namespace the demo runs in |
| `ARGO_APP` | `gitops-demo` | Argo CD Application for the app (namespace `argocd`) |
| `SITE` | `https://demo.instagib.co.uk` | public URL; fall back to a port-forward if the route is not up |
| `PLATFORM_REPO` | `~/talos` (work in a separate worktree) | the platform team's repo: namespaces, quota, routes |
| `PLATFORM_QUOTA_FILE` | `kubernetes/apps/gitops-demo/quota.yaml` | where the platform-owned quota lives |
| `RESTORE_TAG` | `session-start` | git tag in the demo repo that is the known-good start state |

Port-forward fallback when the public route is not up:

```sh
kubectl -n $NS port-forward svc/gitops-demo-ui 18080:8080   # then SITE=http://localhost:18080
```

Force Argo CD to look at git now (instead of waiting up to 3 minutes):

```sh
kubectl -n argocd annotate application $ARGO_APP argocd.argoproj.io/refresh=hard --overwrite
```

Promote a canary that is paused at 50% (what the Argo Rollouts plugin does, without needing the plugin):

```sh
kubectl -n $NS patch rollout podinfo --type merge --subresource status -p '{"status":{"pauseConditions":null}}'
```

Measure availability on the public URL while a scene runs (writes `epoch status` every ~0.25s):

```sh
end=$(( $(date +%s) + 60 )); while [ $(date +%s) -lt $end ]; do echo "$(date +%s) $(curl -s -o /dev/null -m 3 -w '%{http_code}' $SITE/api/)"; sleep 0.25; done > /tmp/probe.log
awk '$2!=200{n++} {t++} END{print t" probes, "n+0" failed"}' /tmp/probe.log
```
