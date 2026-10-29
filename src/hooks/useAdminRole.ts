import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from '../store/context';

export type AdminRoleState = 'loading' | 'admin' | 'denied';

/**
 * Vérifie dans la table `profiles` si l'utilisateur connecté possède le rôle `admin`.
 *
 * - `loading` : la vérification est en cours (on ne doit PAS rediriger pendant cet état,
 *   sinon l'admin serait renvoyé à l'accueil à chaque chargement de page).
 * - `admin`   : rôle admin confirmé.
 * - `denied`  : pas connecté, pas admin, ou erreur de requête.
 */
export function useAdminRole(): AdminRoleState {
  const { user, showToast } = useApp();
  const authId = user?.authId ?? null;
  const [state, setState] = useState<AdminRoleState>(() => (!authId || !supabase ? 'denied' : 'loading'));

  // Réinitialise le statut quand l'utilisateur change (connexion/déconnexion).
  // Pattern « setState pendant le rendu » recommandé par React pour réagir
  // à un changement de props/state sans effet supplémentaire.
  const [seenAuthId, setSeenAuthId] = useState<string | null>(authId);
  if (seenAuthId !== authId) {
    setSeenAuthId(authId);
    setState(!authId || !supabase ? 'denied' : 'loading');
  }

  useEffect(() => {
    const db = supabase;
    if (!db || !authId) return;

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
          showToast("Impossible de vérifier vos droits d'accès.", 'error');
          setState('denied');
          return;
        }
        setState(data?.role === 'admin' ? 'admin' : 'denied');
      });

    return () => {
      cancelled = true;
    };
  }, [authId, showToast]);

  return state;
}
