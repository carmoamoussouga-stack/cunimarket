import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AdminLogin from './AdminLogin';
import { ADMIN_EMAIL, useAdminSession } from '../lib/adminAuth';
import { supabase } from '../lib/supabase';

type Props = {
  /** Fourni via `<RequireAdmin><AdminHub /></RequireAdmin>`, sinon `<Outlet />` est utilisé. */
  children?: ReactNode;
};

/**
 * Garde de l'espace administration.
 *
 * Tant que l'onglet n'a pas passé l'écran de connexion, on affiche celui-ci
 * (pas de redirection : on reste sur /admin pour éviter un renvoi silencieux
 * vers l'accueil, qui ressemble à un bug).
 *
 * Une fois déverrouillé, les droits RÉELS de Supabase restent faisant foi :
 * modifier le JavaScript pour sauter cet écran ne donne aucun droit, car
 * les requêtes sont refusées côté serveur par le compte non-admin.
 */
export default function RequireAdmin({ children }: Props) {
  const { unlocked, loading, session, unlock } = useAdminSession();
  const [authorization, setAuthorization] = useState<{ userId: string; allowed: boolean } | null>(null);

  useEffect(() => {
    if (!unlocked || !session || !supabase || session.user.email !== ADMIN_EMAIL) return;

    let active = true;
    const userId = session.user.id;
    void (async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
        if (!active) return;
        if (error) {
          console.error('Admin access verification failed:', error.message);
          setAuthorization({ userId, allowed: false });
          return;
        }
        setAuthorization({ userId, allowed: data?.role === 'admin' });
      } catch (error) {
        if (!active) return;
        console.error('Admin access verification failed:', error);
        setAuthorization({ userId, allowed: false });
      }
    })();

    return () => {
      active = false;
    };
  }, [unlocked, session]);

  if (loading) {
    return <div className="section muted">Vérification de la session…</div>;
  }

  const hasAdminSession = unlocked && session?.user.email === ADMIN_EMAIL && supabase !== null;
  const authorizationMatches = Boolean(session && authorization?.userId === session.user.id);

  if (hasAdminSession && !authorizationMatches) {
    return <div className="section muted">Vérification des droits administrateur…</div>;
  }

  if (!hasAdminSession || !authorization?.allowed) {
    return <AdminLogin onSuccess={unlock} />;
  }

  return <>{children ?? <Outlet />}</>;
}

/**
 * Raccourci pour rediriger vers l'espace admin depuis un autre écran.
 */
export function AdminRedirect() {
  return <Navigate to="/admin" replace />;
}
