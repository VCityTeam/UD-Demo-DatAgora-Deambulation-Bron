#!/bin/sh

DATASET_URL='https://dataset-dl.liris.cnrs.fr/vcity-sample-data/bron-2018-campus'
MODELS='avatar_capuchon.glb campus.glb map.glb'
IMG='sky.jpg'

cd assets
if [ ! -d models ]; then
    mkdir models && cd models
    for f in $MODELS
    do
        wget "$DATASET_URL"/$f 
        [ $? -ne 0 ] && echo "Error during download of assets/models/$f" && exit 1
    done
    cd -
else
    echo "Directory assets/models already exists."
fi

if [ ! -d img ]; then
    echo "Downloading assets/img:"
    mkdir img && cd img
    for f in $IMG
    do
        wget "$DATASET_URL"/$f
        [ $? -ne 0 ] && echo "Error during download of assets/img/$f." && exit 2
    done
    cd -
else
    echo "Directory assets/img already exists."
fi
