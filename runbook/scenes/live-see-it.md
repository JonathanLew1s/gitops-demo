---
id: live-see-it
title: See the real building blocks
deck: live-see-it
risk: read-only
reset: none
---

# See the real building blocks

Read-only. Only the demo namespace and the node list: never list other namespaces on screen.

## Preconditions
```sh
kubectl -n $NS get pods
```

## Say
"Everything I described exists. Here it is, and each answer matches something on the page."

## Do
Advance one step per cue; explain each output in one sentence.
1. `kubectl get nodes` — the servers (the cluster)
2. `kubectl -n $NS get pods` — the running copies (the tiles)
3. `kubectl -n $NS get replicasets` — the supervisor and its count
4. `kubectl -n $NS get service` — the front desk
5. `kubectl -n $NS describe resourcequota` — the department budget

## See
Each answer lines up with a tile, a count or a limit on the lesson page.

## Check
```sh
kubectl -n $NS get pods --no-headers | grep -c Running   # at least 2
```

## Plan B
If `kubectl` is slow, show the same facts in the Argo CD UI resource tree.

## Reset
None.
