import { useNavigate, useParams } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { DELIVERY_OPTIONS, PAY_OPTIONS } from '../data/mock';
import { fcfa, useApp } from '../store/context';

export default function Confirm() {
  const { ref } = useParams();
  const navigate = useNavigate();
  const { orders } = useApp();
  const order = orders.find((o) => o.ref === `#${ref}`) ?? orders[0];

  return (
    <div className="page">
      <TopBar title="Confirmation" showCart={false} />
      <div className="section" style={{ textAlign: 'center' }}>
        <div style={{ width: 82, height: 82, borderRadius: '50%', background: 'rgba(27,67,50,.1)', display: 'grid', placeItems: 'center', fontSize: '2.2rem', margin: '1rem auto' }}>
          ✅
        </div>
        <h1 style={{ fontFamily: 'var(--fd)', fontSize: '1.35rem', fontWeight: 800, color: 'var(--gd)' }}>Commande confirmée !</h1>
        <p className="muted" style={{ fontSize: '.9rem', lineHeight: 1.7, margin: '.5rem 0 1.25rem' }}>
          Votre paiement a été reçu. Les vendeurs ont été notifiés et vont préparer votre commande.
        </p>

        {order && (
          <div className="card" style={{ padding: '1rem', textAlign: 'left' }}>
            <div className="label" style={{ marginBottom: '.6rem' }}>Détails de la commande</div>
            {[
              ['N° commande', order.ref],
              ['Méthode', PAY_OPTIONS.find((p) => p.value === order.payMethod)?.title ?? '—'],
              ['Livraison', DELIVERY_OPTIONS.find((d) => d.value === order.delivery)?.title ?? '—'],
              ['Date', order.createdAt],
              ['Total', fcfa(order.total)],
            ].map(([k, v]) => (
              <div key={k} className="row-between" style={{ fontSize: '.86rem', padding: '.35rem 0', borderBottom: '1px solid var(--bd)' }}>
                <span className="muted">{k}</span>
                <span style={{ fontFamily: 'var(--fd)', fontWeight: 700, color: 'var(--gd)' }}>{v}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem', marginTop: '1.25rem' }}>
          <button className="btn block lg" onClick={() => navigate('/compte/commandes')}>
            📦 Suivre ma commande
          </button>
          <button className="btn ghost block" onClick={() => navigate('/')}>
            ← Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
}
