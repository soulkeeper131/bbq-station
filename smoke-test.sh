#!/usr/bin/env bash
# Smoke test за BBQ Station — пуска се след деплой
# Usage: ./smoke-test.sh [BASE_URL]
#   BASE_URL по подразбиране: http://localhost:3000

set -euo pipefail
BASE="${1:-http://localhost:3000}"
PASS=0; FAIL=0

check(){ local label="$1" url="$2" expected="$3"
  local code; code=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
  if [ "$code" = "$expected" ]; then
    echo "  ✅ $label ($code)"; PASS=$((PASS+1))
  else
    echo "  ❌ $label: expected $expected, got $code"; FAIL=$((FAIL+1))
  fi
}
check_body(){ local label="$1" url="$2" pattern="$3"
  local body; body=$(curl -s "$url" 2>/dev/null || echo "")
  if echo "$body" | grep -q "$pattern"; then
    echo "  ✅ $label"; PASS=$((PASS+1))
  else
    echo "  ❌ $label: body missing '$pattern'"; FAIL=$((FAIL+1))
  fi
}

echo "🔍 BBQ Station Smoke Test — $BASE"
echo ""

echo "📡 Public endpoints:"
check     "Главна страница"     "$BASE/"                      200
check     "Health check"        "$BASE/healthz"               200
check_body "Health JSON"        "$BASE/healthz"               '"ok":true'
check     "Metrics"             "$BASE/api/metrics"           200
check_body "Metrics status"     "$BASE/api/metrics"           '"status":"healthy"'
check     "robots.txt"          "$BASE/robots.txt"            200
check     "sitemap.xml"         "$BASE/sitemap.xml"           200
check     "API config"          "$BASE/api/config"            200
check     "Menu overrides"      "$BASE/api/menu-overrides"    200
check     "Product images"      "$BASE/api/product-images"    200

echo ""
echo "🔒 Admin-protected (without key → 401):"
check     "Admin dashboard"     "$BASE/admin"                 401
check     "Orders list"         "$BASE/api/orders"            401
check     "Admin backup"        "$BASE/api/admin/backups"     401

echo ""
echo "🛡️ Rate limiting (6 rapid POSTs → 429):"
count=0
for i in 1 2 3 4 5 6; do
  code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/orders" -H "Content-Type: application/json" -d '{"docID":"smoke"}' 2>/dev/null)
  [ "$code" = "429" ] && count=$((count+1))
done
if [ "$count" -ge 1 ]; then echo "  ✅ Rate limit triggered (429×$count)"; PASS=$((PASS+1))
else echo "  ❌ Rate limit NOT triggered"; FAIL=$((FAIL+1)); fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Резултат: $PASS ✅  |  $FAIL ❌"
[ "$FAIL" -eq 0 ] && echo "  🎉 Всички тестове минаха!" || echo "  ⚠️  Има FAIL-ове!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
exit $FAIL
