import { useNavigate, useParams } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { DELIVERY_OPTIONS } from '../data/mock';
import { fcfa, useApp } from '../store/context';

export default function Confirm() {
  const { ref } = useParams();
  const navigate = useNavigate();
  const { orders } = useApp();
  const order = orders.find((o) => o.ref === `#${ref}`);

  return (
    <div className="page">
      <TopBar title="Confirmation" showCart={false} />
      <div className="section" style={{ textAlign: 'center' }}>
        <div style={{ width: 82, height: 82, borderRadius: '50%', background: 'rgba(27,67,50,.1)', display: 'grid', placeItems: 'center', fontSize: '2.2rem', margin: '1rem auto' }}>
          ✅
        </div>
        <h1 style={{ fontFamily: 'var(--fd)', fontSize: '1.35rem', fontWeight: 800, color: 'var(--gd)' }}>Commande enregistrée !</h1>
        <p className="muted" style={{ fontSize: '.9rem', lineHeight: 1.7, margin: '.5rem 0 1.25rem' }}>
          Votre commande est enregistrée. Le paiement se fera à la livraison ; aucun paiement n’a été effectué dans l’application.
        </p>

        {order ? (
          <div className="card" style={{ padding: '1rem', textAlign: 'left' }}>
            <div className="label" style={{ marginBottom: '.6rem' }}>Détails de la commande</div>
            {[
              ['N° commande', order.ref],
              ['Paiement', 'À la livraison'],
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
        ) : (
          <div className="card" style={{ padding: '1rem', textAlign: 'left' }}>
            Cette commande n’est pas disponible sur cet appareil. Consultez votre historique ou contactez le producteur.
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
