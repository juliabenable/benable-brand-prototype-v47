#!/bin/bash
# sync-invite.sh — copy Amine's Invite Creators prototype v2 (AmineBenjil/invite-creators-prototype-v2,
# main) into public/invite-creators/ untouched. src/invite/inviteOverlay.js opens its V1 layout over
# the tracker's "Review Creators" button. Re-run after Amine pushes, then commit public/invite-creators.
# (Until Oct 22 this synced the first prototype, AmineBenjil/invite-creators-prototype; see git history.)
set -e
cd "$(dirname "$0")/.."
REPO=AmineBenjil/invite-creators-prototype-v2
TMP=$(mktemp -d)
gh repo clone "$REPO" "$TMP/src" -- -q
rm -rf public/invite-creators
mkdir -p public/invite-creators
cp -R "$TMP/src/index.html" "$TMP/src/app.js" "$TMP/src/styles.css" "$TMP/src/mock-api.js" "$TMP/src/assets" public/invite-creators/
echo "$REPO $(git -C "$TMP/src" log -1 --format='%h %cI %s')" > public/invite-creators/VERSION
rm -rf "$TMP"
echo "synced: $(cat public/invite-creators/VERSION)"
