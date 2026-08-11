import TopBar from '../../components/TopBar';
import { REVENUE_MONTHS, SELLER_ORDERS } from '../../data/mock';
import { fcfa } from '../../store/context';

const STATUS_LABEL: Record<string, string> = {
  pending: '⏳ En attente',
  confirmed: '✓ Confirmé',
  shipping: '🚚 En route',
  delivered: '✅ Livré',
};

export default function Stats() {
  const max = Math.max(...REVENUE_MONTHS.map(([, v]) => v));

  return (
    <div className="page">
      <TopBar title="Tableau de bord" back showCart={false} />
      <div className="section">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6rem' }}>
          {[
            ['💰', '487 500', 'Revenus ce mois (FCFA)', '↑ +23%'],
            ['📦', '128', 'Ventes totales', '↑ +8 ce mois'],
            ['👀', '3 241', 'Vues annonces', '↑ +15%'],
            ['⭐', '4.9', 'Note moyenne', '89 avis'],
          ].map(([ic, n, l, d]) => (
            <div key={l} className="stat-card">
              <div style={{ fontSize: '1.2rem' }}>{ic}</div>
              <div className="stat-value">{n}</div>
              <div className="stat-label">{l}</div>
              <div style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--su)', marginTop: '.25rem' }}>{d}</div>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: '1rem', marginTop: '.9rem' }}>
          <div className="section-title" style={{ fontSize: '.9rem' }}>📈 Revenus mensuels</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '.4rem', height: 150 }}>
            {REVENUE_MONTHS.map(([m, v]) => (
              <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.25rem' }}>
                <div style={{ fontSize: '.62rem', fontFamily: 'var(--fd)', fontWeight: 700, color: 'var(--gd)' }}>{Math.round(v / 1000)}k</div>
                <div style={{ width: '100%', height: Math.round((v / max) * 110), background: 'var(--gd)', opacity: 0.85, borderRadius: '4px 4px 0 0' }} />
                <div style={{ fontSize: '.62rem', color: 'var(--sll)' }}>{m}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ marginTop: '.9rem' }}>
          <div className="list-row" style={{ fontFamily: 'var(--fd)', fontWeight: 800, color: 'var(--gd)', fontSize: '.9rem' }}>
            Commandes récentes
          </div>
          {SELLER_ORDERS.map((o) => (
            <div key={o.ref} className="list-row">
              <div className="thumb-sm" style={{ background: o.items[0].bg }}>{o.items[0].emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--fd)', fontWeight: 700, fontSize: '.83rem', color: 'var(--gd)' }}>{o.ref}</div>
                <div className="muted" style={{ fontSize: '.75rem' }}>{o.buyer.name} · {o.items[0].title}</div>
                <div style={{ fontFamily: 'var(--fd)', fontWeight: 800, fontSize: '.8rem', color: 'var(--oc)' }}>{fcfa(o.total)}</div>
              </div>
              <span className="status">{STATUS_LABEL[o.status]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
