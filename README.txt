Liquorne — prototype web V3.7.2 (PWA)

URL:
- https://terrentroydaniel.github.io/Liquorne/

Démo / comptes:
- demo / liquorne

⚠️ Prototype : les comptes, notes et photos sont stockés localement (localStorage). Pas sécurisé.

Fonctionnalités (prototype):
- Explorer : liste + recherche/filtre/tri (démo)
- Ma cave : collection personnelle (démo)
- Ajouter : formulaire + import photo depuis la galerie + recadrage/édition
- Menu (hamburger) : Déconnexion

Installer en « appli » (PWA):
- Android (Chrome): ⋮ > Ajouter à l’écran d’accueil
- iPhone (Safari): Partager > Sur l’écran d’accueil

Déploiement GitHub Pages:
- Mettre à la racine: index.html, app.js, styles.css, manifest.webmanifest, sw.js, dossier assets/
- Settings > Pages > Deploy from a branch > main > /(root)

Si écran blanc (cache PWA):
1) Ouvrir https://terrentroydaniel.github.io/Liquorne/?nocache=1
2) Effacer les données du site terrentroydaniel.github.io dans Chrome
3) Si PWA installée: supprimer le raccourci puis réinstaller.

V3.7.2:
- Fallback “Chargement…” + écran d’erreur lisible sans console
- Cache/service worker bump + compatibilité GitHub Pages (/Liquorne/)
