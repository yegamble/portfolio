#!/usr/bin/env bash
#
# Verifies that the live site is healthy. Run by the `deploy` job after a
# release and by the `rollback` job after a rollback, so a rollback proves the
# site actually recovered rather than assuming it did.
#
# Retries because a Cloudflare release is eventually consistent across colos:
# the first request after `wrangler deploy` can still be answered by the
# previous version.
#
# Environment:
#   SMOKE_BASE_URL       origin to check (default https://yosefgamble.com)
#   SMOKE_FAILURE_HINT   one line of markdown appended to the failure summary
#   GITHUB_STEP_SUMMARY  written to when GitHub provides it
#
# No `set -e`: every check reports which assertion failed before returning.
set -uo pipefail

BASE="${SMOKE_BASE_URL:-https://yosefgamble.com}"
ATTEMPTS=5
RETRY_DELAY=15
HEADERS_FILE="$(mktemp)"
trap 'rm -f "$HEADERS_FILE"' EXIT

summary() {
  if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
    printf '%s\n' "$@" >> "$GITHUB_STEP_SUMMARY"
  fi
  return 0
}

smoke() {
  local status redirect

  status="$(curl -sS -o /dev/null -D "$HEADERS_FILE" -w '%{http_code}' \
    --max-time 20 "$BASE/en")" || { echo '  /en did not answer'; return 1; }
  [ "$status" = '200' ] || { echo "  /en returned $status"; return 1; }
  grep -qi '^strict-transport-security:' "$HEADERS_FILE" \
    || { echo '  /en has no Strict-Transport-Security header'; return 1; }
  grep -qi '^content-security-policy:' "$HEADERS_FILE" \
    || { echo '  /en has no Content-Security-Policy header'; return 1; }

  curl -sS --max-time 20 "$BASE/he" | grep -q 'dir="rtl"' \
    || { echo '  /he did not render dir="rtl"'; return 1; }

  redirect="$(curl -sS -o /dev/null -w '%{http_code} %{redirect_url}' \
    --max-time 20 "$BASE/")" || { echo '  / did not answer'; return 1; }
  [ "$redirect" = "307 $BASE/en" ] \
    || { echo "  / returned '$redirect', expected '307 $BASE/en'"; return 1; }
}

echo "Smoke testing $BASE"
for attempt in $(seq 1 "$ATTEMPTS"); do
  echo "Attempt $attempt of $ATTEMPTS"
  if smoke; then
    echo "$BASE is healthy."
    summary '### Smoke test passed' '' "\`$BASE\` answered every check."
    exit 0
  fi
  if [ "$attempt" -lt "$ATTEMPTS" ]; then
    sleep "$RETRY_DELAY"
  fi
done

echo "::error::Smoke test of $BASE failed after $ATTEMPTS attempts."
summary '### Smoke test FAILED' '' "\`$BASE\` did not pass after $ATTEMPTS attempts." \
  '' "${SMOKE_FAILURE_HINT:-}"
exit 1
