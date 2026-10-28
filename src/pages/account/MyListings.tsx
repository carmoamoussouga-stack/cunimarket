import { useNavigate } from 'react-router-dom';
import TopBar from '../../components/TopBar';
import { LISTINGS } from '../../data/mock';
import { fcfa, useApp } from '../../store/context';
import { supabase } from '../../lib/supabase';

export default function MyListings() {
  const navigate = useNavigate();
  const { ownListings, deleteListing, showToast } = useApp();
  const demoListings = supabase ? [] : LISTINGS.filter((l) => l.sellerId === 's1');
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
                <div
                  className="thumb-sm"
                  style={{ background: l.bg, overflow: 'hidden', padding: 0 }}
                >
                  {l.photos?.[0] ? <img src={l.photos[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : l.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }} onClick={() => navigate(`/annonce/${l.id}`)}>
                  <div style={{ fontFamily: 'var(--fd)', fontWeight: 700, fontSize: '.85rem', color: 'var(--gd)' }}>{l.title}</div>
                  <div className="muted" style={{ fontSize: '.74rem' }}>
                    {l.category} · {l.views} vues · {l.verified ? 'Vérifiée' : 'À vérifier'}
                  </div>
                  <div style={{ fontFamily: 'var(--fd)', fontWeight: 800, fontSize: '.82rem', color: 'var(--oc)' }}>
                    {fcfa(l.price)}{l.unit && `/${l.unit}`}
                  </div>
                </div>
                {own && l.active !== false ? (
                  <button
                    className="btn danger"
                    onClick={() => {
                      void deleteListing(l.id).then(() => showToast('Annonce archivée')).catch((error: unknown) => {
                        showToast(error instanceof Error ? error.message : 'Suppression impossible.', 'error');
                      });
                    }}
                  >
                    Archiver
                  </button>
                ) : own ? (
                  <span className="status">Archivée</span>
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
