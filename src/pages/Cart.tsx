import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { fcfa, useApp } from '../store/context';

export default function Cart() {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQty, cartTotal, user, showToast } = useApp();
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);

  const applyCoupon = () => {
    if (coupon.trim().toUpperCase() === 'CUNIMARKET10') {
      setDiscount(Math.round(cartTotal * 0.1));
      showToast('Coupon appliqué ! −10%');
    } else {
      setDiscount(0);
      showToast('Code promo invalide', 'error');
    }
  };

  if (cart.length === 0) {
    return (
      <div className="page">
        <TopBar title="Mon panier" showCart={false} />
        <div className="empty">
          <div className="ico">🛒</div>
          <div style={{ fontFamily: 'var(--fd)', fontWeight: 800, color: 'var(--gd)' }}>Votre panier est vide</div>
          <p className="muted" style={{ fontSize: '.87rem', margin: '.4rem 0 1.1rem' }}>
            Parcourez le catalogue pour trouver des animaux et équipements.
          </p>
          <button className="btn" onClick={() => navigate('/catalogue')}>
            Voir le catalogue →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ paddingBottom: 96 }}>
      <TopBar title={`Mon panier (${cart.length})`} showCart={false} />

      <div className="section" style={{ display: 'flex', flexDirection: 'column', gap: '.8rem' }}>
        {cart.map((item) => (
          <div key={item.id} className="card" style={{ padding: '.8rem', display: 'flex', gap: '.8rem' }}>
            <div className="thumb-sm" style={{ background: item.bg, width: 64, height: 64, fontSize: '1.8rem' }}>
              {item.emoji}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="muted" style={{ fontSize: '.7rem' }}>{item.seller}</div>
              <div style={{ fontFamily: 'var(--fd)', fontWeight: 700, fontSize: '.86rem', color: 'var(--gd)', lineHeight: 1.3 }}>
                {item.title}
              </div>
              <div className="row-between" style={{ marginTop: '.5rem' }}>
                <div className="stepper">
                  <button onClick={() => updateQty(item.id, item.cartQty - 1)} aria-label="Diminuer">−</button>
                  <span>{item.cartQty}</span>
                  <button onClick={() => updateQty(item.id, item.cartQty + 1)} aria-label="Augmenter">+</button>
                </div>
                <div style={{ fontFamily: 'var(--fd)', fontWeight: 800, color: 'var(--oc)', fontSize: '.95rem' }}>
                  {fcfa(item.price * item.cartQty)}
                </div>
              </div>
              <button className="btn danger" style={{ marginTop: '.5rem', padding: '.3rem .7rem', fontSize: '.75rem' }} onClick={() => removeFromCart(item.id)}>
                🗑️ Retirer
              </button>
            </div>
          </div>
        ))}

        <div className="card" style={{ padding: '.9rem' }}>
          <div style={{ display: 'flex', gap: '.5rem' }}>
            <input className="input" value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="Code promo" />
            <button className="btn ghost" onClick={applyCoupon}>Appliquer</button>
          </div>
          <div style={{ marginTop: '.8rem' }}>
            <div className="row-between" style={{ fontSize: '.87rem', padding: '.3rem 0' }}>
              <span>Sous-total</span>
              <span className="muted">{fcfa(cartTotal)}</span>
            </div>
            <div className="row-between" style={{ fontSize: '.87rem', padding: '.3rem 0' }}>
              <span>Livraison</span>
              <span className="muted">Calculée ensuite</span>
            </div>
            {discount > 0 && (
              <div className="row-between" style={{ fontSize: '.87rem', padding: '.3rem 0' }}>
                <span>Coupon</span>
                <span style={{ color: 'var(--su)' }}>−{fcfa(discount)}</span>
              </div>
            )}
            <div className="row-between" style={{ fontFamily: 'var(--fd)', fontWeight: 800, fontSize: '1.05rem', color: 'var(--gd)', borderTop: '1px solid var(--bd)', paddingTop: '.6rem', marginTop: '.4rem' }}>
              <span>Total</span>
              <span style={{ color: 'var(--oc)' }}>{fcfa(cartTotal - discount)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="sticky-cta">
        <button
          className="btn ocre block"
          onClick={() => navigate(user ? `/checkout${discount > 0 ? '?coupon=CUNIMARKET10' : ''}` : '/connexion?next=/checkout')}
        >
          Passer la commande — {fcfa(cartTotal - discount)}
        </button>
      </div>
    </div>
  );
}
