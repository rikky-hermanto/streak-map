#!/usr/bin/env bash
# PostToolUse (Write|Edit): format the touched file with Biome.
# No-op until the repo actually has a biome.json — the repo is pre-implementation,
# and a hook that fails on every edit is worse than no hook.
set -u
payload="$(cat)"
repo_root="$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0
[ -f "$repo_root/biome.json" ] || exit 0

file="$(printf '%s' "$payload" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);process.stdout.write(j.tool_response?.filePath||j.tool_input?.file_path||"")}catch{}})')"
[ -n "$file" ] || exit 0
case "$file" in
  *.ts|*.tsx|*.js|*.jsx|*.json|*.jsonc|*.css) ;;
  *) exit 0 ;;
esac

(cd "$repo_root" && pnpm exec biome check --write "$file") >/dev/null 2>&1
exit 0
