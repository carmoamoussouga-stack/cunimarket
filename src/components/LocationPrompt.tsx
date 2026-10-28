import { useState } from 'react';
import { requestPosition } from '../lib/geo';
import { useApp } from '../store/context';

export default function LocationPrompt() {
  const { coords, locationAsked, setCoords, setLocationAsked, showToast, user } = useApp();
  const [busy, setBusy] = useState(false);

  if (coords || locationAsked) return null;

  const who = user?.role === 'seller' ? 'producteur' : user?.role === 'buyer' ? 'acheteur' : 'visiteur';

  const activate = async () => {
    setBusy(true);
    try {
      const pos = await requestPosition();
      setCoords(pos);
      showToast('Localisation activée');
    } catch {
      setLocationAsked(true);
      showToast('Localisation refusée — vous pourrez l’activer plus tard', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="loc-banner">
      <div>
        <div style={{ fontFamily: 'var(--fd)', fontWeight: 800, fontSize: '.88rem', color: 'var(--gd)' }}>
          📍 Trouvez les producteurs proches
        </div>
        <p className="muted" style={{ fontSize: '.75rem', marginTop: '.15rem' }}>
          {who === 'producteur'
            ? 'Activez-la pour situer votre ferme et aider les acheteurs à vous trouver.'
            : 'Activez-la pour calculer les distances et repérer les producteurs proches.'}
        </p>
      </div>
      <div style={{ display: 'flex', gap: '.4rem', flexShrink: 0 }}>
        <button className="btn ocre" style={{ padding: '.45rem .7rem', fontSize: '.75rem' }} onClick={() => void activate()} disabled={busy}>
          {busy ? '…' : '🔵 Activer'}
        </button>
      </div>
    </div>
  );
}
