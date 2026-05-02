# Liquorne — Prototype PWA V1

Cette version transforme le prototype HTML validé en PWA installable.

## Contenu
- `index.html` : webapp autonome
- `manifest.webmanifest` : déclaration PWA
- `sw.js` : cache applicatif minimal
- `icons/` : icônes générées à partir du logo Liquorne fourni

## Test rapide
1. Dézipper le dossier.
2. Servir le dossier avec un serveur local, par exemple :
   `python -m http.server 8080`
3. Ouvrir `http://localhost:8080` dans Chrome.
4. Sur Android : menu Chrome → “Ajouter à l'écran d'accueil” / “Installer l'application”.

Note : le service worker ne fonctionne pas correctement en `file://`. Il faut passer par `http://localhost` ou un hébergement HTTPS.
