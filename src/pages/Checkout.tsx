import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { DELIVERY_OPTIONS } from '../data/mock';
import { fcfa, useApp } from '../store/context';
import type { DeliveryMode } from '../types';

function createOrderReference() {
  return `#CMK-${Date.now().toString(36).slice(-6).toUpperCase()}`;
}

function formatOrderDate() {
  return new Date().toLocaleDateString('fr-FR');
}

export default function Checkout() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { cart, cartTotal, user, addOrder, showToast } = useApp();

  const [delivery, setDelivery] = useState<DeliveryMode>('moto');
  const [form, setForm] = useState({
    name: user?.name ?? '',
    phone: user?.phone ?? '',
    email: user?.email ?? '',
    city: user?.city ?? '',
  });
  const [processing, setProcessing] = useState(false);

  const couponCode = params.get('coupon')?.toUpperCase() === 'CUNIMARKET10' ? 'CUNIMARKET10' : '';
  const discount = couponCode ? Math.round(cartTotal * 0.1) : 0;
  const deliveryFee = DELIVERY_OPTIONS.find((d) => d.value === delivery)?.fee ?? 0;
  const total = cartTotal + deliveryFee - discount;

  if (cart.length === 0) {
    return (
      <div className="page">
        <TopBar title="Commande" back showCart={false} />
        <div className="empty">
          <div className="ico">🛒</div>
          <p className="muted">Votre panier est vide.</p>
          <button className="btn" style={{ marginTop: '1rem' }} onClick={() => navigate('/catalogue')}>
            Voir le catalogue
          </button>
        </div>
      </div>
    );
  }

  const placeOrder = async () => {
    if (!form.name.trim() || form.phone.trim().length < 6 || !form.city.trim()) {
      showToast('Nom, téléphone valide et ville de livraison obligatoires', 'error');
      return;
    }
    setProcessing(true);
    try {
      const order = await addOrder({
        ref: createOrderReference(),
        createdAt: formatOrderDate(),
        items: cart.map((i) => ({ id: i.id, title: i.title, qty: i.cartQty, price: i.price, emoji: i.emoji, bg: i.bg, sellerId: i.sellerId })),
        subtotal: cartTotal,
        deliveryFee,
        discount,
        total,
        delivery,
        payMethod: 'cash_on_delivery',
        status: 'pending',
        buyer: form,
        paymentStatus: 'due_on_delivery',
        paymentMethod: 'cash_on_delivery',
      });
      navigate(`/confirmation/${order.ref.replace('#', '')}`, { replace: true });
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Impossible d’enregistrer la commande.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="page" style={{ paddingBottom: 96 }}>
      <TopBar title="Commande" back showCart={false} />

      <div className="section" style={{ paddingBottom: '.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.35rem', justifyContent: 'center', marginBottom: '1rem' }}>
          {['Panier', 'Livraison', 'Confirmation'].map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '.35rem' }}>
              <span
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: i < 2 ? 'var(--gd)' : 'var(--bd)',
                  color: i < 2 ? '#fff' : 'var(--sll)',
                  fontSize: '.68rem',
                  fontWeight: 800,
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                {i < 1 ? '✓' : i + 1}
              </span>
              <span style={{ fontFamily: 'var(--fd)', fontSize: '.76rem', fontWeight: 700, color: i < 2 ? 'var(--gd)' : 'var(--sll)' }}>{s}</span>
              {i < 2 && <span style={{ width: 16, height: 2, background: 'var(--bd)' }} />}
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: '1rem', marginBottom: '.9rem' }}>
          <div className="label" style={{ marginBottom: '.8rem' }}>📋 Informations de contact</div>
          {(
            [
              ['name', 'Nom complet', 'Jean Kpodji'],
              ['phone', 'Téléphone', '+229 97 00 00 00'],
              ['email', 'Email', 'email@exemple.com'],
              ['city', 'Ville / Quartier', 'Calavi, Godomey…'],
            ] as const
          ).map(([k, l, p]) => (
            <div className="field" key={k}>
              <label className="label" htmlFor={`c-${k}`}>{l}</label>
              <input
                id={`c-${k}`}
                className="input"
                value={form[k]}
                onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                placeholder={p}
              />
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: '1rem', marginBottom: '.9rem' }}>
          <div className="label" style={{ marginBottom: '.8rem' }}>🚚 Mode de livraison</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
            {DELIVERY_OPTIONS.map((d) => (
              <button
                key={d.value}
                className={`option-row${delivery === d.value ? ' selected' : ''}`}
                onClick={() => setDelivery(d.value)}
              >
                <span style={{ fontSize: '1.35rem' }}>{d.icon}</span>
                <span style={{ flex: 1 }}>
                  <span className="option-title" style={{ display: 'block' }}>{d.title}</span>
                  <span className="option-desc">{d.desc}</span>
                </span>
                <span style={{ fontFamily: 'var(--fd)', fontWeight: 800, fontSize: '.85rem', color: d.fee === 0 ? 'var(--su)' : 'var(--oc)' }}>
                  {d.fee === 0 ? 'Gratuit' : fcfa(d.fee)}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', marginBottom: '.9rem' }}>
          <div className="label" style={{ marginBottom: '.45rem' }}>💵 Paiement à la livraison</div>
          <p className="muted" style={{ fontSize: '.84rem', lineHeight: 1.55 }}>
            Vous ne payez rien maintenant. Le montant total sera à régler au producteur ou au livreur
            lorsque vous recevrez votre commande.
          </p>
          <div className="row-between" style={{ fontFamily: 'var(--fd)', fontWeight: 800, color: 'var(--gd)', marginTop: '.75rem' }}>
            <span>À régler à la livraison</span>
            <span style={{ color: 'var(--oc)' }}>{fcfa(total)}</span>
          </div>
        </div>

        <div className="card" style={{ padding: '1rem' }}>
          <div className="label" style={{ marginBottom: '.6rem' }}>📦 Votre commande</div>
          {cart.map((i) => (
            <div key={i.id} className="row-between" style={{ padding: '.4rem 0', fontSize: '.84rem' }}>
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {i.emoji} {i.title} ×{i.cartQty}
              </span>
              <span style={{ fontFamily: 'var(--fd)', fontWeight: 700, color: 'var(--oc)' }}>{fcfa(i.price * i.cartQty)}</span>
            </div>
          ))}
          <div className="row-between" style={{ fontSize: '.84rem', padding: '.3rem 0', borderTop: '1px solid var(--bd)', marginTop: '.4rem' }}>
            <span>Sous-total</span>
            <span>{fcfa(cartTotal)}</span>
          </div>
          <div className="row-between" style={{ fontSize: '.84rem', padding: '.3rem 0' }}>
            <span>Livraison</span>
            <span>{deliveryFee === 0 ? 'Gratuit' : fcfa(deliveryFee)}</span>
          </div>
          {discount > 0 && (
            <div className="row-between" style={{ fontSize: '.84rem', padding: '.3rem 0' }}>
              <span>Coupon</span>
              <span style={{ color: 'var(--su)' }}>−{fcfa(discount)}</span>
            </div>
          )}
          <div className="row-between" style={{ fontFamily: 'var(--fd)', fontWeight: 800, fontSize: '1rem', color: 'var(--gd)', borderTop: '2px solid var(--bd)', paddingTop: '.6rem', marginTop: '.3rem' }}>
            <span>Total</span>
            <span style={{ color: 'var(--oc)' }}>{fcfa(total)}</span>
          </div>
        </div>
      </div>

      <div className="sticky-cta">
        <button className="btn ocre block" onClick={() => void placeOrder()} disabled={processing}>
          {processing ? 'Enregistrement…' : `✅ Confirmer la commande · ${fcfa(total)}`}
        </button>
      </div>

      {processing && (
        <div className="modal-backdrop" role="status" aria-live="polite">
          <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem' }}>📦</div>
            <div style={{ fontFamily: 'var(--fd)', fontWeight: 700, color: 'var(--gd)' }}>Enregistrement de votre commande…</div>
          </div>
        </div>
      )}
    </div>
  );
}
