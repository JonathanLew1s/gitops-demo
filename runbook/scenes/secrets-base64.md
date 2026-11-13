---
id: secrets-base64
title: A Secret is encoded, not encrypted
deck: secrets
risk: reversible
reset: delete the fake secret
---

# A Secret is encoded, not encrypted

Uses a made-up value only. Never use a real credential.

## Preconditions
```sh
kubectl -n $NS get secret demo-fake 2>&1 | grep -c NotFound   # 1: it does not exist yet
```

## Say
"A Kubernetes Secret looks protected. Anyone allowed to read it can decode it in one command, so who may read it is the real control."

## Do
1. `kubectl -n $NS create secret generic demo-fake --from-literal=password=not-a-real-secret`
2. `kubectl -n $NS get secret demo-fake -o jsonpath='{.data.password}'` — "this looks scrambled"
3. `kubectl -n $NS get secret demo-fake -o jsonpath='{.data.password}' | base64 -d` — "it is just base64"
4. `kubectl -n $NS delete secret demo-fake`

## See
The scrambled string, then the plain text, in the terminal.

## Check
```sh
kubectl -n $NS get secret demo-fake 2>&1 | grep -c NotFound   # 1: it is gone
```

## Plan B
If creation is forbidden, explain that RBAC is blocking it, which is the point of the slide.

## Reset
```sh
kubectl -n $NS delete secret demo-fake --ignore-not-found
```
