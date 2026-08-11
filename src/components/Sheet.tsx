import type { ReactNode } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

export default function Sheet({ open, onClose, title, children }: Props) {
  if (!open) return null;
  return (
    <div
      className="sheet-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="sheet">
        <div className="sheet-handle" />
        {title && (
          <div className="row-between" style={{ marginBottom: '0.9rem' }}>
            <span style={{ fontFamily: 'var(--fd)', fontWeight: 800, color: 'var(--gd)' }}>{title}</span>
            <button className="icon-btn" onClick={onClose} aria-label="Fermer">
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
