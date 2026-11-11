import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TopBar from '../../components/TopBar';
import { CATEGORIES, CITY_COORDS, DEPTS } from '../../data/mock';
import { compressImage } from '../../lib/photos';
import { supabase } from '../../lib/supabase';
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
  const [params] = useSearchParams();
  const editId = params.get('id');
  const { publishListing, updateListing, ownListings, showToast, user, coords } = useApp();
  const editingListing = ownListings.find((listing) => listing.id === editId);
  const [photoEdits, setPhotoEdits] = useState<string[] | null>(null);
  const photos = photoEdits ?? editingListing?.photos ?? [];
  const setPhotos = (update: string[] | ((current: string[]) => string[])) => {
    setPhotoEdits((current) => typeof update === 'function'
      ? update(current ?? editingListing?.photos ?? [])
      : update,
    );
  };
  const defaultForm = {
    title: editingListing?.title ?? '',
    category: editingListing?.category ?? '',
    normalPrice: editingListing ? String(editingListing.originalPrice ?? editingListing.price) : '',
    salePrice: editingListing?.originalPrice && editingListing.originalPrice > editingListing.price
      ? String(editingListing.price)
      : '',
    qty: editingListing ? String(editingListing.qty) : '',
    unit: editingListing?.unit ?? 'tête',
    city: editingListing?.city ?? user?.city ?? '',
    dept: editingListing?.dept ?? user?.dept ?? '',
    desc: editingListing?.desc ?? '',
    breed: editingListing?.breed ?? '',
    age: editingListing?.age != null ? String(editingListing.age) : '',
    weight: editingListing?.weight != null ? String(editingListing.weight / 1000) : '',
    sex: editingListing?.sex ?? '',
    vaccinated: editingListing?.vaccinated ?? false,
  };
  const [formEdits, setFormEdits] = useState<Partial<typeof defaultForm>>({});
  const form = { ...defaultForm, ...formEdits };
  const setForm = (update: (current: typeof defaultForm) => typeof defaultForm) => {
    setFormEdits((current) => update({ ...defaultForm, ...current }));
  };

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
    if (editId && !editingListing) {
      showToast('Annonce à modifier introuvable.', 'error');
      return;
    }
    if (!form.title || !form.category || !form.normalPrice) {
      showToast('Titre, catégorie et prix normal obligatoires', 'error');
      return;
    }
    const normalPrice = Number(form.normalPrice);
    const price = form.salePrice ? Number(form.salePrice) : normalPrice;
    const weightKg = form.weight ? Number(form.weight.replace(',', '.')) : undefined;
    if (normalPrice <= 0 || price <= 0 || price > normalPrice) {
      showToast('Le prix de vente doit être positif et inférieur ou égal au prix normal.', 'error');
      return;
    }
    if (weightKg !== undefined && (!Number.isFinite(weightKg) || weightKg <= 0)) {
      showToast('Indiquez un poids en kg valide.', 'error');
      return;
    }
    const city = form.city || user?.city || 'Cotonou';
    const geo = coords ?? CITY_COORDS[city] ?? { lat: 6.3654, lng: 2.4183 };
    try {
      const listing = {
      id: editId ?? `own-${Date.now()}`,
      title: form.title,
      category: form.category,
      price,
      originalPrice: normalPrice,
      unit: form.unit,
      qty: Number(form.qty) || 1,
      breed: form.breed || undefined,
      age: form.age ? Number(form.age) : undefined,
      weight: weightKg !== undefined ? Math.round(weightKg * 1000) : undefined,
      vaccinated: form.vaccinated,
      sex: form.sex || undefined,
      photos,
      dept: form.dept || user?.dept || 'Littoral',
      city,
      lat: geo.lat,
      lng: geo.lng,
      seller: user?.farmName || user?.name || 'Mon élevage',
      sellerId: 'me',
      verified: editingListing?.verified ?? false,
      rating: editingListing?.rating ?? 5,
      sales: editingListing?.sales ?? 0,
      emoji: icon,
      bg: BG_BY_CATEGORY[form.category] ?? '#e8f5e9',
      date: editingListing?.date ?? "À l'instant",
      views: editingListing?.views ?? 0,
      desc: form.desc,
      };
      if (editId) {
        await updateListing(editId, listing);
        showToast('Annonce modifiée. Elle sera vérifiée par un administrateur.');
      } else {
        await publishListing(listing);
        showToast('Annonce publiée !');
      }
      navigate('/compte/annonces');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Impossible de publier cette annonce.', 'error');
    }
  };

  return (
    <div className="page" style={{ paddingBottom: 96 }}>
      <TopBar title={editId ? "Modifier l'annonce" : "Publier une annonce"} back showCart={false} />
      {supabase && user?.role === 'seller' && user.verificationStatus !== 'verified' && (
        <div className="section" style={{ paddingBottom: 0 }}>
          <div className="card" style={{ padding: '.9rem', color: 'var(--er)' }}>
            {user.verificationStatus === 'rejected'
              ? 'Votre compte producteur a été refusé. Contactez l’administration pour en savoir plus.'
              : 'Votre compte producteur est en attente d’approbation par un administrateur. Vous pourrez publier ou modifier vos annonces après validation.'}
          </div>
        </div>
      )}
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
              <label className="label" htmlFor="p-normal-price">Prix normal (FCFA)</label>
              <input id="p-normal-price" className="input" inputMode="numeric" value={form.normalPrice} onChange={(e) => setForm((f) => ({ ...f, normalPrice: e.target.value.replace(/\D/g, '') }))} placeholder="1000" />
            </div>
            <div className="field">
              <label className="label" htmlFor="p-sale-price">Prix de vente (FCFA, facultatif)</label>
              <input id="p-sale-price" className="input" inputMode="numeric" value={form.salePrice} onChange={(e) => setForm((f) => ({ ...f, salePrice: e.target.value.replace(/\D/g, '') }))} placeholder="Identique au prix normal" />
              <span className="muted" style={{ fontSize: '.75rem' }}>Laissez vide pour vendre au prix normal.</span>
            </div>
          </div>
          <div className="field">
            <label className="label" htmlFor="p-qty">Quantité</label>
            <input id="p-qty" className="input" inputMode="numeric" value={form.qty} onChange={(e) => setForm((f) => ({ ...f, qty: e.target.value.replace(/\D/g, '') }))} placeholder="10" />
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
              <label className="label" htmlFor="p-weight">Poids (kg)</label>
              <input
                id="p-weight"
                className="input"
                type="text"
                inputMode="decimal"
                value={form.weight}
                onChange={(e) => setForm((f) => ({
                  ...f,
                  weight: e.target.value.replace(/[^\d.,]/g, '').replace(',', '.'),
                }))}
                placeholder="0,450"
              />
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
              {form.normalPrice && form.salePrice && Number(form.salePrice) < Number(form.normalPrice) && (
                <span style={{ display: 'block', color: 'var(--sll)', fontSize: '.78rem', textDecoration: 'line-through' }}>
                  {fcfa(Number(form.normalPrice))}
                </span>
              )}
              {fcfa(Number(form.salePrice || form.normalPrice || 0))}
            </div>
            <div className="muted" style={{ fontSize: '.76rem', marginTop: '.3rem' }}>📍 {form.city || 'Votre ville'}, {form.dept || 'département'}</div>
          </div>
        </div>
      </div>

      <div className="sticky-cta">
        <button
          className="btn block ocre"
          onClick={() => void submit()}
          disabled={Boolean(supabase) && user?.role === 'seller' && user.verificationStatus !== 'verified'}
        >
          {editId ? '💾 Enregistrer les modifications' : "🚀 Publier l'annonce"}
        </button>
      </div>
    </div>
  );
}
