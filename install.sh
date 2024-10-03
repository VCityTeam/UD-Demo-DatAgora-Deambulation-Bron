#!/bin/sh

echo 'Installing npm dependencies:'
npm install --legacy-peer-deps || exit 1
echo 'Recovering external assets:'
./getAssets.sh || exit 2
