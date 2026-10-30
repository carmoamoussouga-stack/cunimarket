import { useCallback, useEffect, useState } from 'react';
import TopBar from '../../components/TopBar';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../store/context';

type Report = {
  id: string;
  reason: string;
  status: string;
  created_at: string;
  listing_id: string;
  listing_title: string | null;
};

export default function AdminReports() {
  const { showToast } = useApp();

  const [reports, setReports] = useState<Report[]>([]);
  // `supabase` est une constante : dérivé au rendu, pas dans l'effet.
  const [loading, setLoading] = useState(() => supabase !== null);
  const [loadError, setLoadError] = useState<string | null>(() =>
    supabase ? null : 'Supabase non configuré.',
  );
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const db = supabase;
    if (!db) return;

    let cancelled = false;

    // En deux temps, sans embed : la table des titres est lue à part, pour
    // ne pas dépendre du nom exact de la clé étrangère dans votre base.
    const load = async () => {
      const { data, error } = await db
        .from('listing_reports')
        .select('id, reason, status, created_at, listing_id')
        .order('created_at', { ascending: false })
        .limit(100);

      if (cancelled) return;
      if (error) {
        setLoading(false);
        setLoadError(error.message);
        return;
      }

      const rows = (data ?? []) as Omit<Report, 'listing_title'>[];
      const ids = [...new Set(rows.map((r) => r.listing_id))];

      let titles = new Map<string, string>();
      if (ids.length > 0) {
        const { data: listingRows } = await db
          .from('listings')
          .select('id, title')
          .in('id', ids);
        if (cancelled) return;
        titles = new Map(
          ((listingRows ?? []) as { id: string; title: string }[]).map((l) => [l.id, l.title]),
        );
      }

      setLoading(false);
      setReports(
        rows.map((r) => ({ ...r, listing_title: titles.get(r.listing_id) ?? null })),
      );
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const close = useCallback(
    async (report: Report) => {
      const db = supabase;
      if (!db || busyId) return;

      setBusyId(report.id);
      setReports((prev) => prev.filter((item) => item.id !== report.id));

      const { error } = await db.from('listing_reports').update({ status: 'closed' }).eq('id', report.id);
      setBusyId(null);

      if (error) {
        setReports((prev) => [report, ...prev]);
        showToast(`Impossible de clore ce signalement : ${error.message}`, 'error');
        return;
      }

      showToast('Signalement clos.');
    },
    [busyId, showToast],
  );

  return (
    <div className="page">
      <TopBar title="Signalements" back showCart={false} />

      <div className="section">
        {loading && <div className="muted">Chargement…</div>}

        {!loading && loadError && (
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ color: 'var(--er)', fontSize: '.85rem' }}>❌ {loadError}</div>
          </div>
        )}

        {!loading && !loadError && reports.length === 0 && (
          <div className="empty">
            <div className="ico">🚩</div>
            <div style={{ fontFamily: 'var(--fd)', fontWeight: 700, color: 'var(--gd)' }}>
              Aucun signalement
            </div>
            <div className="muted" style={{ fontSize: '.8rem', marginTop: '.3rem' }}>
              Rien à traiter pour l’instant.
            </div>
          </div>
        )}

        {!loading && !loadError && reports.length > 0 && (
          <div className="card">
            {reports.map((report) => (
              <div key={report.id} className="list-row" style={{ alignItems: 'flex-start' }}>
                <div style={{ fontSize: '1.2rem', paddingTop: '.15rem' }}>🚩</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--fd)', fontWeight: 700, fontSize: '.85rem', color: 'var(--gd)' }}>
                    {report.listing_title ?? 'Annonce supprimée'}
                  </div>
                  <div style={{ fontSize: '.78rem', marginTop: '.15rem' }}>{report.reason}</div>
                  <div className="muted" style={{ fontSize: '.68rem', marginTop: '.2rem' }}>
                    {new Date(report.created_at).toLocaleString('fr-FR')} · {report.status}
                  </div>
                </div>
                <button className="btn ghost" disabled={busyId !== null} onClick={() => void close(report)}>
                  Clore
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
