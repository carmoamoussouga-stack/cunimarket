import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../components/TopBar';
import { CATEGORIES, CITY_COORDS, DEPTS } from '../../data/mock';
import { compressImage } from '../../lib/photos';
import { fcfa, useApp } from '../../store/context';

const BG_BY_CATEGORY: Record<string, string> = {
  Lapereaux: '#e8f5e9',
  Reproducteurs: '#e8f5e9',
  Viande: '#fce4ec',
  Équipements: '#e3f2fd',
  Aliments: '#f3e5f5',
  'Autres produits': '#efebe9',
};

export default function Publish() {
  const navigate = useNavigate();
  const { publishListing, showToast, user, coords } = useApp();
  const [photos, setPhotos] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: '',
    category: '',
    price: '',
    qty: '',
    unit: 'tête',
    city: user?.city ?? '',
    dept: user?.dept ?? '',
    desc: '',
    breed: '',
    age: '',
    weight: '',
    sex: '',
    vaccinated: false,
  });

  const icon = CATEGORIES.find((c) => c.slug === form.category)?.icon ?? '🐇';

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    const room = 4 - photos.length;
    const slice = Array.from(files).slice(0, room);
    try {
      const next = await Promise.all(slice.map((f) => compressImage(f)));
      setPhotos((p) => [...p, ...next]);
    } catch {
      showToast('Impossible de lire une photo', 'error');
    }
  };

  const submit = async () => {
    if (!form.title || !form.category || !form.price) {
      showToast('Titre, catégorie et prix obligatoires', 'error');
      return;
    }
    const city = form.city || user?.city || 'Cotonou';
    const geo = coords ?? CITY_COORDS[city] ?? { lat: 6.3654, lng: 2.4183 };
    try {
      await publishListing({
      id: `own-${Date.now()}`,
      title: form.title,
      category: form.category,
      price: Number(form.price),
      unit: form.unit,
      qty: Number(form.qty) || 1,
      breed: form.breed || undefined,
      age: form.age ? Number(form.age) : undefined,
      weight: form.weight ? Number(form.weight) : undefined,
      vaccinated: form.vaccinated,
      sex: form.sex || undefined,
      photos,
      dept: form.dept || user?.dept || 'Littoral',
      city,
      lat: geo.lat,
      lng: geo.lng,
      seller: user?.farmName || user?.name || 'Mon élevage',
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
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Impossible de publier cette annonce.', 'error');
    }
  };

  return (
    <div className="page" style={{ paddingBottom: 96 }}>
      <TopBar title="Publier une annonce" back showCart={false} />
      <div className="section">
        <div className="card" style={{ padding: '1rem', marginBottom: '.9rem' }}>
          <div className="label" style={{ marginBottom: '.8rem' }}>📸 Photos de vos lapins ou produits</div>
          <p className="muted" style={{ fontSize: '.78rem', marginBottom: '.7rem' }}>
            Ajoutez vos propres photos (jusqu’à 4). Elles aident l’acheteur à se situer sur l’état réel du lot.
          </p>
          <div className="photo-grid">
            {photos.map((src, i) => (
              <div key={i} className="photo-slot">
                <img src={src} alt="" />
                <button type="button" className="photo-remove" onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}>
                  ×
                </button>
              </div>
            ))}
            {photos.length < 4 && (
              <label className="photo-add">
                <input type="file" accept="image/*" multiple hidden onChange={(e) => void addPhotos(e.target.files)} />
                + Photo
              </label>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', marginBottom: '.9rem' }}>
          <div className="label" style={{ marginBottom: '.8rem' }}>📋 Produit</div>
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
            <input id="p-unit" className="input" value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} placeholder="tête, kg, sac, lot…" />
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', marginBottom: '.9rem' }}>
          <div className="label" style={{ marginBottom: '.8rem' }}>🐇 Caractéristiques</div>
          <div className="field">
            <label className="label" htmlFor="p-breed">Race / type</label>
            <input id="p-breed" className="input" value={form.breed} onChange={(e) => setForm((f) => ({ ...f, breed: e.target.value }))} placeholder="Néo-Zélandais Blanc" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6rem' }}>
            <div className="field">
              <label className="label" htmlFor="p-age">Âge (jours)</label>
              <input id="p-age" className="input" inputMode="numeric" value={form.age} onChange={(e) => setForm((f) => ({ ...f, age: e.target.value.replace(/\D/g, '') }))} placeholder="35" />
            </div>
            <div className="field">
              <label className="label" htmlFor="p-weight">Poids (g)</label>
              <input id="p-weight" className="input" inputMode="numeric" value={form.weight} onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value.replace(/\D/g, '') }))} placeholder="450" />
            </div>
          </div>
          <div className="field">
            <label className="label" htmlFor="p-sex">Sexe</label>
            <select id="p-sex" className="select" value={form.sex} onChange={(e) => setForm((f) => ({ ...f, sex: e.target.value }))}>
              <option value="">Non précisé</option>
              <option value="Mixte">Mixte</option>
              <option value="Mâle">Mâle</option>
              <option value="Femelle">Femelle</option>
            </select>
          </div>
          <label className="option-row" style={{ marginTop: '.2rem' }}>
            <input type="checkbox" checked={form.vaccinated} onChange={(e) => setForm((f) => ({ ...f, vaccinated: e.target.checked }))} />
            <span>
              <span className="option-title">Vaccinés / vermifugés</span>
              <span className="option-desc">Affiché sur la fiche produit</span>
            </span>
          </label>
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
          <div style={{ height: 130, background: BG_BY_CATEGORY[form.category] ?? 'var(--cr)', display: 'grid', placeItems: 'center', fontSize: '3.2rem', overflow: 'hidden' }}>
            {photos[0] ? <img src={photos[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : icon}
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
        <button className="btn block ocre" onClick={() => void submit()}>🚀 Publier l'annonce</button>
      </div>
    </div>
  );
}
