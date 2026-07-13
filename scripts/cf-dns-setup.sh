#!/usr/bin/env bash
# One-shot Cloudflare DNS setup for markdown.style -> GitHub Pages.
# Usage: CLOUDFLARE_API_TOKEN=<token with Zone.Read + Zone.DNS.Edit> bash scripts/cf-dns-setup.sh
# Idempotent: safe to re-run; skips records that already exist.
set -euo pipefail

DOMAIN="markdown.style"
GH_PAGES_HOST="gggauravgandhi.github.io"
API="https://api.cloudflare.com/client/v4"

[ -n "${CLOUDFLARE_API_TOKEN:-}" ] || { echo "ERROR: set CLOUDFLARE_API_TOKEN (dash.cloudflare.com -> My Profile -> API Tokens -> 'Edit zone DNS' template, scoped to ${DOMAIN})"; exit 1; }

cf() { curl -sS -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" -H "Content-Type: application/json" "$@"; }

ZONE_JSON=$(cf "${API}/zones?name=${DOMAIN}")
ZONE_ID=$(printf '%s' "$ZONE_JSON" | python3 -c "import json,sys; r=json.load(sys.stdin)['result']; print(r[0]['id'] if r else '')")
if [ -z "$ZONE_ID" ]; then
  echo "ERROR: zone ${DOMAIN} not found in this Cloudflare account."
  echo "Add the site first: dash.cloudflare.com -> Add a domain -> ${DOMAIN} (free plan), then re-run."
  exit 1
fi
echo "zone: ${DOMAIN} (${ZONE_ID})"

echo "-- Cloudflare-assigned nameservers (set these at Namecheap -> Domain -> Nameservers -> Custom DNS):"
printf '%s' "$ZONE_JSON" | python3 -c "import json,sys; [print('   ' + ns) for ns in json.load(sys.stdin)['result'][0]['name_servers']]"

EXISTING=$(cf "${API}/zones/${ZONE_ID}/dns_records?per_page=100")

ensure_record() { # type name content
  local type="$1" name="$2" content="$3"
  local found
  found=$(printf '%s' "$EXISTING" | python3 -c "
import json,sys
recs=json.load(sys.stdin)['result']
print(any(r['type']=='$type' and r['name']=='$name' and r['content']=='$content' for r in recs))")
  if [ "$found" = "True" ]; then
    echo "exists: $type $name -> $content"
  else
    cf -X POST "${API}/zones/${ZONE_ID}/dns_records" \
      --data "{\"type\":\"$type\",\"name\":\"$name\",\"content\":\"$content\",\"proxied\":false,\"ttl\":1,\"comment\":\"GitHub Pages\"}" \
      | python3 -c "import json,sys; d=json.load(sys.stdin); print(('created: ' if d['success'] else 'FAILED: ') + '$type $name -> $content', '' if d['success'] else d['errors'])"
  fi
}

# GitHub Pages apex IPs (docs.github.com/pages -> custom domain -> apex)
for ip in 185.199.108.153 185.199.109.153 185.199.110.153 185.199.111.153; do
  ensure_record A "$DOMAIN" "$ip"
done
ensure_record CNAME "www.${DOMAIN}" "$GH_PAGES_HOST"

echo ""
echo "Done. Records are DNS-only (grey cloud) on purpose: GitHub must issue the HTTPS cert first."
echo "Next: switch the nameservers at Namecheap to the two printed above, then wait for propagation."
