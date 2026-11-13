#!/usr/bin/env python3
"""Every live slide must point at a well-formed scene file, and the reverse."""
import re, sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
scenes = {p.stem: p for p in (root / "runbook/scenes").glob("*.md") if not p.name.startswith("_")}
required = ["Preconditions", "Say", "Do", "See", "Check", "Plan B", "Reset"]
errors = []

used = set()
for deck in sorted((root / "app/site").glob("deck-*.html")):
    for sid in re.findall(r'data-scene="([^"]+)"', deck.read_text()):
        used.add(sid)
        if sid not in scenes:
            errors.append(f"{deck.name}: data-scene={sid} has no runbook/scenes/{sid}.md")

for sid, path in scenes.items():
    text = path.read_text()
    fm = re.match(r"---\n(.*?)\n---", text, re.S)
    if not fm:
        errors.append(f"{path.name}: missing frontmatter"); continue
    meta = dict(re.findall(r"^(\w+):\s*(.*?)\s*(?:#.*)?$", fm.group(1), re.M))
    if meta.get("id") != sid:
        errors.append(f"{path.name}: frontmatter id {meta.get('id')!r} != filename")
    if meta.get("risk") not in ("read-only", "reversible", "needs-human-approval"):
        errors.append(f"{path.name}: risk must be read-only | reversible | needs-human-approval")
    for h in required:
        if not re.search(rf"^## {re.escape(h)}\s*$", text, re.M):
            errors.append(f"{path.name}: missing section '## {h}'")
    if meta.get("deck") != "none" and sid not in used:
        errors.append(f"{path.name}: no deck slide uses data-scene={sid} (orphan)")

if errors:
    print("\n".join(errors)); sys.exit(1)
print(f"scenes ok: {len(scenes)} scenes, {len(used)} live slides linked")
