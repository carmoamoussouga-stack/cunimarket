import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
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
import { useApp } from './store/context';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useApp();
  const location = useLocation();
  if (!user) return <Navigate to={`/connexion?next=${encodeURIComponent(location.pathname)}`} replace />;
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
          <Route
            path="/checkout"
            element={<RequireAuth><Checkout /></RequireAuth>}
          />
          <Route path="/confirmation/:ref" element={<Confirm />} />
          <Route path="/compte" element={<RequireAuth><Account /></RequireAuth>} />
          <Route
            path="/compte/stats"
            element={
              <RequireAuth>
                <Stats />
              </RequireAuth>
            }
          />
          <Route
            path="/compte/annonces"
            element={
              <RequireAuth>
                <MyListings />
              </RequireAuth>
            }
          />
          <Route
            path="/compte/publier"
            element={
              <RequireAuth>
                <Publish />
              </RequireAuth>
            }
          />
          <Route
            path="/compte/commandes"
            element={
              <RequireAuth>
                <Orders />
              </RequireAuth>
            }
          />
          <Route
            path="/compte/messages"
            element={
              <RequireAuth>
                <Messages />
              </RequireAuth>
            }
          />
          <Route
            path="/compte/finances"
            element={
              <RequireAuth>
                <Finances />
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
