# Liquorne — PWA V3

## Corrections
- Logo PNG réintégré dans `icons/` depuis le logo fourni.
- Icônes PWA `icon-192.png` et `icon-512.png` ajoutées.
- Pré-remplissage non simulé :
  - OCR local navigateur via Tesseract.js ;
  - recherche en ligne via OpenFoodFacts ;
  - fallback Wikipedia ;
  - parsing ABV / type / millésime depuis l’étiquette.

## Limitations normales d’une PWA statique
- Le pré-remplissage dépend d’Internet.
- Certaines bouteilles de spiritueux peuvent ne pas être trouvées dans les bases publiques.
- Pour une reconnaissance fiable niveau production, il faudra ensuite un backend avec une vraie API produit / moteur de recherche.
