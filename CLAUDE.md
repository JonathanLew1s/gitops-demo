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

## Running a scene

Live slides show a trigger chip: a scene id and a cue such as `Run scene live-unlock`.
When the presenter says (or pastes) `Run scene <id>`:

1. Read `runbook/env.md` for the names, then `runbook/scenes/<id>.md`. Follow that file, not memory.
2. Run **Preconditions**. If one fails, stop and say which.
3. Say the **Say** line, then perform **Do** one step per cue from the presenter ("next"). Narrate before each command.
4. After the steps run **Check**. Never move on past a failing Check: use **Plan B**.
5. Scenes marked `needs-human-approval` pause at the approval step until the presenter says it is approved. Never approve or merge on a human's behalf.
6. Offer **Reset** at the end if the presenter wants a clean state.

A scene may only touch what its own file lists. If a scene seems to need more, stop and ask.
