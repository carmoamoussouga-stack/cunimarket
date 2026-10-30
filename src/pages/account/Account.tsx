import { useNavigate } from 'react-router-dom';
import TopBar from '../../components/TopBar';
import { ADMIN_EMAIL } from '../../lib/adminAuth';
import { useApp } from '../../store/context';

const SELLER_LINKS = [
  ['/compte/stats', '📊', 'Tableau de bord', 'Revenus, ventes, vues'],
  ['/compte/annonces', '📋', 'Mes annonces', 'Gérer et supprimer'],
  ['/compte/publier', '➕', 'Publier une annonce', 'Photos et caractéristiques'],
  ['/compte/finances', '💰', 'Finances', 'Paiements à la livraison'],
] as const;

const ADMIN_LINKS = [
  ['/admin', '🛡️', 'Modération', 'Annonces et comptes en attente'],
] as const;

const COMMON_LINKS = [
  ['/alentours', '📍', 'Producteurs proches', 'Carte de votre zone'],
  ['/compte/commandes', '📦', 'Mes commandes', 'Suivi et historique'],
  ['/compte/messages', '💬', 'Messages', 'Discuter avec les éleveurs'],
  ['/favoris', '❤️', 'Mes favoris', 'Annonces sauvegardées'],
] as const;

export default function Account() {
  const navigate = useNavigate();
  const { user, signOut, orders, favorites, ownListings } = useApp();

  if (!user) {
    return (
      <div className="page">
        <TopBar title="Mon compte" />
        <div className="empty">
          <div className="ico">👤</div>
          <div style={{ fontFamily: 'var(--fd)', fontWeight: 800, color: 'var(--gd)' }}>Pas encore connecté</div>
          <p className="muted" style={{ fontSize: '.87rem', margin: '.4rem 0 1.2rem' }}>
            Compte producteur pour vendre vos lapins, ou compte acheteur pour trouver les élevages de votre zone.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
            <button className="btn block" onClick={() => navigate('/connexion')}>Se connecter</button>
            <button className="btn ocre block" onClick={() => navigate('/inscription?role=seller')}>Compte producteur</button>
            <button className="btn ghost block" onClick={() => navigate('/inscription?role=buyer')}>Compte acheteur</button>
          </div>
        </div>
      </div>
    );
  }

  // Le lien « Modération » n'apparaît que pour le compte admin dédié.
  const base = user.role === 'seller' ? [...SELLER_LINKS, ...COMMON_LINKS] : COMMON_LINKS;
  const links = user.email === ADMIN_EMAIL ? [...ADMIN_LINKS, ...base] : base;

  return (
    <div className="page">
      <TopBar title="Mon compte" />
      <div className="section">
        <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '.9rem' }}>
          <div className="thumb-sm" style={{ background: 'var(--gd)', color: '#fff', width: 56, height: 56 }}>🐇</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--fd)', fontWeight: 800, color: 'var(--gd)' }}>{user.name}</div>
            <div className="muted" style={{ fontSize: '.78rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
            <span className="chip" style={{ marginTop: '.3rem', display: 'inline-block' }}>
              {user.role === 'seller' ? '🐇 Producteur' : '🛒 Acheteur'}
              {user.lat != null ? ' · 📍 Localisé' : ''}
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '.6rem', margin: '.9rem 0' }}>
          {[
            [orders.length, 'Commandes'],
            [favorites.length, 'Favoris'],
            [ownListings.length, 'Annonces'],
          ].map(([n, l]) => (
            <div key={String(l)} className="stat-card" style={{ textAlign: 'center' }}>
              <div className="stat-value">{n}</div>
              <div className="stat-label">{l}</div>
            </div>
          ))}
        </div>

        <div className="card">
          {links.map(([to, icon, title, desc]) => (
            <button
              key={to}
              className="list-row"
              style={{ width: '100%', background: 'none', border: 'none', borderBottom: '1px solid var(--bd)', textAlign: 'left' }}
              onClick={() => navigate(to)}
            >
              <span style={{ fontSize: '1.25rem', width: 28 }}>{icon}</span>
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontFamily: 'var(--fd)', fontWeight: 700, fontSize: '.88rem', color: 'var(--gd)' }}>{title}</span>
                <span className="muted" style={{ fontSize: '.75rem' }}>{desc}</span>
              </span>
              <span className="muted">›</span>
            </button>
          ))}
        </div>

        <button
          className="btn ghost block"
          style={{ marginTop: '1rem' }}
          onClick={() => {
            signOut();
            navigate('/');
          }}
        >
          Déconnexion
        </button>
      </div>
    </div>
  );
}
