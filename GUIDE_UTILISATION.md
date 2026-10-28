# 🐇 CuniMarket - Guide d'Utilisation Complet

## Vue d'ensemble

**CuniMarket** est une plateforme de mise en relation entre **producteurs de lapins** et **acheteurs** basée sur la géolocalisation. Les éleveurs peinent à écouler leurs lapins → les acheteurs les trouvent facilement près de chez eux.

---

## 📱 Flux Utilisateur

### **👤 Producteur (Éleveur)** 
Compte dédié à la vente de lapins, équipements ou aliments pour lapins.

**Parcours :**
1. **Inscription** → `/inscription?role=seller`
   - Renseigner: Email, mot de passe, nom, téléphone, département, ville
   - Nom de la ferme, ville et département requis ; années, capacité et spécialités facultatives
   - La localisation est facultative : choisir une ville ou activer le GPS
   - → Redirection vers `/compte` (Tableau de bord)

2. **Publier une annonce** → `/compte/publier`
   - Ajouter photos (jusqu'à 4, compression auto 900px @ 72% JPG)
   - Titre, catégorie, prix, quantité, unité (tête, kg, lot…)
   - **Caractéristiques** : Race, âge (jours), poids (g), sexe, vaccin
   - Description, localisation (dept/ville auto-remplies)
   - → En mode Supabase, l'annonce est publiée avec statut « à vérifier »

3. **Gérer ses annonces** → `/compte/annonces`
   - Archiver ou consulter ses annonces

4. **Statistiques** → `/compte/stats`
   - Commandes et paiements déclarés sur cet appareil ou dans Supabase

5. **Messages** → `/compte/messages`
   - Discuter avec les acheteurs intéressés

6. **Commandes reçues** → `/compte/commandes` (onglet "Mes ventes")
   - Statut : En attente → Confirmé → En route → Livré

7. **Finances** → `/compte/finances`
   - Aucune somme n'est versée dans l'application ; le paiement se fait à la livraison

---

### **🛒 Acheteur** 
Compte pour trouver et acheter des lapins proches de sa localisation.

**Parcours :**
1. **Inscription** → `/inscription?role=buyer`
   - Renseigner: Email, mot de passe, nom, téléphone, département, ville
   - La localisation est facultative : choisir une ville ou activer le GPS
   - → Redirection vers `/alentours` (Producteurs proches)

2. **Voir les producteurs proches** → `/alentours`
   - **Carte schématique** : Visualise la position et les producteurs publiés
   - Filtrer par rayon de recherche (5-80 km)
   - Voir les spécialités, années d'expérience, capacité de chaque ferme
   - Cliquer sur une ferme → `/vendeur/:id` (Profil + annonces du producteur)

3. **Consulter le catalogue** → `/catalogue`
   - Rechercher par titre, race (ex: "NZB", "Californien")
   - Filtrer par catégorie (Lapereaux, Viande, Reproducteurs…)
   - Filtrer par département, prix max
   - Trier par proximité, prix
   - Clicker sur une annonce → `/annonce/:id` (Détail complet)

4. **Consulter une annonce** → `/annonce/:id`
   - Photos du producteur (swipe photos ou cliquer sur point)
   - Titre, prix, quantité, caractéristiques (race, âge, poids, vaccin)
   - Distance à la ferme
   - Ajouter au panier (sélectionner quantité)
   - Ajouter aux favoris ❤️

5. **Gérer le panier** → `/panier`
   - Voir tous les articles ajoutés
   - Modifier quantité ou supprimer
   - Passer à la caisse → `/checkout`

6. **Checkout** → `/checkout`
   - Résumé de la commande (articles, prix, frais livraison)
   - Choisir mode livraison (Retrait, Moto, Transport)
   - Confirmer la commande dans l'application ; le paiement n'est pas demandé à ce stade
   - Régler le montant au producteur ou au livreur à la livraison
   - → Page de confirmation `/confirmation/:ref`

7. **Suivi des commandes** → `/compte/commandes` (onglet "Mes achats")
   - Voir l'historique et le statut de chaque commande, puis régler à la livraison
   - Contacter le vendeur

8. **Favoris** → `/favoris`
   - Liste des annonces sauvegardées

---

## 🗺️ Architecture de Pages

### Pages Publiques (sans authentification)
- `/` — Accueil (tendance, catégories, CTA)
- `/alentours` — Producteurs proches (la ville ou le GPS permet de calculer les distances)
- `/catalogue` — Toutes les annonces + filtres
- `/annonce/:id` — Détail d'une annonce
- `/vendeur/:id` — Profil producteur + ses annonces
- `/favoris` — Annonces favorites (stockées sur cet appareil)
- `/panier` — Panier d'achat
- `/connexion` — Login
- `/inscription` — Register
- `/confirmation/:ref` — Récapitulatif de commande, paiement dû à la livraison

### Pages Protégées (authentification)
- `/checkout` — Confirmation de commande (réservé aux utilisateurs connectés, paiement à la livraison)
- `/compte` — Tableau de bord (seller + buyer)
  - `/compte/stats` — Stats seller
  - `/compte/annonces` — Mes annonces seller
  - `/compte/publier` — Publier annonce seller
  - `/compte/commandes` — Commandes (buyer: achats, seller: ventes)
  - `/compte/messages` — Messages
  - `/compte/finances` — Finances seller
  - `/compte/favoris` — Voir favoris

La consultation des annonces et les fonctions de proximité restent accessibles sans compte.
La localisation sert au calcul des distances ; la connexion est demandée pour commander ou accéder au compte.

---

## 📐 Données & Localisation

### Localisation
- Utilise **Geolocalisation HTML5** (navigator.geolocation)
- Distance calculée avec **Haversine** (formule grande distance)
- Affichage: km avec 1 décimale si < 10 km, sinon arrondi
- Fallback: Laisser choisir une ville dans une liste

### Départements Bénin (mock)
- Littoral (Cotonou)
- Atlantique (Abomey-Calavi, Calavi…)
- Ouémé (Porto-Novo, Adjohoun…)
- etc.

### Catégories Produits
- 🐇 Lapereaux
- 🐰 Reproducteurs
- 🍖 Viande
- 🏗️ Équipements
- 🌾 Aliments
- 🌱 Autres produits

### Producteurs Mock (PRODUCERS)
5 producteurs pré-définis avec photos Unsplash, spécialités, localisation réelle Bénin.

### Annonces Mock (LISTINGS)
~10 annonces pré-remplies pour tester, associées aux producteurs.

---

## 🧪 Checklist de Test

### ✅ Authentification & Géolocalisation

- [ ] **Inscription Producteur**
  - [ ] Accéder à `/inscription?role=seller`
  - [ ] Renseigner nom, ferme, ville, département, email et mot de passe
  - [ ] Vérifier que le compte peut être créé sans GPS
  - [ ] Créer compte → redirection `/compte`

- [ ] **Inscription Acheteur**
  - [ ] Accéder à `/inscription?role=buyer`
  - [ ] Renseigner nom, email et mot de passe
  - [ ] Vérifier que le compte peut être créé sans GPS
  - [ ] Créer compte → redirection `/alentours`

- [ ] **Localisation facultative**
  - [ ] Refuser le GPS et choisir une ville
  - [ ] Vérifier que l'inscription et la consultation restent possibles

- [ ] **Login**
  - [ ] Se connecter avec same credentials
  - [ ] Redirection vers page précédente (ou `/alentours` par défaut)

### ✅ Producteur - Publier Annonce

- [ ] **Accès page Publier**
  - [ ] En tant que producteur, aller `/compte/publier`
  - [ ] Affiche formulaire complet avec photos

- [ ] **Upload & Compression Photos**
  - [ ] Ajouter 1 photo → doit être compressée
  - [ ] Ajouter 4ème photo → max atteint, bouton désactivé
  - [ ] Supprimer photo → chiffre libéré
  - [ ] Vérifier que les photos s'affichent après rechargement

- [ ] **Remplir Annonce**
  - [ ] Titre, Catégorie, Prix, Qty obligatoires
  - [ ] Caractéristiques race, âge, poids, sexe (opt)
  - [ ] Cocher "Vacciné" → affiche badge sur fiche
  - [ ] Description libre

- [ ] **Valider & Publier**
  - [ ] Cliquer Publier → Toast "Annonce publiée!"
  - [ ] Redirection `/compte/annonces`
  - [ ] Annonce visible dans ses annonces et marquée « À vérifier » avec Supabase

- [ ] **Voir ses Annonces**
  - [ ] `/compte/annonces` affiche toutes les siennes
  - [ ] Supprimer annonce → disparaît de la liste

### ✅ Acheteur - Chercher Producteurs

- [ ] **Page Nearby**
  - [ ] Première visite `/alentours` → LocationPrompt s'affiche
  - [ ] Cliquer Activer → mise à jour coords
  - [ ] Carte s'affiche avec position user (🔵 "Vous")
  - [ ] Producteurs mocks s'affichent comme des pins
  - [ ] Glisser curseur rayon → producteurs se filtrent

- [ ] **Sélectionner Producteur**
  - [ ] Cliquer sur pin ou card producteur
  - [ ] → `/vendeur/:id` avec profil complet
  - [ ] Affiche toutes ses annonces
  - [ ] Affiche ses spécialités, rating, années, capacité

- [ ] **Fallback Ville**
  - [ ] Si on refuse géoloc longtemps, dropdown villes
  - [ ] Choisir ville → coords mis à jour

### ✅ Acheteur - Catalogue & Annonce

- [ ] **Recherche & Filtres**
  - [ ] Champ recherche → filtre titre/race
  - [ ] Filtrer par catégorie
  - [ ] Filtrer par département
  - [ ] Filtrer par prix max
  - [ ] Trier: Plus proches, Prix croissant/décroissant
  - [ ] Bouton "Réinitialiser filtres"

- [ ] **Voir Détail Annonce**
  - [ ] Clicker annonce → `/annonce/:id`
  - [ ] Photos avec navigation (swipe ou points)
  - [ ] Affiche tous les champs: race, âge, poids, vaccin
  - [ ] Badge "Producteur vérifié" si seller.verified
  - [ ] Badge distance au seller
  - [ ] Bouton ❤️ Favori (alterne 🤍 ❤️)
  - [ ] Compteur qualité +/−
  - [ ] Bouton "Ajouter au panier"

- [ ] **Panier**
  - [ ] Ajouter 3+ articles différents
  - [ ] Voir badge nombre d'articles sur icône panier (BottomNav)
  - [ ] `/panier` affiche tous les articles
  - [ ] Modifier quantité par article
  - [ ] Supprimer article
  - [ ] Calcul total s'actualise

### ✅ Checkout & Commande

- [ ] **Checkout — paiement à la livraison**
  - [ ] Cliquer "Passer à la caisse" → `/checkout`
  - [ ] Résumé articles + prix
  - [ ] Choisir mode livraison (Retrait/Moto/Transport)
  - [ ] Vérifier le montant indiqué comme dû à la livraison
  - [ ] Confirmer → commande enregistrée sans encaissement

- [ ] **Confirmation**
  - [ ] Affiche numéro de commande
  - [ ] Affiche le numéro de commande et le paiement à la livraison
  - [ ] Affiche le statut "En attente"

- [ ] **Suivi Commandes**
  - [ ] `/compte/commandes` affiche l'historique
  - [ ] Si buyer: onglet "Mes achats" avec ses commandes
  - [ ] Si seller: onglet "Mes ventes" avec leurs ventes
  - [ ] Statut visible: ⏳ Pending, ✓ Confirmed, 🚚 Shipping, ✅ Delivered

### ✅ Accès et Supabase

- [ ] Consulter `/alentours`, `/catalogue` et `/annonce/1` sans compte ni GPS
- [ ] Sans variables Supabase, vérifier le mode démonstration local
- [ ] Avec variables Supabase, vérifier la création d'un vrai compte
- [ ] Appliquer la migration et vérifier les règles RLS avant le pilote

- [ ] **RequireAuth**
  - [ ] Se déconecter
  - [ ] Essayer d'accéder `/compte` → redirection `/connexion`
  - [ ] Essayer d'accéder `/checkout` → redirection `/connexion`

### ✅ UI/UX

- [ ] **Responsive**
  - [ ] Tester sur mobile (Chrome DevTools)
  - [ ] Lire sur tablette
  - [ ] Vérifier que la navigation fonctionne

- [ ] **BottomNav**
  - [ ] 5 onglets visibles
  - [ ] Badge panier correct
  - [ ] Active state sur route actuelle

- [ ] **Toast**
  - [ ] Ajout au panier → "Ajouté au panier"
  - [ ] Erreur → toast rouge ❌
  - [ ] Succès → toast vert ✅
  - [ ] Disparaît auto après 2.6s

- [ ] **Photos**
  - [ ] Annonces affichent photos
  - [ ] Photos produit manquantes → fallback emoji
  - [ ] Producteurs affichent emoji

---

## 🔧 Stack Technique

- **Frontend**: React 19 + TypeScript
- **Routing**: React Router v7
- **State**: useState + Context API
- **Storage démo**: localStorage (v2 schema)
- **Authentification**: Supabase Auth si configuré ; sinon mode démonstration local
- **Geo**: Navigator Geolocation API + Haversine
- **Build**: Vite
- **Linting**: Oxlint

---

## 📦 Structure Données

### User
```ts
{
  name: string;
  email: string;
  phone?: string;
  dept?: string;
  city?: string;
  role: 'buyer' | 'seller';
  farmName?: string;  // seller
  years?: number;     // seller
  specialties?: string[];  // seller
  capacity?: string;  // seller
  lat?: number;
  lng?: number;
}
```

### Listing
```ts
{
  id: string;
  title: string;
  category: string;
  price: number;
  unit: string;
  qty: number;
  breed?: string;
  age?: number;
  weight?: number;
  vaccinated?: boolean;
  sex?: string;
  photos: string[];  // base64
  dept: string;
  city: string;
  lat?: number;
  lng?: number;
  seller: string;    // farm name
  sellerId: string;  // user.id or 'me'
  verified: boolean;
  rating: number;
  sales: number;
  emoji: string;
  bg: string;        // hex color
  date: string;      // "Il y a 2h"
  views: number;
  desc: string;
}
```

---

## 🐛 Problèmes Connus / À Améliorer

- Les photos de démonstration sont conservées telles quelles, comme demandé.
- Sans configuration Supabase, les données et commandes restent sur l'appareil et ne sont pas partagées.
- Avec Supabase configuré et la migration appliquée, les annonces, commandes, stocks et statuts sont synchronisés.
- Les annonces sont créées non vérifiées ; un administrateur doit les examiner dans Supabase avant de les valider.
- Paiement à la livraison : aucun paiement n'est encaissé par l'application.
- Messages mock (pas de vrai système de chat)

## 🚀 Déploiement

```bash
npm run build        # Build optimisé
npm run preview      # Preview build
```

Fichiers générés dans `dist/` prêts pour serveur.

---

## 📝 Notes Développement

- **Données test** : `src/data/mock.ts`
- **Utilitaires géo** : `src/lib/geo.ts`
- **Compression photos** : `src/lib/photos.ts`
- **Contexte app** : `src/store/app.tsx` + `src/store/context.ts`

---

**Créé le**: 28 Août 2026  
**Version**: 1.0  
**Status**: ✅ Feature Complete - Prêt pour tests utilisateurs
