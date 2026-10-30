import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

/**
 * ══ Authentification admin (personnelle) ══════════════════════════
 *
 * L'espace /admin possède sa PROPRE connexion : un compte Supabase
 * dédié à l'administration, distinct des comptes acheteur/producteur.
 *
 * ► AUCUN MOT DE PASSE N'EST ÉCRIT DANS LE CODE.
 * Le mot de passe que vous saisissez est envoyé à Supabase, qui le
 * vérifie sur SES serveurs. Le code livré au navigateur ne contient
 * que votre adresse email d'admin — qui n'est pas un secret.
 *
 * ► CE QUI GARANTIT LA SÉCURITÉ : les règles RLS de Supabase.
 * Elles s'exécutent côté serveur et ne peuvent pas être contournées
 * en modifiant le JavaScript. Un visiteur qui sauterait l'écran de
 * connexion n'obtiendrait aucun droit : Supabase refusera ses requêtes
 * car son compte n'a pas le rôle « admin » dans la table profiles.
 *
 * ► MISE EN PLACE (une seule fois) :
 *   1. Dans Supabase → Authentication → Users → « Add user » :
 *      - Email : admin@cunimarket.app (ou votre choix, plus bas)
 *      - Mot de passe : un mot de passe LONG et unique, que vous seul connaissez
 *      - Cochez « Auto confirm user »
 *   2. Donnez-lui le rôle admin (SQL) :
 *      update public.profiles set role = 'admin', verification_status = 'verified'
 *      where id = '<uuid du compte admin>';
 *   3. Appliquez les migrations des fichiers 20261030… et 20261031…,
 *      qui créent la fonction is_admin() et les politiques associées.
 */

/** Adresse email du compte Supabase utilisé pour l'administration. */
export const ADMIN_EMAIL = 'admin@cunimarket.app';

const SESSION_KEY = 'cunimarket:admin';

/**
 * Tente d'ouvrir une session admin en se connectant à Supabase avec le
 * compte dédié. Retourne null en cas de succès, sinon le message d'erreur.
 */
export async function signInAdmin(password: string): Promise<string | null> {
  if (!supabase) {
    return 'Supabase non configuré : renseignez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.';
  }
  if (!password) {
    return 'Saisissez votre mot de passe administrateur.';
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password,
  });

  if (error) {
    // Message volontairement vague : on ne dit pas si l'email existe.
    return 'Mot de passe administrateur incorrect.';
  }
  if (!data.session) {
    return 'Connexion refusée : vérifiez que le compte admin est confirmé dans Supabase.';
  }

  try {
    sessionStorage.setItem(SESSION_KEY, '1');
  } catch {
    // stockage indisponible : la session reste valable le temps de l'onglet
  }
  return null;
}

/** Ferme la session admin locale. */
export function endAdminSession(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignoré
  }
}

export type AdminSessionState = {
  /** true une fois l'écran de connexion passé pour cet onglet. */
  unlocked: boolean;
  /** La session Supabase associée est réellement ouverte. */
  session: Session | null;
  loading: boolean;
  /** Passe l'écran de connexion (après un signInAdmin réussi). */
  unlock: () => void;
  /** Referme le verrou de l'onglet et oublie la session locale. */
  relock: () => void;
};

/**
 * État de la session admin pour l'onglet courant.
 *
 * `unlocked` vient du sessionStorage : il n'est PAS une source de droits,
 * seulement un « j'ai déjà tapé le mot de passe dans cet onglet ». Les
 * droits réels viennent toujours de la session Supabase + RLS.
 */
export function useAdminSession(): AdminSessionState {
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [session, setSession] = useState<Session | null>(null);
  // `supabase` est une constante : dérivé au rendu, pas dans l'effet.
  const [loading, setLoading] = useState(() => supabase !== null);

  useEffect(() => {
    if (!supabase) return;

    let active = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session ?? null);
        setLoading(false);
      }
    });

    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) return;
      setSession(next ?? null);
      // Une déconnexion Supabase referme aussi le verrou de l'onglet.
      if (!next) {
        try {
          sessionStorage.removeItem(SESSION_KEY);
        } catch {
          // ignoré
        }
        setUnlocked(false);
      }
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const unlock = useCallback(() => setUnlocked(true), []);
  const relock = useCallback(() => {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // ignoré
    }
    setUnlocked(false);
  }, []);

  return { unlocked, session, loading, unlock, relock };
}
