"use client"

import { useState, useCallback } from "react"

interface UnternehmerCheckboxProps {
  /** Called whenever the checkbox value changes */
  onChange?: (value: { checked: boolean; timestamp: Date | null }) => void
  /** External error message to display */
  error?: string
  /** Additional CSS classes for the wrapper div */
  className?: string
}

/**
 * B2B Unternehmererklärung Checkbox (§14 BGB)
 *
 * Reusable component for registration/checkout forms.
 * Records the timestamp when the user checks the box.
 *
 * Usage:
 * ```tsx
 * const [unternehmer, setUnternehmer] = useState({ checked: false, timestamp: null });
 * <UnternehmerCheckbox onChange={setUnternehmer} />
 * ```
 */
export default function UnternehmerCheckbox({
  onChange,
  error,
  className = "",
}: UnternehmerCheckboxProps) {
  const [checked, setChecked] = useState(false)
  const [internalError, setInternalError] = useState("")

  const displayError = error || internalError

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const isChecked = e.target.checked
      const timestamp = isChecked ? new Date() : null

      setChecked(isChecked)
      setInternalError("")

      onChange?.({ checked: isChecked, timestamp })
    },
    [onChange]
  )

  /** Call this externally via ref or before form submission to validate */
  const validate = useCallback(() => {
    if (!checked) {
      setInternalError(
        "Bitte bestätigen Sie die Unternehmererklärung, um fortzufahren."
      )
      return false
    }
    return true
  }, [checked])

  // Expose validate for parent forms that hold a ref
  // For simple usage, parents can just check the onChange value
  void validate

  return (
    <div className={`space-y-1 ${className}`}>
      <label className="flex items-start gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          className="mt-0.5 h-5 w-5 rounded border-border bg-[#0f0f0f] text-emerald-500 focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-0 transition-colors flex-shrink-0"
          aria-required="true"
          aria-invalid={!!displayError}
          aria-describedby={displayError ? "unternehmer-error" : undefined}
        />
        <span className="text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors leading-relaxed">
          Ich tätige diese Bestellung als Unternehmer (§14 BGB)
        </span>
      </label>
      {displayError && (
        <p
          id="unternehmer-error"
          className="text-sm text-red-400 ml-8"
          role="alert"
        >
          {displayError}
        </p>
      )}
    </div>
  )
}
