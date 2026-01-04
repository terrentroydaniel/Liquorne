# Liquorne — prototype web (V3.8.0)

Prototype **PWA** (installable) de *Liquorne* : ton « Vivino des spiritueux ».

- ✅ Fonctionne sur **mobile** (Android/iOS via navigateur) + **desktop**
- ✅ Déployable tel quel sur **GitHub Pages** (pas de build, pas de serveur)
- ✅ **Offline** via Service Worker (cache PWA) + icônes (raccourci)

---

## Démo / comptes

- Identifiant : `demo`
- Mot de passe : `liquorne`

> ⚠️ Prototype : les comptes, notes et photos sont stockés **localement** (localStorage). Pas sécurisé.

---

## Fonctionnalités (prototype)

- **Explorer** : liste + recherche/filtre/tri (démo)
- **Ma cave** : collection personnelle (démo)
- **Ajouter** : formulaire + import photo depuis la galerie + recadrage/édition
- **Menu** (hamburger) : accès Déconnexion

---

## Installation en « appli » (PWA)

### Android (Chrome)
1. Ouvrir `https://terrentroydaniel.github.io/Liquorne/`
2. Menu **⋮** → **Ajouter à l’écran d’accueil**

### iPhone (Safari)
1. Ouvrir l’URL
2. **Partager** → **Sur l’écran d’accueil**

---

## Déploiement sur GitHub Pages (sans outils)

1. Mettre ces fichiers **à la racine** du repo :
   - `index.html`, `app.js`, `styles.css`, `manifest.webmanifest`, `sw.js`, dossier `assets/`
2. GitHub → **Settings** → **Pages**
3. Source : **Deploy from a branch** → Branch : `main` → Folder : `/ (root)`

> Ce repo est un **project site** : le chemin inclut `/Liquorne/`.

---

## Si tu vois un écran blanc

Les PWA peuvent garder un **ancien cache** (Service Worker).

Essaye dans l’ordre :

1. Ouvrir : `https://terrentroydaniel.github.io/Liquorne/?nocache=1`
2. Chrome → Paramètres → **Données de site** → supprimer `terrentroydaniel.github.io`
3. Si l’appli est installée : supprimer le raccourci, recharger le site, puis réinstaller.

---

## Notes de version

### V3.8.0
- Ajout d’un **fallback** “Chargement…” pour éviter une page vide
- Gestion d’erreur au démarrage (écran lisible sans console)
- Ajustements PWA (cache bump + compatibilité GitHub Pages `/Liquorne/`)



## Nouveautés V3.8.0
- ✅ Modification d’un spiritueux ajouté (nom, marque, type, pays, ABV, notes, photo)
- ✅ Suppression d’un spiritueux (nettoyage cave + avis associés)
- ✅ Bouton + centré et or (style premium)
