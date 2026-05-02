# Liquorne — PWA V3.4 Smart Analyzer

## Analyse de la photo Buffalo Trace
La photo montre une étiquette courbée, avec reflets, texte décoratif et code-barres visible.
Le bon paramétrage n'est pas un OCR unique mais un pipeline hybride.

## Améliorations V3.4
- prétraitement image côté navigateur ;
- recadrages multiples :
  - photo complète ;
  - étiquette centrale ;
  - bande marque ;
  - bloc informations ;
  - zone code-barres ;
- OCR multi-passes Tesseract.js sur les zones utiles ;
- détection code-barres via BarcodeDetector si disponible ;
- recherche OpenFoodFacts par code-barres puis texte ;
- fallback Wikipedia ;
- heuristiques locales pour Buffalo Trace, Macallan, Depaz ;
- seuil OCR plus tolérant mais filtrage du bruit ;
- progression ergonomique dans le bouton / la zone d’analyse.

## Résultat attendu sur la photo fournie
- Nom : Buffalo Trace Kentucky Straight Bourbon Whiskey
- Marque : Buffalo Trace
- Type : Whisky / Bourbon
- Pays : États-Unis
- ABV : 45%
- Arômes suggérés : Vanille, Caramel, Chêne, Épices douces
