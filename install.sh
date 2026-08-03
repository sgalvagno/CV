#!/usr/bin/env bash
cd dist
scp -r index.html data assets images ionos:cv/
cd ..