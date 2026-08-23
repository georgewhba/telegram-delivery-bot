export function LoadingSpinner({ centered = true }: { centered?: boolean }) {
  if (centered) {
    return (
      <div className="spinner-center">
        <div className="spinner" />
      </div>
    );
  }
  return <div className="spinner" />;
}

/** Skeleton placeholder rows for tables while data loads (used instead of a spinner per design spec) */
export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div style={{ padding: 16 }}>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="skeleton" style={{ height: 18, flex: c === 0 ? 2 : 1 }} />
          ))}
        </div>
      ))}
    </div>
  );
}
