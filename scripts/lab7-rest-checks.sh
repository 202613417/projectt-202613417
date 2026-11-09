#!/usr/bin/env bash
# ShopNow INT424 - actual REST evidence. No secrets or customer data required.
# Run from the existing repository, locally or in its Codespace.
set -euo pipefail
SUPABASE_BASE_URL='https://cwlzsjbzxsbpkokgnlhr.supabase.co'
SUPABASE_PUBLIC_KEY='sb_publishable_PEWlEp2pD8obpUe9S8NFpA_AhZU8qF7'
EVIDENCE_DIR="${1:-lab7-rest-results}"
mkdir -p "$EVIDENCE_DIR"
printf 'ShopNow Lab 7 | Muhammad Faisal | 202613417\n'
printf 'Captured UTC: %s\nHost: %s\n' "$(date -u +%FT%TZ)" "$(uname -s)"
printf 'Public publishable key is sent on apikey; no service-role key or user token.\n'
request() {
  local test_name="$1" method="$2" endpoint="$3" payload="${4:-}"
  local args=(--silent --show-error --connect-timeout 15 --max-time 45 --request "$method"
    "${SUPABASE_BASE_URL}/rest/v1/${endpoint}" -H "apikey: ${SUPABASE_PUBLIC_KEY}"
    -H 'Prefer: return=representation' -D "$EVIDENCE_DIR/$test_name.headers.txt"
    -o "$EVIDENCE_DIR/$test_name.json" -w '%{http_code}')
  printf '\n=== %s ===\n' "$test_name"
  printf 'curl -X %s "%s/rest/v1/%s" -H "apikey: $SUPABASE_PUBLIC_KEY" -H "Prefer: return=representation"' "$method" "$SUPABASE_BASE_URL" "$endpoint"
  if [[ -n "$payload" ]]; then
    args+=(-H 'Content-Type: application/json' --data "$payload")
    printf ' -H "Content-Type: application/json" --data '\''%s'\''' "$payload"
  fi
  printf '\n'
  local status
  status="$(curl "${args[@]}")"
  printf '%s\n' "$status" > "$EVIDENCE_DIR/$test_name.status.txt"
  printf 'HTTP %s\n' "$status"
  cat "$EVIDENCE_DIR/$test_name.json"
  printf '\n'
}
request 01-get-products GET 'product?select=*&order=product_id.asc'
request 02-filter-price-sort GET 'product?select=product_id,name,price,stock&price=lt.1000&order=name.asc'
request 03-filter-stock-sort GET 'product?select=product_id,name,price,stock&stock=eq.0&order=price.desc'
# Verify the guarded mutation target is absent before sending PATCH/DELETE.
GUARDED_TARGET='product?product_id=eq.-202613417&name=eq.LAB7_NEVER_REAL_202613417'
request 04-guard-target GET "$GUARDED_TARGET"
python3 - "$EVIDENCE_DIR/04-guard-target.json" <<'PY'
import json,sys
assert json.load(open(sys.argv[1])) == [], 'Safety guard: target is not absent; write probes stopped.'
PY
# Explicit negative ID avoids consuming an identity sequence. Negative price and
# a nonexistent category violate the verified CHECK/FK even if INSERT policy changes.
request 05-post-blocked POST 'product' '{"product_id":-202613417,"name":"LAB7_NEVER_REAL_202613417","price":-1,"stock":0,"category_id":-202613417}'
if [[ "$(cat "$EVIDENCE_DIR/05-post-blocked.status.txt")" == 2* ]]; then
  printf 'Unexpected POST success: stopping; no cleanup or further changes attempted.\n' >&2
  exit 1
fi
# These valid endpoints target no real rows; 2xx with [] does not prove a write.
request 06-patch-no-real-row PATCH "$GUARDED_TARGET" '{"stock":0}'
request 07-delete-no-real-row DELETE "$GUARDED_TARGET"
request 08-get-after GET 'product?select=*&order=product_id.asc'
python3 - "$EVIDENCE_DIR" <<'PY'
from pathlib import Path
import json,sys
p=Path(sys.argv[1]); before=json.loads((p/'01-get-products.json').read_text()); after=json.loads((p/'08-get-after.json').read_text())
assert isinstance(before,list) and before == after, 'Catalogue comparison failed; inspect evidence before continuing.'
summary={'catalogue_unchanged':True,'product_count_before':len(before),'product_count_after':len(after),'statuses':{x.stem.replace('.status',''):x.read_text().strip() for x in sorted(p.glob('*.status.txt'))}}
(p/'verification-summary.json').write_text(json.dumps(summary,indent=2))
print('\nVERIFIED: complete catalogue before/after is unchanged. Product count:',len(before))
print(json.dumps(summary,indent=2))
PY
