import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../components/TopBar';
import { CATEGORIES, DEPTS } from '../../data/mock';
import { fcfa, useApp } from '../../store/context';

const BG_BY_CATEGORY: Record<string, string> = {
  Lapereaux: '#e8f5e9',
  Reproducteurs: '#e8f5e9',
  Cailles: '#fff3e0',
  Œufs: '#fff3e0',
  Équipements: '#e3f2fd',
  Aliments: '#f3e5f5',
  Médicaments: '#fce4ec',
  Formation: '#ede7f6',
};

export default function Publish() {
  const navigate = useNavigate();
  const { publishListing, showToast, user } = useApp();
  const [form, setForm] = useState({
    title: '',
    category: '',
    price: '',
    qty: '',
    unit: 'tête',
    city: '',
    dept: '',
    desc: '',
  });

  const icon = CATEGORIES.find((c) => c.slug === form.category)?.icon ?? '🐇';

  const submit = () => {
    if (!form.title || !form.category || !form.price) {
      showToast('Titre, catégorie et prix obligatoires', 'error');
      return;
    }
    publishListing({
      id: `own-${Date.now()}`,
      title: form.title,
      category: form.category,
      price: Number(form.price),
      unit: form.unit,
      qty: Number(form.qty) || 1,
      dept: form.dept || user?.dept || 'Littoral',
      city: form.city || 'Cotonou',
      seller: user?.name ?? 'Mon élevage',
      sellerId: 'me',
      verified: false,
      rating: 5,
      sales: 0,
      emoji: icon,
      bg: BG_BY_CATEGORY[form.category] ?? '#e8f5e9',
      date: "À l'instant",
      views: 0,
      desc: form.desc,
    });
    showToast('Annonce publiée !');
    navigate('/compte/annonces');
  };

  return (
    <div className="page" style={{ paddingBottom: 96 }}>
      <TopBar title="Publier une annonce" back showCart={false} />
      <div className="section">
        <div className="card" style={{ padding: '1rem', marginBottom: '.9rem' }}>
          <div className="label" style={{ marginBottom: '.8rem' }}>📋 Informations principales</div>
          <div className="field">
            <label className="label" htmlFor="p-title">Titre de l'annonce</label>
            <input id="p-title" className="input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Lapereaux NZB sevrés…" />
          </div>
          <div className="field">
            <label className="label" htmlFor="p-cat">Catégorie</label>
            <select id="p-cat" className="select" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
              <option value="">Choisir…</option>
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>{c.icon} {c.slug}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6rem' }}>
            <div className="field">
              <label className="label" htmlFor="p-price">Prix (FCFA)</label>
              <input id="p-price" className="input" inputMode="numeric" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value.replace(/\D/g, '') }))} placeholder="1000" />
            </div>
            <div className="field">
              <label className="label" htmlFor="p-qty">Quantité</label>
              <input id="p-qty" className="input" inputMode="numeric" value={form.qty} onChange={(e) => setForm((f) => ({ ...f, qty: e.target.value.replace(/\D/g, '') }))} placeholder="10" />
            </div>
          </div>
          <div className="field">
            <label className="label" htmlFor="p-unit">Unité</label>
            <input id="p-unit" className="input" value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} placeholder="tête, sac, lot…" />
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', marginBottom: '.9rem' }}>
          <div className="label" style={{ marginBottom: '.8rem' }}>📍 Description et localisation</div>
          <div className="field">
            <label className="label" htmlFor="p-desc">Description</label>
            <textarea id="p-desc" className="textarea" value={form.desc} onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))} placeholder="Décrivez vos animaux, l'âge, la vaccination…" />
          </div>
          <div className="field">
            <label className="label" htmlFor="p-dept">Département</label>
            <select id="p-dept" className="select" value={form.dept} onChange={(e) => setForm((f) => ({ ...f, dept: e.target.value }))}>
              <option value="">Choisir…</option>
              {DEPTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor="p-city">Ville</label>
            <input id="p-city" className="input" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} placeholder="Cotonou" />
          </div>
        </div>

        <div className="label">Prévisualisation</div>
        <div className="card" style={{ overflow: 'hidden', marginTop: '.4rem' }}>
          <div style={{ height: 130, background: BG_BY_CATEGORY[form.category] ?? 'var(--cr)', display: 'grid', placeItems: 'center', fontSize: '3.2rem' }}>
            {icon}
          </div>
          <div style={{ padding: '.9rem' }}>
            <span className="chip">{form.category || 'Catégorie'}</span>
            <div style={{ fontFamily: 'var(--fd)', fontWeight: 700, color: 'var(--gd)', margin: '.45rem 0 .2rem' }}>
              {form.title || 'Titre de votre annonce'}
            </div>
            <div style={{ fontFamily: 'var(--fd)', fontWeight: 800, color: 'var(--oc)' }}>
              {form.price ? fcfa(Number(form.price)) : '0 FCFA'}
            </div>
            <div className="muted" style={{ fontSize: '.76rem', marginTop: '.3rem' }}>📍 {form.city || 'Votre ville'}, {form.dept || 'département'}</div>
          </div>
        </div>
      </div>

      <div className="sticky-cta">
        <button className="btn block ocre" onClick={submit}>🚀 Publier l'annonce</button>
      </div>
    </div>
  );
}
