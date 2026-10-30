import { useCallback, useEffect, useState } from 'react';
import TopBar from '../../components/TopBar';
import { supabase } from '../../lib/supabase';
import { fcfa, useApp } from '../../store/context';

type PendingListing = {
  id: string;
  title: string;
  price: number;
  city: string;
  seller_name: string | null;
  active: boolean;
  created_at: string;
};

type Filter = 'pending' | 'all';

export default function AdminListings() {
  const { showToast } = useApp();

  const [filter, setFilter] = useState<Filter>('pending');
  const [listings, setListings] = useState<PendingListing[]>([]);
  // Filtre dont proviennent les données affichées. L'indicateur « chargement »
  // est DÉRIVÉ au rendu (loading = ce n'est pas encore le filtre demandé),
  // plutôt que forcé par un setState dans l'effet.
  const [loadedFilter, setLoadedFilter] = useState<Filter | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const db = supabase;
    if (!db) return;

    let cancelled = false;

    let query = db
      .from('listings')
      .select('id, title, price, city, seller_name, active, created_at')
      .order('created_at', { ascending: false })
      .limit(100);
    if (filter === 'pending') query = query.eq('verification_status', 'pending');

    void query.then(({ data, error }) => {
      if (cancelled) return;
      if (error) {
        setLoadError(error.message);
        setLoadedFilter(filter);
        return;
      }
      setListings((data ?? []) as PendingListing[]);
      setLoadError(null);
      setLoadedFilter(filter);
    });

    return () => {
      cancelled = true;
    };
  }, [filter]);

  const loading = supabase !== null && loadedFilter !== filter;
  // Sans Supabase, on l'indique explicitement plutôt que d'afficher une liste vide.
  const shownError = supabase ? loadError : 'Supabase non configuré.';

  const decide = useCallback(
    async (listing: PendingListing, next: 'verified' | 'rejected') => {
      const db = supabase;
      if (!db || busyId) return;

      const label = next === 'verified' ? 'valider' : 'rejeter';
      setBusyId(listing.id);
      if (filter === 'pending') {
        setListings((prev) => prev.filter((item) => item.id !== listing.id));
      }

      const { error } = await db.from('listings').update({ verification_status: next }).eq('id', listing.id);
      setBusyId(null);

      if (error) {
        if (filter === 'pending') setListings((prev) => [listing, ...prev]);
        showToast(`Impossible de ${label} cette annonce : ${error.message}`, 'error');
        return;
      }

      showToast(next === 'verified' ? 'Annonce validée, elle est maintenant visible.' : 'Annonce rejetée.');
      if (filter === 'all') {
        setListings((prev) => prev.map((l) => (l.id === listing.id ? { ...l } : l)));
      }
    },
    [busyId, filter, showToast],
  );

  return (
    <div className="page">
      <TopBar title="Annonces" back showCart={false} />

      <div className="section">
        <div className="tabs" style={{ marginBottom: '1rem' }}>
          <button className={filter === 'pending' ? 'active' : ''} onClick={() => setFilter('pending')}>
            En attente
          </button>
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
            Toutes
          </button>
        </div>

        {loading && <div className="muted">Chargement…</div>}

        {!loading && shownError && (
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ color: 'var(--er)', fontSize: '.85rem' }}>❌ {shownError}</div>
          </div>
        )}

        {!loading && !shownError && listings.length === 0 && (
          <div className="empty">
            <div className="ico">🎉</div>
            <div style={{ fontFamily: 'var(--fd)', fontWeight: 700, color: 'var(--gd)' }}>
              {filter === 'pending' ? 'Aucune annonce en attente' : 'Aucune annonce'}
            </div>
          </div>
        )}

        {!loading && !shownError && listings.length > 0 && (
          <div className="card">
            {listings.map((listing) => (
              <div key={listing.id} className="list-row">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--fd)', fontWeight: 700, fontSize: '.88rem', color: 'var(--gd)' }}>
                    {listing.title}
                  </div>
                  <div className="muted" style={{ fontSize: '.74rem' }}>
                    {listing.seller_name ?? 'Vendeur inconnu'} · {listing.city}
                    {' · '}
                    {new Date(listing.created_at).toLocaleDateString('fr-FR')}
                  </div>
                  <div style={{ fontFamily: 'var(--fd)', fontWeight: 800, fontSize: '.82rem', color: 'var(--oc)' }}>
                    {fcfa(listing.price)}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '.4rem', flexShrink: 0 }}>
                  <button
                    className="btn success"
                    disabled={busyId !== null}
                    onClick={() => void decide(listing, 'verified')}
                  >
                    Valider
                  </button>
                  <button
                    className="btn danger"
                    disabled={busyId !== null}
                    onClick={() => void decide(listing, 'rejected')}
                  >
                    Rejeter
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
