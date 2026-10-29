import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { useAdminRole } from '../hooks/useAdminRole';
import { supabase } from '../lib/supabase';
import { fcfa, useApp } from '../store/context';

type PendingListing = {
  id: string;
  title: string;
  price: number;
  city: string;
  seller_name: string | null;
};

export default function Admin() {
  const role = useAdminRole();
  const { showToast } = useApp();

  const [listings, setListings] = useState<PendingListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  /* ── Chargement des annonces en attente ─────────────── */

  // Réinitialise l'état de chargement quand le rôle change (connexion/déconnexion).
  const [seenRole, setSeenRole] = useState(role);
  if (seenRole !== role) {
    setSeenRole(role);
    setLoading(role === 'admin');
    setLoadError(null);
    setListings([]);
  }

  useEffect(() => {
    const db = supabase;
    if (role !== 'admin' || !db) return;

    let cancelled = false;

    void db
      .from('listings')
      .select('id, title, price, city, seller_name')
      .eq('verification_status', 'pending')
      .then(({ data, error }) => {
        if (cancelled) return;
        setLoading(false);
        if (error) {
          setLoadError(error.message);
          return;
        }
        setListings((data ?? []) as PendingListing[]);
      });

    return () => {
      cancelled = true;
    };
  }, [role]);

  /* ── Validation / rejection ─────────────────────────── */
  const decide = useCallback(
    async (listing: PendingListing, next: 'verified' | 'rejected') => {
      const db = supabase;
      if (!db || busyId) return;

      const label = next === 'verified' ? 'valider' : 'rejeter';
      setBusyId(listing.id);
      // Retrait optimiste : l'annonce disparaît tout de suite de la liste.
      setListings((prev) => prev.filter((item) => item.id !== listing.id));

      const { error } = await db.from('listings').update({ verification_status: next }).eq('id', listing.id);
      setBusyId(null);

      if (error) {
        // On remet l'annonce en tête de liste pour que l'admin puisse réessayer.
        setListings((prev) => [listing, ...prev]);
        showToast(`Impossible de ${label} cette annonce : ${error.message}`, 'error');
        return;
      }

      showToast(next === 'verified' ? 'Annonce validée, elle est maintenant visible.' : 'Annonce rejetée.');
    },
    [busyId, showToast],
  );

  /* ── Garde d'accès (le routeur protège aussi via RequireAdmin) ── */
  if (role === 'loading') {
    return (
      <div className="page">
        <TopBar title="Modération" back showCart={false} />
        <div className="section muted">Vérification des droits…</div>
      </div>
    );
  }

  if (role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  /* ── Rendu ──────────────────────────────────────────── */
  return (
    <div className="page">
      <TopBar title="Modération" back showCart={false} />

      <div className="section">
        <div className="section-title">
          <span>Annonces en attente</span>
          <span className="chip">{listings.length} en attente</span>
        </div>

        {loading && <div className="muted">Chargement des annonces…</div>}

        {!loading && loadError && (
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ color: 'var(--er)', fontSize: '.85rem', marginBottom: '.6rem' }}>
              ❌ Chargement impossible : {loadError}
            </div>
            <button className="btn ghost" onClick={() => window.location.reload()}>
              Réessayer
            </button>
          </div>
        )}

        {!loading && !loadError && listings.length === 0 && (
          <div className="empty">
            <div className="ico">🎉</div>
            <div style={{ fontFamily: 'var(--fd)', fontWeight: 700, color: 'var(--gd)' }}>
              Aucune annonce en attente
            </div>
            <div className="muted" style={{ fontSize: '.8rem', marginTop: '.3rem' }}>
              Tout est à jour, revenez un peu plus tard.
            </div>
          </div>
        )}

        {!loading && !loadError && listings.length > 0 && (
          <div className="card">
            {listings.map((listing) => (
              <div key={listing.id} className="list-row">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: 'var(--fd)',
                      fontWeight: 700,
                      fontSize: '.88rem',
                      color: 'var(--gd)',
                    }}
                  >
                    {listing.title}
                  </div>
                  <div className="muted" style={{ fontSize: '.74rem' }}>
                    {listing.seller_name ?? 'Vendeur inconnu'} · {listing.city}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--fd)',
                      fontWeight: 800,
                      fontSize: '.82rem',
                      color: 'var(--oc)',
                    }}
                  >
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
