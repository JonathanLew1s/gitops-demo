# Session runbook

The session is driven by a presenter and an assistant. Live slides in the deck
carry a **trigger chip** (a scene id, a "Copy cue" button, and a link here).
The presenter says `Run scene <id>`; the assistant follows `scenes/<id>.md`.

- `env.md`: the only file a new team edits (repo paths, URLs, namespace names).
- `scenes/`: one file per live moment, all in the same shape:
  Preconditions, Say, Do, See, Check, Plan B, Reset. Copy `_template.md`.
- `validate_scenes.py`: runs in CI. A live slide without a scene file, a scene
  without a live slide, or a scene missing a section fails the build.

| Scene | What it shows | Risk |
|---|---|---|
| `live-sandbox` | commit, status, log, diff in a throwaway folder | read-only |
| `live-see-it` | nodes, pods, replicasets, service, quota | read-only |
| `live-unlock` | a real change: branch, PR, checks, approval, merge, live | needs human approval |
| `live-drift` | edit production by hand, watch Argo CD revert it | reversible |
| `handshake` | app team asks, platform team decides (quota) | needs human approval |
| `secrets-base64` | a Secret is encoded, not encrypted | reversible |

Adding a scene for a new slide: give the slide `data-scene="<id>"`, copy the
template to `scenes/<id>.md`, fill it in, push. CI tells you what is missing.

Site: https://demo.instagib.co.uk
