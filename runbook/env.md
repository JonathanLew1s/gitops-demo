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
