import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAdminRole } from '../hooks/useAdminRole';

type Props = {
  /** Fourni via `<RequireAdmin><Admin /></RequireAdmin>`, sinon `<Outlet />` est utilisé. */
  children?: ReactNode;
};

/**
 * Garde de route : n'affiche ses enfants que si le profil connecté a le rôle `admin`.
 * À placer sur une route parente :
 *
 *   <Route element={<RequireAdmin />}>
 *     <Route path="/admin" element={<Admin />} />
 *   </Route>
 */
export default function RequireAdmin({ children }: Props) {
  const role = useAdminRole();

  if (role === 'loading') {
    return <div className="section muted">Vérification des droits…</div>;
  }

  if (role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children ?? <Outlet />}</>;
}
