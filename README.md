# gitops-demo: The Living Lesson

A teaching demo for IT infrastructure and security teams. One website is both
the lesson and the thing we operate on. It runs on Kubernetes, is deployed by
Argo CD from this repo, and the lesson advances as changes are merged.

- Site: https://demo.instagib.co.uk
- `app/`: everything Argo CD deploys (kustomize). The website itself is the
  files in `app/site/`, turned into a ConfigMap, so there is no image to build.
- `runbook/`: the session script, written for a human plus an assistant.
- `CLAUDE.md`: guardrails for the assistant driving the session.

Deliberately old components (nginx, podinfo) are pinned so there is something
real to update, with a visible before/after on the page.

The Argo CD Application and project that deploy this live in the cluster's own
GitOps repo, not here.
