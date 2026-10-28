# CuniMarket — application mobile web (PWA)

Marketplace locale **uniquement pour les producteurs de lapins** qui n’arrivent pas à écouler
leur cheptel, et pour les acheteurs de leur zone.

## À qui ça s’adresse

- **Producteurs / fournisseurs** : éleveurs de lapins. Compte ferme, ville ou localisation facultative,
  publication d’annonces avec **photos réelles** et caractéristiques (race, âge, poids, sexe,
  vaccination). Ils peuvent aussi vendre d’autres produits de la ferme (viande, fumier, cages,
  aliments).
- **Acheteurs** : consultent les annonces sans compte, puis choisissent une ville ou activent la
  localisation pour estimer les distances.

## Stack

- Vite + React 19 + TypeScript
- React Router (navigation par onglets en bas d'écran)
- `vite-plugin-pwa` (manifest, service worker, mode hors-ligne, installation sur l'écran d'accueil)
- Supabase Auth, catalogue, annonces et commandes partagés si configurés
- Mode démonstration sans backend, persisté dans `localStorage`

## Démarrer

```bash
npm install
npm run dev
# Sans Supabase configuré, l'application fonctionne en mode démonstration local.
# Pour activer Supabase, configurer .env.local et exécuter la migration SQL (voir ci-dessous).
npm run build
npm run preview
npm run lint
```

### Activer Supabase Auth

1. Créer un projet Supabase.
2. Dans les réglages Auth, autoriser l’URL locale de développement `http://localhost:5173`.
3. Copier `.env.example` en `.env.local`, puis renseigner l’URL du projet et sa clé publique anon/publishable.
4. Exécuter `supabase/migrations/20261020000000_pilot.sql` dans le SQL Editor Supabase.
5. Redémarrer Vite après toute modification de `.env.local`.

Ne jamais utiliser la clé secrète `service_role` dans l’application web.

## Fonctionnalités

- **Accueil** : positionnement producteur de lapins, accès carte de zone
- **Près de moi** : activation GPS (ou ville de repli), carte, liste triée par distance,
  caractéristiques d’élevage
- **Catalogue** : lots, filtres, tri par proximité si la localisation est active
- **Fiche annonce** : galerie photos, caractéristiques, distance, profil producteur
- **Publication** : photos (appareil), race / âge / poids / sexe / vaccin, localisation de la ferme
- **Comptes** : géolocalisation facultative, choix de ville, Supabase Auth si configuré
- Panier et commandes sauvegardés localement en démo, ou synchronisés avec Supabase configuré
- **Paiement au pilote** : paiement à la livraison ; l’application enregistre la commande sans encaisser

La consultation du catalogue, des annonces et des producteurs est libre. La localisation sert à
calculer les distances ; la connexion est demandée pour accéder au compte et finaliser une commande.

Les données de démonstration sont dans `src/data/mock.ts`. Sans configuration Supabase, les comptes,
annonces et commandes de test restent sur l'appareil. Avec Supabase configuré et la migration appliquée,
les comptes, annonces, stock et commandes sont partagés entre utilisateurs. Les nouvelles annonces sont
en attente de vérification ; leur validation initiale se fait dans le tableau de bord Supabase.

N'ajoutez jamais de clé `service_role` dans le navigateur. `VITE_SUPABASE_ANON_KEY` est une clé publique ;
la sécurité des données doit être assurée par les politiques RLS de la migration.
