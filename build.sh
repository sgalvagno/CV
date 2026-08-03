#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"
echo "==> Racine du projet : $PROJECT_ROOT"

echo "==> Vérification de Docker..."
if ! docker info >/dev/null 2>&1; then
  echo "    Docker n'est pas démarré."

  if [[ "$(uname)" == "Darwin" ]]; then
    echo "    Lancement de Docker Desktop (macOS)..."
    open -a Docker
  elif command -v systemctl >/dev/null 2>&1; then
    echo "    Lancement du service docker (systemd)..."
    sudo systemctl start docker
  else
    echo "    Impossible de démarrer Docker automatiquement sur cet OS."
    echo "    Démarre Docker manuellement puis relance ce script."
    exit 1
  fi

  echo -n "    Attente du démarrage de Docker"
  until docker info >/dev/null 2>&1; do
    echo -n "."
    sleep 1
  done
  echo " OK"
else
  echo "    Docker est déjà démarré."
fi

echo "==> Préparation de public/data/ (JSON minifiés)..."
rm -rf public/data
mkdir -p public/data

if [ -d data ]; then
  shopt -s nullglob
  for f in data/*.json; do
    name="$(basename "$f")"
    python3 -c "
import json
with open('$f', encoding='utf-8') as fh:
    d = json.load(fh)
with open('public/data/$name', 'w', encoding='utf-8') as fh:
    json.dump(d, fh, separators=(',', ':'), ensure_ascii=False)
"
    echo "    minifié : $name"
  done
  shopt -u nullglob
else
  echo "    (dossier data/ absent, ignoré)"
fi

echo "==> Préparation de public/images/..."
rm -rf public/images
mkdir -p public/images

if [ -d images ]; then
  if command -v magick >/dev/null 2>&1; then
    CONVERT_CMD="magick"
  elif command -v convert >/dev/null 2>&1; then
    CONVERT_CMD="convert"
  else
    CONVERT_CMD=""
  fi

  shopt -s nullglob
  for img in images/*; do
    name="$(basename "$img")"
    if [ -n "$CONVERT_CMD" ]; then
      "$CONVERT_CMD" "$img" -strip -quality 85 "public/images/$name" \
        && echo "    compressé : $name" \
        || cp "$img" "public/images/$name"
    else
      cp "$img" "public/images/$name"
      echo "    copié (sans compression, ImageMagick absent) : $name"
    fi
  done
  shopt -u nullglob
else
  echo "    (dossier images/ absent, ignoré)"
fi

echo "==> Build de l'image Docker (si nécessaire)..."
docker compose -f docker/build/docker-compose.yml build --pull

echo "==> Lancement du build Vite..."
docker compose -f docker/build/docker-compose.yml run --rm build

echo "==> Build terminé. Contenu de dist/ :"
ls -la dist/

echo ""
echo "✅ dist/ est prêt à être copié sur le serveur."

