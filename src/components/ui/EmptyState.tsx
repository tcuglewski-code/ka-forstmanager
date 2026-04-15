/**
 * EmptyState — Konsistente Leer-Anzeige für alle Listen
 * Design Playbook: Klare Kommunikation + CTA zum Erstellen
 */

import Link from 'next/link';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = '📭',
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center min-h-[300px]">
      <span className="text-6xl mb-6" role="img" aria-hidden="true">
        {icon}
      </span>
      <h3
        className="text-lg font-semibold"
        style={{ color: 'var(--color-on-surface)' }}
      >
        {title}
      </h3>
      {description && (
        <p
          className="text-sm mt-2 max-w-sm"
          style={{ color: 'var(--color-on-surface-variant)' }}
        >
          {description}
        </p>
      )}
      {actionLabel && (
        actionHref ? (
          <Link
            href={actionHref}
            className="mt-6 inline-flex items-center px-4 py-2.5 text-sm font-medium rounded-xl transition-colors"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-on-primary)',
            }}
          >
            {actionLabel}
          </Link>
        ) : (
          <button
            onClick={onAction}
            className="mt-6 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-on-primary)',
            }}
          >
            {actionLabel}
          </button>
        )
      )}
    </div>
  );
}

export default EmptyState;
