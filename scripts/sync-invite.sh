#!/bin/bash
# sync-invite.sh — copy Amine's Invite Creators prototype (AmineBenjil/invite-creators-prototype,
# main) into public/invite-creators/ untouched. src/invite/inviteOverlay.js opens it over the
# tracker's "Review Creators" button. Re-run after Amine pushes, then commit public/invite-creators.
set -e
cd "$(dirname "$0")/.."
TMP=$(mktemp -d)
gh repo clone AmineBenjil/invite-creators-prototype "$TMP/src" -- -q
rm -rf public/invite-creators
mkdir -p public/invite-creators
cp -R "$TMP/src/index.html" "$TMP/src/app.js" "$TMP/src/styles.css" "$TMP/src/mock-api.js" "$TMP/src/assets" public/invite-creators/
git -C "$TMP/src" log -1 --format='%h %cI %s' > public/invite-creators/VERSION
rm -rf "$TMP"
echo "synced: $(cat public/invite-creators/VERSION)"
