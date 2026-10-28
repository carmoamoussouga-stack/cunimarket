import { useMemo } from 'react';
import { boundsAround, projectToMap } from '../lib/geo';
import type { GeoPoint } from '../types';

type Pin = GeoPoint & { id: string; label: string; accent?: boolean };

export default function NearbyMap({
  pins,
  user,
  onSelect,
}: {
  pins: Pin[];
  user: GeoPoint | null;
  onSelect?: (id: string) => void;
}) {
  const bounds = useMemo(() => {
    const pts: GeoPoint[] = [...pins];
    if (user) pts.push(user);
    if (pts.length === 0) return { minLat: 6.3, maxLat: 6.55, minLng: 2.3, maxLng: 2.7 };
    return boundsAround(pts);
  }, [pins, user]);

  return (
    <div className="geo-map" aria-label="Carte des producteurs">
      {user && (
        <button
          type="button"
          className="geo-pin you"
          style={{
            left: `${projectToMap(user, bounds).x}%`,
            top: `${projectToMap(user, bounds).y}%`,
          }}
          title="Vous"
        >
          <span>Vous</span>
        </button>
      )}
      {pins.map((p) => {
        const { x, y } = projectToMap(p, bounds);
        return (
          <button
            key={p.id}
            type="button"
            className={`geo-pin${p.accent ? ' accent' : ''}`}
            style={{ left: `${x}%`, top: `${y}%` }}
            title={p.label}
            onClick={() => onSelect?.(p.id)}
          >
            🐇
          </button>
        );
      })}
    </div>
  );
}
