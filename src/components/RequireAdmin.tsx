import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AdminLogin from './AdminLogin';
import { useAdminSession } from '../lib/adminAuth';

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
  const { unlocked, loading, unlock } = useAdminSession();

  if (loading) {
    return <div className="section muted">Vérification de la session…</div>;
  }

  if (!unlocked) {
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
