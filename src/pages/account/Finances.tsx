import TopBar from '../../components/TopBar';
import { PAYMENTS } from '../../data/mock';
import { fcfa } from '../../store/context';

export default function Finances() {
  const gross = PAYMENTS.reduce((s, p) => s + p.gross, 0);
  const commission = PAYMENTS.reduce((s, p) => s + p.commission, 0);

  return (
    <div className="page">
      <TopBar title="Finances" back showCart={false} />
      <div className="section">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
          {[
            ['💰', fcfa(487500), 'Revenus ce mois', 'var(--gd)', '#fff'],
            ['📤', fcfa(commission), 'Commission CuniMarket (5%)', 'var(--wh)', 'var(--gd)'],
            ['✅', fcfa(gross - commission), 'Net à percevoir', 'var(--wh)', 'var(--su)'],
          ].map(([ic, n, l, bg, color]) => (
            <div key={l} className="card" style={{ padding: '1rem', background: bg, color }}>
              <div style={{ fontSize: '1.2rem' }}>{ic}</div>
              <div style={{ fontFamily: 'var(--fd)', fontSize: '1.15rem', fontWeight: 800 }}>{n}</div>
              <div style={{ fontSize: '.76rem', opacity: 0.75 }}>{l}</div>
            </div>
          ))}
        </div>

        <div className="card" style={{ marginTop: '.9rem' }}>
          <div className="list-row" style={{ fontFamily: 'var(--fd)', fontWeight: 800, color: 'var(--gd)', fontSize: '.9rem' }}>
            Historique des paiements
          </div>
          {PAYMENTS.map((p) => (
            <div key={p.ref} className="list-row">
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--fd)', fontWeight: 700, fontSize: '.83rem', color: 'var(--gd)' }}>{p.ref}</div>
                <div className="muted" style={{ fontSize: '.74rem' }}>{p.order} · {p.date}</div>
                <div className="muted" style={{ fontSize: '.74rem' }}>Brut {fcfa(p.gross)} · commission {fcfa(p.commission)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--fd)', fontWeight: 800, color: 'var(--su)', fontSize: '.85rem' }}>{fcfa(p.net)}</div>
                <span className="status" style={{ color: 'var(--su)' }}>Reçu</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
