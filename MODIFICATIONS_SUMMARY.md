# CuniMarket — état du pilote

## Parcours acheteur

- Le catalogue, les fiches annonce, les producteurs, les favoris et le panier sont consultables sans compte.
- Le GPS est facultatif ; une ville peut servir à estimer les distances.
- Le checkout demande les coordonnées de livraison, puis enregistre la commande.
- Le paiement se fait à la livraison. L'application n'encaisse pas l'argent.

## Parcours producteur

- Inscription et connexion locales en mode démonstration, ou via Supabase Auth si configuré.
- Publication et archivage des annonces.
- Suivi des commandes avec les étapes en attente, confirmée, en livraison et livrée.
- À la dernière étape, le producteur confirme explicitement la livraison et l'encaissement.
- Les indicateurs financiers affichent les commandes réelles disponibles pour la session, pas des chiffres de démonstration.

## Données et sécurité

- Sans variables Supabase, les données sont enregistrées dans le navigateur et ne sont pas partagées.
- Avec Supabase, les profils, annonces, stocks et commandes utilisent PostgreSQL et des politiques RLS.
- `supabase/migrations/20261020000000_pilot.sql` crée les tables et les procédures protégées pour confirmer une commande, réserver le stock, annuler et déclarer l'encaissement à la livraison.
- Les nouvelles annonces sont en attente de vérification et ne sont visibles aux acheteurs qu'après validation dans Supabase.
- N'utilisez jamais la clé `service_role` dans le navigateur.

## Démarrer un environnement Supabase

1. Créer un projet Supabase.
2. Copier `.env.example` en `.env.local` et renseigner `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`.
3. Appliquer la migration dans le SQL Editor Supabase.
4. Configurer l'URL de redirection locale dans Supabase Auth et redémarrer Vite.
5. Créer un compte producteur de test et publier une annonce.
6. Vérifier manuellement l'annonce, puis tester le parcours de commande entre deux comptes.

## Limites du pilote

- Aucun projet Supabase ni secret de connexion n'est inclus dans le dépôt ; les tests réels entre appareils restent à faire dans votre projet.
- Les messages, avis et signalements sont encore à finaliser dans l'interface.
- Les photos existantes n'ont pas été modifiées. L'hébergement de photos doit être préparé avant une ouverture à grande échelle.
- Le paiement en ligne n'est pas prévu pour ce pilote.

## Vérification effectuée

- `npm run build`
- `npm run lint`
