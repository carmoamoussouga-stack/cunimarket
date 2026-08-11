import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../components/TopBar';
import { DELIVERY_OPTIONS, SELLER_ORDERS } from '../../data/mock';
import { fcfa, useApp } from '../../store/context';
import type { Order } from '../../types';

const STATUS_LABEL: Record<Order['status'], string> = {
  pending: '⏳ En attente',
  confirmed: '✓ Confirmé',
  shipping: '🚚 En route',
  delivered: '✅ Livré',
};

export default function Orders() {
  const navigate = useNavigate();
  const { orders, user } = useApp();
  const isSeller = user?.role === 'seller';
  const [tab, setTab] = useState<'buy' | 'sell'>('buy');

  const list = isSeller && tab === 'sell' ? SELLER_ORDERS : orders;

  return (
    <div className="page">
      <TopBar title="Mes commandes" back showCart={false} />
      <div className="section">
        {isSeller && (
          <div className="tabs" style={{ marginBottom: '.9rem' }}>
            <button className={tab === 'buy' ? 'active' : ''} onClick={() => setTab('buy')}>Mes achats</button>
            <button className={tab === 'sell' ? 'active' : ''} onClick={() => setTab('sell')}>Mes ventes</button>
          </div>
        )}

        {list.length === 0 ? (
          <div className="empty card">
            <div className="ico">📦</div>
            <div style={{ fontFamily: 'var(--fd)', fontWeight: 700, color: 'var(--gd)' }}>Aucune commande</div>
            <p className="muted" style={{ fontSize: '.85rem', margin: '.4rem 0 1rem' }}>Vos commandes apparaîtront ici.</p>
            <button className="btn" onClick={() => navigate('/catalogue')}>Voir le catalogue</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.8rem' }}>
            {list.map((o) => (
              <div key={o.ref} className="card" style={{ padding: '.9rem' }}>
                <div className="row-between">
                  <span style={{ fontFamily: 'var(--fd)', fontWeight: 800, color: 'var(--gd)' }}>{o.ref}</span>
                  <span className="status" style={{ color: o.status === 'delivered' ? 'var(--su)' : 'var(--oc)' }}>{STATUS_LABEL[o.status]}</span>
                </div>
                <div className="muted" style={{ fontSize: '.75rem', margin: '.2rem 0 .6rem' }}>
                  {o.createdAt} · {DELIVERY_OPTIONS.find((d) => d.value === o.delivery)?.title}
                </div>
                {o.items.map((i) => (
                  <div key={i.id} className="row-between" style={{ fontSize: '.84rem', padding: '.25rem 0' }}>
                    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {i.emoji} {i.title} ×{i.qty}
                    </span>
                    <span style={{ fontFamily: 'var(--fd)', fontWeight: 700 }}>{fcfa(i.price * i.qty)}</span>
                  </div>
                ))}
                <div className="row-between" style={{ borderTop: '1px solid var(--bd)', marginTop: '.5rem', paddingTop: '.5rem', fontFamily: 'var(--fd)', fontWeight: 800, color: 'var(--gd)' }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--oc)' }}>{fcfa(o.total)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
