import { USE_MOCKS } from '../../api/client';

export default function DemoBanner() {
  if (!USE_MOCKS) return null;

  return (
    <div
      role="alert"
      style={{
        width: '100%',
        maxWidth: '100vw',
        boxSizing: 'border-box',
        backgroundColor: '#d97706',
        color: '#ffffff',
        padding: '8px 12px',
        textAlign: 'center',
        fontWeight: 700,
        fontSize: '11.5px',
        lineHeight: 1.35,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
        position: 'sticky',
        top: 0,
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      <span style={{ fontSize: '14px', flexShrink: 0 }}>⚠️</span>
      <span style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>
        MODE DÉMONSTRATION — Ces données ne sont pas réelles (Mocks actifs)
      </span>
    </div>
  );
}
