#!/bin/sh

echo 'Installing npm dependencies:'
npm install || exit 1
echo 'Recovering external assets:'
./getAssets.sh || exit 2
