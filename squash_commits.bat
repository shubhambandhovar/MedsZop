@echo off
cd /d "s:\Project 2\MedsZop"
git --no-pager log --oneline -5
git reset --soft HEAD~1
git commit -m "feat: initial working full-stack setup (frontend + backend)"
git push -f origin main
