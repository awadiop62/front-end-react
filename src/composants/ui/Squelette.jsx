export function Squelette({ width = '100%', height = '16px', radius = 'var(--radius-sm)', className = '', style = {} }) {
  return (
    <span
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div
      className="skeleton-card"
      style={{
        padding: 'var(--space-lg)',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-sm)',
      }}
      aria-hidden="true"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Squelette height="18px" width="100px" radius="var(--radius-sm)" />
        <Squelette height="22px" width="80px" radius="999px" />
      </div>
      <Squelette height="24px" width="75%" radius="var(--radius-sm)" style={{ margin: '4px 0' }} />
      <Squelette height="14px" width="95%" />
      <Squelette height="14px" width="85%" />
      <div style={{ display: 'flex', gap: 'var(--space-xs)', marginTop: 'var(--space-xs)' }}>
        <Squelette height="22px" width="70px" radius="999px" />
        <Squelette height="22px" width="90px" radius="999px" />
      </div>
    </div>
  );
}

export function GallerySkeleton() {
  return (
    <div className="gallery-skeleton" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Stepper skeleton */}
      <Squelette height="64px" width="100%" radius="var(--radius-md)" style={{ marginBottom: 'var(--space-lg)' }} />

      {/* Header skeleton */}
      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <Squelette height="14px" width="180px" style={{ marginBottom: '8px' }} />
        <Squelette height="32px" width="300px" style={{ marginBottom: '8px' }} />
        <Squelette height="16px" width="400px" />
      </div>

      {/* KPI Bar Skeleton */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-md)',
          padding: 'var(--space-md)',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
          marginBottom: 'var(--space-lg)',
        }}
      >
        <Squelette height="20px" width="30%" />
        <Squelette height="20px" width="30%" />
        <Squelette height="20px" width="30%" />
      </div>

      {/* Search & Filter bar skeleton */}
      <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)', flexWrap: 'wrap' }}>
        <Squelette height="42px" width="280px" radius="var(--radius-md)" />
        <Squelette height="42px" width="200px" radius="var(--radius-md)" />
      </div>

      {/* Cards Grid Skeleton */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 'var(--space-lg)',
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

export function ProjectDetailSkeleton() {
  return (
    <div className="project-detail-skeleton" style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Stepper skeleton */}
      <Squelette height="64px" width="100%" radius="var(--radius-md)" style={{ marginBottom: 'var(--space-lg)' }} />

      {/* Top nav skeleton */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
        <Squelette height="40px" width="180px" radius="var(--radius-md)" />
        <Squelette height="40px" width="160px" radius="var(--radius-md)" />
      </div>

      {/* Card Content Skeleton */}
      <div
        style={{
          padding: 'var(--space-xl)',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-md)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Squelette height="14px" width="140px" />
          <Squelette height="24px" width="90px" radius="999px" />
        </div>

        <Squelette height="36px" width="60%" radius="var(--radius-sm)" />

        <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
          <Squelette height="24px" width="80px" radius="999px" />
          <Squelette height="24px" width="110px" radius="999px" />
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 'var(--space-xs) 0' }} />

        <Squelette height="20px" width="200px" />
        <Squelette height="16px" width="100%" />
        <Squelette height="16px" width="92%" />
        <Squelette height="16px" width="88%" />

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 'var(--space-xs) 0' }} />

        <Squelette height="20px" width="180px" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Squelette height="20px" width="220px" />
          <Squelette height="20px" width="190px" />
          <Squelette height="20px" width="240px" />
        </div>
      </div>
    </div>
  );
}

export function ResultsSkeleton() {
  return (
    <div className="results-skeleton" style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header skeleton */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
        <Squelette height="14px" width="200px" style={{ margin: '0 auto 8px auto' }} />
        <Squelette height="36px" width="340px" style={{ margin: '0 auto 8px auto' }} />
        <Squelette height="16px" width="260px" style={{ margin: '0 auto' }} />
      </div>

      {/* KPI Cards Skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        <Squelette height="100px" width="100%" radius="var(--radius-md)" />
        <Squelette height="100px" width="100%" radius="var(--radius-md)" />
        <Squelette height="100px" width="100%" radius="var(--radius-md)" />
      </div>

      {/* Podium Cards Skeleton */}
      <div
        style={{
          padding: 'var(--space-xl)',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-md)',
        }}
      >
        <Squelette height="24px" width="200px" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <Squelette height="36px" width="36px" radius="50%" />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Squelette height="18px" width="180px" />
                <Squelette height="18px" width="60px" />
              </div>
              <Squelette height="12px" width="100%" radius="999px" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PageSpinner({ label = 'Chargement en cours…' }) {
  return (
    <div className="page-spinner" role="status">
      <span className="page-spinner__ring" aria-hidden="true" />
      <span className="text-caption">{label}</span>
    </div>
  );
}
