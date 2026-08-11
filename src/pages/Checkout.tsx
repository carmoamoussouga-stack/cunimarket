import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { DELIVERY_OPTIONS, PAY_OPTIONS } from '../data/mock';
import { fcfa, useApp } from '../store/context';
import type { DeliveryMode, PayMethod } from '../types';

export default function Checkout() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { cart, cartTotal, user, addOrder, showToast } = useApp();

  const [delivery, setDelivery] = useState<DeliveryMode>('moto');
  const [payMethod, setPayMethod] = useState<PayMethod>('mtn');
  const [form, setForm] = useState({
    name: user?.name ?? '',
    phone: user?.phone ?? '',
    email: user?.email ?? '',
    city: '',
  });
  const [fedaOpen, setFedaOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  const discount = Number(params.get('discount') ?? 0);
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

  const openPayment = () => {
    if (!form.name || !form.phone) {
      showToast('Nom et téléphone obligatoires', 'error');
      return;
    }
    setFedaOpen(true);
  };

  const pay = () => {
    setProcessing(true);
    window.setTimeout(() => {
      const ref = `#CMK-${Date.now().toString().slice(-5)}`;
      addOrder({
        ref,
        createdAt: new Date().toLocaleDateString('fr-FR'),
        items: cart.map((i) => ({ id: i.id, title: i.title, qty: i.cartQty, price: i.price, emoji: i.emoji, bg: i.bg })),
        subtotal: cartTotal,
        deliveryFee,
        discount,
        total,
        delivery,
        payMethod,
        status: 'confirmed',
        buyer: form,
      });
      setProcessing(false);
      setFedaOpen(false);
      navigate(`/confirmation/${ref.replace('#', '')}`, { replace: true });
    }, 2200);
  };

  return (
    <div className="page" style={{ paddingBottom: 96 }}>
      <TopBar title="Commande" back showCart={false} />

      <div className="section" style={{ paddingBottom: '.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.35rem', justifyContent: 'center', marginBottom: '1rem' }}>
          {['Panier', 'Livraison', 'Paiement'].map((s, i) => (
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
          <div className="label" style={{ marginBottom: '.8rem' }}>
            💳 Paiement — <span style={{ color: 'var(--oc)' }}>sécurisé par FedaPay</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
            {PAY_OPTIONS.map((p) => (
              <button
                key={p.value}
                className={`option-row${payMethod === p.value ? ' selected' : ''}`}
                onClick={() => setPayMethod(p.value)}
              >
                <span
                  style={{
                    width: 48,
                    height: 32,
                    borderRadius: 6,
                    background: p.bg,
                    color: p.color,
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '.65rem',
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  {p.logo}
                </span>
                <span style={{ flex: 1 }}>
                  <span className="option-title" style={{ display: 'block' }}>{p.title}</span>
                  <span className="option-desc">{p.desc}</span>
                </span>
              </button>
            ))}
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
        <button className="btn ocre block" onClick={openPayment}>
          💳 Payer {fcfa(total)}
        </button>
      </div>

      {fedaOpen && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget && !processing) setFedaOpen(false);
          }}
        >
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 380, overflow: 'hidden', position: 'relative' }}>
            <div style={{ background: 'linear-gradient(135deg,#1B4332,#2D6A4F)', padding: '1.25rem', textAlign: 'center', color: '#fff' }}>
              <div style={{ fontFamily: 'var(--fd)', fontWeight: 800 }}>🔒 FedaPay</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, margin: '.4rem 0 .2rem' }}>{fcfa(total)}</div>
              <div style={{ fontSize: '.76rem', opacity: 0.75 }}>CuniMarket · Votre commande</div>
            </div>
            <div style={{ padding: '1.1rem', position: 'relative' }}>
              <div className="field">
                <label className="label" htmlFor="p-phone">Numéro de téléphone</label>
                <input id="p-phone" className="input" defaultValue={form.phone || '+229 97 00 00 00'} />
              </div>
              <div className="field">
                <label className="label" htmlFor="p-name">Nom du titulaire</label>
                <input id="p-name" className="input" defaultValue={form.name} />
              </div>
              <button className="btn ocre block lg" onClick={pay}>
                Payer {fcfa(total)}
              </button>
              <div style={{ textAlign: 'center', fontSize: '.7rem', color: '#999', marginTop: '.8rem' }}>
                🔒 Paiement simulé · aucune transaction réelle
              </div>
              {processing && (
                <div style={{ position: 'absolute', inset: 0, background: '#fff', display: 'grid', placeItems: 'center', gap: '.75rem' }}>
                  <div>
                    <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        border: '4px solid #eee',
                        borderTopColor: '#1B4332',
                        borderRadius: '50%',
                        animation: 'spin .8s linear infinite',
                        margin: '0 auto .75rem',
                      }}
                    />
                    <div style={{ fontFamily: 'var(--fd)', fontWeight: 700, color: '#1B4332', textAlign: 'center' }}>Traitement en cours…</div>
                    <div style={{ fontSize: '.78rem', color: '#718096', textAlign: 'center' }}>Ne fermez pas cette fenêtre</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
