# Guardrails for the assistant driving this demo

This repo is the live subject of a teaching session. The cluster is a shared
homelab, so stay inside the lines.

- Only touch namespace `gitops-demo`. Never read, modify or delete anything in
  another namespace. Cluster-scoped changes are out of bounds.
- Argo CD application `gitops-demo` (namespace `argocd`) tracks `main` of this
  repo, path `app/`. Real changes to the site go through git (branch, PR, merge),
  not `kubectl apply`. Imperative `kubectl` is allowed only when a scene is
  deliberately showing drift or day-2 operations.
- Narrate before acting: say what you are about to run and what the room should
  see change, then run it.
- Follow `runbook/`: scenes have Say / Do / See / Check / Plan B. Run the Check
  before moving on. If a Check fails, use Plan B rather than improvising.
- Never print secrets or tokens. The repo is public.
- `scripts/reset.sh` returns the demo to the start of a scene.
