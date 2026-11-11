import { useEffect } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import RequireAdmin from './components/RequireAdmin';
import AdminHub from './pages/admin/AdminHub';
import AdminListings from './pages/admin/AdminListings';
import AdminAccounts from './pages/admin/AdminAccounts';
import AdminReports from './pages/admin/AdminReports';
import AdminStats from './pages/admin/AdminStats';
import Nearby from './pages/Nearby';
import Catalogue from './pages/Catalogue';
import ListingDetail from './pages/ListingDetail';
import Seller from './pages/Seller';
import Favorites from './pages/Favorites';
import Cart from './pages/Cart';
import Auth from './pages/Auth';
import Checkout from './pages/Checkout';
import Confirm from './pages/Confirm';
import Account from './pages/account/Account';
import Stats from './pages/account/Stats';
import MyListings from './pages/account/MyListings';
import Publish from './pages/account/Publish';
import Orders from './pages/account/Orders';
import Messages from './pages/account/Messages';
import Finances from './pages/account/Finances';
import { supabase } from './lib/supabase';
import { useApp } from './store/context';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useApp();
  const location = useLocation();
  if (!user) return <Navigate to={`/connexion?next=${encodeURIComponent(location.pathname)}`} replace />;
  return <>{children}</>;
}

function RequireApprovedProducer({ children }: { children: React.ReactNode }) {
  const { user } = useApp();
  if (supabase && user?.role === 'seller' && user.verificationStatus !== 'verified') {
    return (
      <div className="page">
        <div className="section">
          <div className="card" style={{ padding: '1rem' }}>
            Votre compte producteur doit être approuvé par un administrateur avant d’accéder à cet espace.
            <Link className="btn block" style={{ marginTop: '.8rem' }} to="/compte">Retour à mon compte</Link>
          </div>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
}

export default function App() {
  const { toast } = useApp();

  return (
    <div className="app-shell">
      <ScrollToTop />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/alentours" element={<Nearby />} />
          <Route path="/catalogue" element={<Catalogue />} />
          <Route path="/annonce/:id" element={<ListingDetail />} />
          <Route path="/vendeur/:id" element={<Seller />} />
          <Route path="/favoris" element={<Favorites />} />
          <Route path="/panier" element={<Cart />} />
          <Route path="/connexion" element={<Auth mode="login" />} />
          <Route path="/inscription" element={<Auth mode="register" />} />
          <Route path="/admin" element={<RequireAdmin><AdminHub /></RequireAdmin>} />
          <Route path="/admin/annonces" element={<RequireAdmin><AdminListings /></RequireAdmin>} />
          <Route path="/admin/comptes" element={<RequireAdmin><AdminAccounts /></RequireAdmin>} />
          <Route path="/admin/signalements" element={<RequireAdmin><AdminReports /></RequireAdmin>} />
          <Route path="/admin/statistiques" element={<RequireAdmin><AdminStats /></RequireAdmin>} />
          <Route
            path="/checkout"
            element={<RequireAuth><RequireApprovedProducer><Checkout /></RequireApprovedProducer></RequireAuth>}
          />
          <Route path="/confirmation/:ref" element={<Confirm />} />
          <Route path="/compte" element={<RequireAuth><Account /></RequireAuth>} />
          <Route
            path="/compte/stats"
            element={
              <RequireAuth>
                <RequireApprovedProducer><Stats /></RequireApprovedProducer>
              </RequireAuth>
            }
          />
          <Route
            path="/compte/annonces"
            element={
              <RequireAuth>
                <RequireApprovedProducer><MyListings /></RequireApprovedProducer>
              </RequireAuth>
            }
          />
          <Route
            path="/compte/publier"
            element={
              <RequireAuth>
                <RequireApprovedProducer><Publish /></RequireApprovedProducer>
              </RequireAuth>
            }
          />
          <Route
            path="/compte/commandes"
            element={
              <RequireAuth>
                <RequireApprovedProducer><Orders /></RequireApprovedProducer>
              </RequireAuth>
            }
          />
          <Route
            path="/compte/messages"
            element={
              <RequireAuth>
                <RequireApprovedProducer><Messages /></RequireApprovedProducer>
              </RequireAuth>
            }
          />
          <Route
            path="/compte/finances"
            element={
              <RequireAuth>
                <RequireApprovedProducer><Finances /></RequireApprovedProducer>
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BottomNav />
      {toast && <div className={`toast${toast.type === 'error' ? ' error' : ''}`}>{toast.type === 'error' ? '❌' : '✅'} {toast.msg}</div>}
    </div>
  );
}
