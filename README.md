# CV — Sébastien Galvagno

🔗 **Site en ligne : [cv.galvagno.info](http://cv.galvagno.info)**

Site web personnel présentant mon CV : parcours professionnel, formations, compétences et projets. Développé en JavaScript vanilla avec des **Web Components** natifs (`customElements`), sans framework front-end — HTML, CSS et JS purs, packagés avec [Vite](https://vitejs.dev/) pour la production.

Le site propose une interface bilingue (français / anglais), un tiroir latéral (drawer) pour la navigation, un affichage flexible des expériences professionnelles (mode onglets ou liste à plat), et un filtrage par tags technologiques pour les formations complémentaires.

## Fonctionnalités

- **Composants autonomes** : chaque section du CV (`about-section`, `work-experience`, `education-academic`, `education-other`, `personal-info`, `cv-menu`) est un Web Component indépendant qui charge ses propres données.
- **Internationalisation** : bascule français/anglais pilotée par un fichier `lang.json`, avec détection automatique de la langue du navigateur.
- **Navigation responsive** : tiroir latéral rétractable (sidebar) au-delà de 900px, comportement adapté sur mobile.
- **Filtrage dynamique** : les formations complémentaires peuvent être filtrées par tag ou regroupées par date.
- **Aucune dépendance runtime** : le site fonctionne sans framework JS ni bibliothèque tierce en production.

## Structure du projet

```
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── main.js          # composants principaux (About, WorkExperience, Education...)
│   └── drawer.js         # logique du tiroir latéral et du menu de navigation
├── data/
│   ├── cv.fr.json
│   ├── cv.en.json
│   └── lang.json         # dictionnaire de traductions
├── images/
│   └── avatar.jpg
├── test/
│   ├── main.test.js
│   └── drawer.test.js
├── jest.config.js
├── vite.config.js
├── babel.config.js
├── build.sh               # script de packaging pour la production
├── install.sh             # script de déploiement vers le serveur (Ionos)
└── docker/
    ├── test/               # image Docker générique pour lancer les tests Jest
    └── build/              # image Docker générique pour builder avec Vite
```

## Lancer les tests

Les tests unitaires (Jest + jsdom) tournent dans un conteneur Docker dédié, sans installation locale de Node.js nécessaire.

```bash
cd docker/test
docker compose build --no-cache --pull   # uniquement après modification du Dockerfile
docker compose run --rm test
```

Le code du projet est monté en volume dans le conteneur ; toute modification des fichiers `.test.js` ou du code source est prise en compte immédiatement, sans reconstruction de l'image.

## Builder le site pour la production

Le build (minification JS/CSS/HTML, résolution des assets) est également conteneurisé via une image Vite générique (`js-build-runner`).

### Construire le conteneur de build

Cette étape n'est nécessaire qu'une seule fois, ou après modification du `Dockerfile` du dossier `docker/build/` (ajout d'un plugin Vite, changement de version de Node, etc.) :

```bash
cd docker/build
docker compose build --no-cache --pull
cd ../..
```

### Lancer le build

```bash
./build.sh
```

Ce script vérifie que Docker est démarré (et le lance si besoin), copie et minifie les fichiers JSON de `data/` ainsi que les images vers `public/`, puis lance le build Vite dans le conteneur déjà construit. Le résultat final est généré dans le dossier `dist/` à la racine du projet, prêt à être déployé.

> Le script `build.sh` ne reconstruit pas l'image Docker automatiquement — il suppose qu'elle existe déjà (`js-build-runner:latest`). Reconstruis-la manuellement à chaque changement du `Dockerfile`.

## Installer sur le serveur

Une fois le build terminé, `dist/` contient un site statique autonome (HTML, CSS, JS minifiés et hashés, données JSON, images) sans aucune dépendance serveur particulière. Le déploiement se fait par `scp` vers l'hébergement Ionos, via le script `install.sh` :

```bash
./install.sh
```

```bash
#!/bin/sh
cd dist
scp -r index.html data assets images ionos:cv/
cd ..
```

Ce script s'appuie sur un alias SSH nommé `ionos` (à définir dans `~/.ssh/config`, par exemple) pointant vers le serveur d'hébergement, et copie les fichiers essentiels du build (`index.html`, `data/`, `assets/`, `images/`) dans le dossier `cv/` du serveur distant.

Après déploiement, vérifie que le site s'affiche correctement à l'URL de destination, que les traductions se chargent (`data/lang.json`) et que la photo de profil s'affiche (`images/avatar.jpg`). Si le site est servi depuis un sous-dossier plutôt qu'à la racine du domaine, ajoute l'option `base` correspondante dans `vite.config.js` avant de relancer le build.

## Workflow complet

```bash
# 1. Construire les images Docker (uniquement au premier lancement, ou après modif d'un Dockerfile)
cd docker/test && docker compose build --no-cache --pull && cd ../..
cd docker/build && docker compose build --no-cache --pull && cd ../..

# 2. Vérifier que les tests passent
cd docker/test && docker compose run --rm test && cd ../..

# 3. Builder le site
./build.sh

# 4. Déployer sur le serveur
./install.sh
```
