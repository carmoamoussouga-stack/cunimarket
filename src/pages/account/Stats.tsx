import TopBar from '../../components/TopBar';
import { DELIVERY_OPTIONS } from '../../data/mock';
import { fcfa, useApp } from '../../store/context';

export default function Stats() {
  const { orders, ownListings } = useApp();
  const sales = orders.filter((order) =>
    order.status !== 'cancelled' && order.items.some((item) => item.sellerId === 'me'),
  );
  const paid = sales.filter((order) => order.paymentStatus === 'paid');
  const due = sales.filter((order) => order.paymentStatus !== 'paid');
  const received = paid.reduce((total, order) => total + order.total, 0);
  const awaiting = due.reduce((total, order) => total + order.total, 0);
  const views = ownListings.reduce((total, listing) => total + listing.views, 0);

  return (
    <div className="page">
      <TopBar title="Tableau de bord" back showCart={false} />
      <div className="section">
        <p className="muted" style={{ fontSize: '.82rem', marginBottom: '.8rem' }}>
          Chiffres calculés à partir des commandes enregistrées sur cet appareil.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6rem' }}>
          {[
            ['💰', fcfa(received), 'Reçu après livraison'],
            ['📦', String(sales.length), 'Commandes reçues'],
            ['🕒', fcfa(awaiting), 'À encaisser à la livraison'],
            ['👀', String(views), 'Vues de mes annonces'],
          ].map(([icon, value, label]) => (
            <div key={label} className="stat-card">
              <div style={{ fontSize: '1.2rem' }}>{icon}</div>
              <div className="stat-value">{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>

        <div className="card" style={{ marginTop: '.9rem' }}>
          <div className="list-row" style={{ fontFamily: 'var(--fd)', fontWeight: 800, color: 'var(--gd)', fontSize: '.9rem' }}>
            Commandes récentes
          </div>
          {sales.length === 0 ? (
            <p className="muted" style={{ padding: '0 1rem 1rem', fontSize: '.82rem' }}>
              Aucune commande reçue sur cet appareil pour le moment.
            </p>
          ) : (
            sales.slice(0, 5).map((order) => (
              <div key={order.ref} className="list-row">
                <div className="thumb-sm" style={{ background: order.items[0]?.bg ?? 'var(--cr)' }}>
                  {order.items[0]?.emoji ?? '📦'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--fd)', fontWeight: 700, fontSize: '.83rem', color: 'var(--gd)' }}>{order.ref}</div>
                  <div className="muted" style={{ fontSize: '.75rem' }}>
                    {order.buyer.name} · {DELIVERY_OPTIONS.find((option) => option.value === order.delivery)?.title}
                  </div>
                  <div style={{ fontFamily: 'var(--fd)', fontWeight: 800, fontSize: '.8rem', color: 'var(--oc)' }}>{fcfa(order.total)}</div>
                </div>
                <span className="status">{order.paymentStatus === 'paid' ? 'Payé' : 'À la livraison'}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
