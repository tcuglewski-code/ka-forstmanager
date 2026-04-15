/**
 * TableSkeleton — Skeleton Loading für Datentabellen
 * Design Playbook: Skeleton statt Spinner für bessere wahrgenommene Performance
 */

interface TableSkeletonProps {
  rows?: number;
  cols?: number;
}

export function TableSkeleton({ rows = 5, cols = 4 }: TableSkeletonProps) {
  return (
    <div className="animate-pulse" role="status" aria-label="Daten werden geladen">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4 px-4 py-3 border-b"
          style={{ borderColor: 'var(--color-outline-variant)' }}
        >
          {Array.from({ length: cols }).map((_, j) => (
            <div
              key={j}
              className={`h-4 rounded ${
                j === 0 ? 'w-1/4' : j === cols - 1 ? 'w-1/6' : 'w-1/3'
              }`}
              style={{ backgroundColor: 'var(--color-surface-container-high)' }}
            />
          ))}
        </div>
      ))}
      <span className="sr-only">Laden...</span>
    </div>
  );
}

/**
 * CardSkeleton — Skeleton für Card-Layouts
 */
export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4" role="status" aria-label="Inhalte werden geladen">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl p-6 animate-pulse"
          style={{ backgroundColor: 'var(--color-surface-container-low)' }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-10 h-10 rounded-lg"
              style={{ backgroundColor: 'var(--color-surface-container-high)' }}
            />
            <div className="flex-1 space-y-2">
              <div
                className="h-4 w-2/3 rounded"
                style={{ backgroundColor: 'var(--color-surface-container-high)' }}
              />
              <div
                className="h-3 w-1/2 rounded"
                style={{ backgroundColor: 'var(--color-surface-container-high)' }}
              />
            </div>
          </div>
        </div>
      ))}
      <span className="sr-only">Laden...</span>
    </div>
  );
}

/**
 * StatCardSkeleton — Skeleton für Dashboard-Statistik-Karten
 */
export function StatCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4" role="status" aria-label="Statistiken werden geladen">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl p-5 animate-pulse"
          style={{ backgroundColor: 'var(--color-surface-container-low)' }}
        >
          <div
            className="w-8 h-8 rounded-lg mb-3"
            style={{ backgroundColor: 'var(--color-surface-container-high)' }}
          />
          <div
            className="h-3 w-2/3 rounded mb-2"
            style={{ backgroundColor: 'var(--color-surface-container-high)' }}
          />
          <div
            className="h-6 w-1/2 rounded"
            style={{ backgroundColor: 'var(--color-surface-container-high)' }}
          />
        </div>
      ))}
      <span className="sr-only">Laden...</span>
    </div>
  );
}

export default TableSkeleton;
