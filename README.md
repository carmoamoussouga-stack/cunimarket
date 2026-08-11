# CuniMarket — application mobile web (PWA)

Marketplace du cuniculteur ouest-africain : lapereaux, reproducteurs, cailles, œufs, équipements
et aliments, achetés et vendus directement entre éleveurs.

Cette application est la version mobile web (installable sur téléphone) du prototype CuniMarket.

## Stack

- Vite + React 19 + TypeScript
- React Router (navigation par onglets en bas d'écran)
- `vite-plugin-pwa` (manifest, service worker, mode hors-ligne, installation sur l'écran d'accueil)
- État global via React Context, persisté dans `localStorage` (panier, favoris, session, commandes,
  annonces publiées)

## Démarrer

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # build de production + service worker
npm run preview    # sert le build (nécessaire pour tester la PWA)
npm run lint
```

## Fonctionnalités

- **Accueil** : recherche, tendances, catégories, annonces récentes, CTA vendeur
- **Catalogue** : recherche plein texte, filtres (catégorie, département, prix max) dans une
  bottom sheet, tri, filtres reflétés dans l'URL
- **Fiche annonce** : galerie, caractéristiques (race, âge, vaccination, stock), sélecteur de
  quantité, ajout au panier en barre fixe, favoris, annonces similaires, profil vendeur
- **Panier** : quantités, suppression, code promo (`CUNIMARKET10` = −10 %), récapitulatif
- **Checkout** : coordonnées, mode de livraison (retrait / moto / inter-villes), moyen de paiement
  (MTN MoMo, Moov, carte, Wave), modale de paiement FedaPay **simulée**, puis confirmation
- **Compte** : connexion / inscription (acheteur ou vendeur), commandes, messagerie, favoris
- **Espace vendeur** : tableau de bord (revenus, ventes, vues, note), mes annonces, publication
  d'annonce avec prévisualisation en direct, finances (commission 5 %, historique FedaPay)

## Données et paiement

Les annonces de démonstration, commandes vendeur, conversations et paiements vivent dans
`src/data/mock.ts`. Aucun backend n'est appelé : le paiement FedaPay est une simulation visuelle et
aucune transaction réelle n'est effectuée. Les actions de l'utilisateur (panier, favoris, compte,
commandes, annonces publiées) sont conservées dans `localStorage`.

Pour brancher une API réelle, remplacer les lectures de `src/data/mock.ts` et les mutations du store
(`src/store/app.tsx`) par des appels réseau : les composants ne consomment que le contexte.

## Installation sur téléphone

Ouvrir le site en HTTPS, puis « Ajouter à l'écran d'accueil » (Android/Chrome : menu ⋮, iOS/Safari :
Partager). L'application s'ouvre alors en plein écran, sans barre d'adresse, et fonctionne hors
connexion pour les pages déjà visitées.
