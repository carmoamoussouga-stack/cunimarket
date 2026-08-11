import { useNavigate, useParams } from 'react-router-dom';
import TopBar from '../components/TopBar';
import ListingCard from '../components/ListingCard';
import { useApp } from '../store/context';

export default function Seller() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { listings, user } = useApp();

  const sellerListings = listings.filter((l) => l.sellerId === id);
  const head = sellerListings[0];

  if (!head) {
    return (
      <div className="page">
        <TopBar title="Vendeur" back />
        <div className="empty">
          <div className="ico">🏪</div>
          <p className="muted">Vendeur introuvable.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <TopBar title={head.seller} back />
      <div style={{ height: 110, background: 'linear-gradient(135deg,var(--gd),var(--gm),var(--oc))' }} />
      <div className="section" style={{ paddingTop: 0 }}>
        <div style={{ marginTop: -38, marginBottom: '.7rem' }}>
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: 20,
              background: 'var(--gd)',
              border: '4px solid var(--cr)',
              display: 'grid',
              placeItems: 'center',
              fontSize: '2rem',
              boxShadow: 'var(--s2)',
            }}
          >
            {head.emoji}
          </div>
        </div>
        <div style={{ fontFamily: 'var(--fd)', fontSize: '1.15rem', fontWeight: 800, color: 'var(--gd)', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          {head.seller}
          {head.verified && <span className="chip">✓ Vérifié</span>}
        </div>
        <div className="muted" style={{ fontSize: '.85rem', marginTop: '.2rem' }}>
          Cuniculture & Aviculture · {head.city}, {head.dept}
        </div>
        <div style={{ display: 'flex', gap: '1.75rem', marginTop: '.85rem' }}>
          {[
            [head.sales, 'Ventes'],
            [head.rating, 'Note'],
            [sellerListings.length, 'Annonces'],
          ].map(([n, l]) => (
            <div key={String(l)}>
              <div style={{ fontFamily: 'var(--fd)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--gd)' }}>{n}</div>
              <div className="muted" style={{ fontSize: '.7rem' }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '.6rem', marginTop: '1rem' }}>
          <button className="btn ghost block" onClick={() => navigate(user ? '/compte/messages' : '/connexion')}>
            💬 Message
          </button>
          <button className="btn block" onClick={() => navigate(`/catalogue?seller=${head.sellerId}`)}>
            Ses annonces
          </button>
        </div>
      </div>

      <div className="section" style={{ paddingTop: 0 }}>
        <div className="section-title">Annonces de {head.seller}</div>
        <div className="listing-grid">
          {sellerListings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      </div>
    </div>
  );
}
