#!/usr/bin/env sh

set -e

cd docs

npm run docs:build

cd src/.vuepress/dist

echo "https://keydb.zyrouge.gq" > CNAME

git init
git add -A
git commit -m 'Build'
git push -f git@github.com:zyrouge/key.db.git master:gh-pages