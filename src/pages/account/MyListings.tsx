import { useNavigate } from 'react-router-dom';
import TopBar from '../../components/TopBar';
import { LISTINGS } from '../../data/mock';
import { fcfa, useApp } from '../../store/context';

export default function MyListings() {
  const navigate = useNavigate();
  const { ownListings, deleteListing, showToast } = useApp();
  const demoListings = LISTINGS.filter((l) => l.sellerId === 's1');
  const all = [...ownListings, ...demoListings];

  return (
    <div className="page">
      <TopBar title="Mes annonces" back showCart={false} />
      <div className="section">
        <button className="btn block" style={{ marginBottom: '.9rem' }} onClick={() => navigate('/compte/publier')}>
          ➕ Nouvelle annonce
        </button>
        <div className="card">
          {all.map((l) => {
            const own = ownListings.some((o) => o.id === l.id);
            return (
              <div key={l.id} className="list-row">
                <div className="thumb-sm" style={{ background: l.bg }}>{l.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }} onClick={() => navigate(`/annonce/${l.id}`)}>
                  <div style={{ fontFamily: 'var(--fd)', fontWeight: 700, fontSize: '.85rem', color: 'var(--gd)' }}>{l.title}</div>
                  <div className="muted" style={{ fontSize: '.74rem' }}>{l.category} · {l.views} vues</div>
                  <div style={{ fontFamily: 'var(--fd)', fontWeight: 800, fontSize: '.82rem', color: 'var(--oc)' }}>
                    {fcfa(l.price)}{l.unit && `/${l.unit}`}
                  </div>
                </div>
                {own ? (
                  <button
                    className="btn danger"
                    onClick={() => {
                      deleteListing(l.id);
                      showToast('Annonce supprimée');
                    }}
                  >
                    🗑️
                  </button>
                ) : (
                  <span className="status" style={{ color: 'var(--su)' }}>● Actif</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
