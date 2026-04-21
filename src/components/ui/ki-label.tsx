'use client';

import React from 'react';

type KiLabelVariant = 'banner' | 'inline' | 'badge';

interface KiLabelProps {
  variant?: KiLabelVariant;
  featureName?: string;
  className?: string;
}

export function KiLabel({ variant = 'inline', featureName, className }: KiLabelProps) {
  const featureText = featureName ? ` (${featureName})` : '';

  if (variant === 'banner') {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 ${className || ''}`}>
        <div className="flex items-center gap-2">
          <span className="text-blue-600 text-sm font-medium">🤖 KI-gestützt{featureText}</span>
        </div>
        <p className="text-xs text-blue-500 mt-1">
          Dieses Feature nutzt Künstliche Intelligenz (EU AI Act: Limited Risk, Art. 52).
          Ergebnisse sind maschinell generiert und unverbindlich. Bitte prüfen Sie alle Angaben.
        </p>
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-full border border-blue-200 ${className || ''}`}>
        🤖 KI
      </span>
    );
  }

  // inline variant (default)
  return (
    <span className={`inline-flex items-center gap-1 text-xs text-blue-500 ${className || ''}`}>
      <span>🤖</span>
      <span>KI-generiert — Angaben unverbindlich</span>
    </span>
  );
}

export function KiDisclaimer({ className }: { className?: string }) {
  return (
    <p className={`text-xs text-gray-400 mt-2 ${className || ''}`}>
      ⚠️ KI-Hinweis gemäß EU AI Act Art. 52: Diese Inhalte wurden mit Unterstützung von Künstlicher Intelligenz
      erstellt. Das System ist als &quot;Limited Risk&quot; klassifiziert. Alle Empfehlungen sind unverbindlich und
      ersetzen keine fachkundige Beratung.
    </p>
  );
}

export function KiOptOutToggle({
  enabled,
  onToggle
}: {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-white border rounded-lg">
      <div>
        <h4 className="text-sm font-medium text-gray-900">KI-Funktionen</h4>
        <p className="text-xs text-gray-500">Betriebs-Assistent, Protokoll-Zusammenfassung, Anomalie-Erkennung</p>
      </div>
      <button
        onClick={() => onToggle(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? 'bg-forest' : 'bg-gray-200'
        }`}
        role="switch"
        aria-checked={enabled}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
