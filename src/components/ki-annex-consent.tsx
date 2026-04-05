'use client';

import { useState, useEffect } from 'react';

interface KiAnnexConsentProps {
  onConsent: (accepted: boolean) => void;
  className?: string;
}

const KI_ANNEX_CONSENT_KEY = 'ki-annex-consent-accepted';

export function useKiAnnexConsent() {
  const [hasConsented, setHasConsented] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(KI_ANNEX_CONSENT_KEY);
    setHasConsented(stored === 'true');
    setIsLoading(false);
  }, []);

  const grantConsent = () => {
    localStorage.setItem(KI_ANNEX_CONSENT_KEY, 'true');
    localStorage.setItem('ki-annex-consent-date', new Date().toISOString());
    setHasConsented(true);
  };

  const revokeConsent = () => {
    localStorage.removeItem(KI_ANNEX_CONSENT_KEY);
    localStorage.removeItem('ki-annex-consent-date');
    setHasConsented(false);
  };

  return { hasConsented, isLoading, grantConsent, revokeConsent };
}

export function KiAnnexConsentCheckbox({ onConsent, className }: KiAnnexConsentProps) {
  const [checked, setChecked] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChecked(e.target.checked);
    onConsent(e.target.checked);
  };

  return (
    <div className={`flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg ${className || ''}`}>
      <input
        type="checkbox"
        id="ki-annex-consent"
        checked={checked}
        onChange={handleChange}
        className="mt-1 h-4 w-4 rounded border-gray-300 text-[#2C3A1C] focus:ring-[#2C3A1C]"
      />
      <label htmlFor="ki-annex-consent" className="text-sm text-gray-700">
        Ich habe die{' '}
        <a href="/agb#ki-annex" className="text-[#C5A55A] underline hover:text-[#2C3A1C]" target="_blank" rel="noopener noreferrer">
          KI-Nutzungsbedingungen (Anlage 2 der AGB)
        </a>{' '}
        gelesen und akzeptiere diese.
      </label>
    </div>
  );
}

export function KiAnnexConsentModal({ onClose }: { onClose: () => void }) {
  const { grantConsent } = useKiAnnexConsent();
  const [accepted, setAccepted] = useState(false);

  const handleAccept = () => {
    if (accepted) {
      grantConsent();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-lg font-bold text-[#2C3A1C] mb-4">KI-Nutzungsbedingungen</h2>
        <p className="text-sm text-gray-600 mb-4">
          Dieses Feature nutzt Künstliche Intelligenz (EU AI Act: Limited Risk).
          Bitte bestätigen Sie die KI-Nutzungsbedingungen vor der ersten Verwendung.
        </p>
        <KiAnnexConsentCheckbox onConsent={setAccepted} className="mb-4" />
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
            Abbrechen
          </button>
          <button
            onClick={handleAccept}
            disabled={!accepted}
            className="px-4 py-2 text-sm bg-[#2C3A1C] text-white rounded-lg hover:bg-[#3d4f2a] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Bestätigen
          </button>
        </div>
      </div>
    </div>
  );
}
