import TopBar from '../../components/TopBar';
import { fcfa, useApp } from '../../store/context';

export default function Finances() {
  const { orders } = useApp();
  const sales = orders.filter((order) =>
    order.status !== 'cancelled' && order.items.some((item) => item.sellerId === 'me'),
  );
  const received = sales
    .filter((order) => order.paymentStatus === 'paid')
    .reduce((total, order) => total + order.total, 0);
  const due = sales
    .filter((order) => order.paymentStatus !== 'paid')
    .reduce((total, order) => total + order.total, 0);

  return (
    <div className="page">
      <TopBar title="Finances" back showCart={false} />
      <div className="section">
        <div className="card" style={{ padding: '1rem', marginBottom: '.7rem' }}>
          <div style={{ fontSize: '1.2rem' }}>💵</div>
          <div style={{ fontFamily: 'var(--fd)', fontSize: '1.15rem', fontWeight: 800, color: 'var(--gd)' }}>{fcfa(due)}</div>
          <div className="muted" style={{ fontSize: '.76rem' }}>À recevoir à la livraison</div>
        </div>
        <div className="card" style={{ padding: '1rem', marginBottom: '.9rem' }}>
          <div style={{ fontSize: '1.2rem' }}>✅</div>
          <div style={{ fontFamily: 'var(--fd)', fontSize: '1.15rem', fontWeight: 800, color: 'var(--su)' }}>{fcfa(received)}</div>
          <div className="muted" style={{ fontSize: '.76rem' }}>Déclaré reçu après livraison</div>
        </div>
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ fontFamily: 'var(--fd)', fontWeight: 800, color: 'var(--gd)', fontSize: '.9rem' }}>Paiement à la livraison</div>
          <p className="muted" style={{ fontSize: '.82rem', lineHeight: 1.55, marginTop: '.4rem' }}>
            CuniMarket n’encaisse pas les paiements. Le client règle le producteur ou le livreur à la réception.
            Les montants affichés proviennent des commandes enregistrées sur cet appareil.
          </p>
        </div>
      </div>
    </div>
  );
}
