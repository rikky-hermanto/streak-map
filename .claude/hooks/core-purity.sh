#!/usr/bin/env bash
# PostToolUse (Write|Edit): packages/core must stay dependency-free — no React,
# no Dexie, no runtime deps — so the CLI (v1.1) and iOS (v2) ports can import it
# verbatim. CI enforces this too; the hook catches it at the moment of the edit.
set -u
payload="$(cat)"
file="$(printf '%s' "$payload" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);process.stdout.write(j.tool_response?.filePath||j.tool_input?.file_path||"")}catch{}})')"
[ -n "$file" ] || exit 0
case "$file" in
  *packages/core/*) ;;
  *) exit 0 ;;
esac
[ -f "$file" ] || exit 0

msg=""
case "$file" in
  */package.json)
    deps="$(node -e 'const p=require(process.argv[1]);process.stdout.write(String(Object.keys(p.dependencies||{}).length))' "$file" 2>/dev/null || echo 0)"
    [ "$deps" != "0" ] && msg="packages/core/package.json declares runtime dependencies. core must stay dependency-free so the CLI and iOS ports can import it verbatim (spec §5.1)."
    ;;
  *)
    if grep -Eq "from ['\"](react|dexie|dexie-react-hooks|next)" "$file"; then
      msg="$file imports a UI or storage package. packages/core is pure domain logic — this belongs in packages/store or apps/web (spec §5.1)."
    fi
    ;;
esac

if [ -n "$msg" ]; then
  MSG="$msg" node -e 'process.stdout.write(JSON.stringify({decision:"block",reason:process.env.MSG}))'
fi
exit 0
