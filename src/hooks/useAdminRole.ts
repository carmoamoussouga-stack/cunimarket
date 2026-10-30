import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from '../store/context';

export type AdminRoleState = 'loading' | 'admin' | 'denied';

// RequireAdmin ET Admin appellent ce hook : on mémoïse le résultat par
// utilisateur pour n'émettre qu'UNE seule requête et UN seul message d'erreur.
let lastChecked: { authId: string; state: AdminRoleState } | null = null;

/**
 * Vérifie dans la table `profiles` si l'utilisateur connecté possède le rôle `admin`.
 *
 * - `loading` : la vérification est en cours (on ne doit PAS rediriger pendant cet état,
 *   sinon l'admin serait renvoyé à l'accueil à chaque chargement de page).
 * - `admin`   : rôle admin confirmé.
 * - `denied`  : pas connecté, pas admin, ou erreur de requête.
 *
 * En cas de refus, un toast explique précisément la raison (sinon la redirection
 * vers l'accueil se fait silencieusement et semble être « un bug »).
 */
export function useAdminRole(): AdminRoleState {
  const { user, showToast } = useApp();
  const authId = user?.authId ?? null;
  const [state, setState] = useState<AdminRoleState>(() => {
    if (lastChecked?.authId === authId) return lastChecked.state;
    if (!authId || !supabase) return 'denied';
    return 'loading';
  });

  // Quand l'utilisateur change (connexion/déconnexion), on réinitialise
  // l'état AVANT la requête : sans cela, un admin suivant un acheteur
  // hériterait de « denied » et serait redirigé pendant la vérification.
  const [seenAuthId, setSeenAuthId] = useState<string | null>(authId);
  if (seenAuthId !== authId) {
    setSeenAuthId(authId);
    setState(
      lastChecked?.authId === authId
        ? lastChecked.state
        : !authId || !supabase
          ? 'denied'
          : 'loading',
    );
  }

  useEffect(() => {
    const db = supabase;
    if (!authId) {
      // Déconnecté : on oublie le rôle mémorisé pour revérifier à la prochaine session.
      lastChecked = null;
      return;
    }

    if (!db) {
      if (lastChecked?.authId !== authId) {
        lastChecked = { authId, state: 'denied' };
        showToast("Mode démonstration : le rôle admin n'est pas vérifiable sans Supabase.", 'error');
      }
      return;
    }

    if (lastChecked?.authId === authId) {
      // Déjà vérifié par une autre instance du hook : l'état initial
      // de ce composant a directement lu le cache, rien à faire.
      return;
    }

    let cancelled = false;

    void db
      .from('profiles')
      .select('role')
      .eq('id', authId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;

        if (error) {
          console.error('Admin role check failed:', error.message);
          lastChecked = { authId, state: 'denied' };
          showToast(`Vérification admin impossible : ${error.message}`, 'error');
          setState('denied');
          return;
        }

        if (!data) {
          lastChecked = { authId, state: 'denied' };
          showToast('Aucun profil trouvé pour ce compte : la table profiles est peut-être vide.', 'error');
          setState('denied');
          return;
        }

        if (data.role !== 'admin') {
          lastChecked = { authId, state: 'denied' };
          showToast(`Accès refusé : votre rôle est « ${data.role} ». Passez-le à « admin » dans Supabase.`, 'error');
          setState('denied');
          return;
        }

        lastChecked = { authId, state: 'admin' };
        setState('admin');
      });

    return () => {
      cancelled = true;
    };
  }, [authId, showToast]);

  return state;
}
