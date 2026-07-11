#!/bin/bash
# Push latest main to GitHub (use Token as password if prompted)
set -e
cd "$(dirname "$0")/.."
git add -A
git status --short
git commit -m "Fix Railway deploy: use Nixpacks instead of Docker" || echo "(no new commit)"
git push -u origin main
echo "Done. Check Railway redeploy."
