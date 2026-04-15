"use client"
import { useState, useCallback } from "react"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"

interface ConfirmOptions {
  title: string
  message: string
  danger?: boolean
  confirmLabel?: string
}

export function useConfirm() {
  const [state, setState] = useState<{
    options: ConfirmOptions
    resolve: (value: boolean) => void
  } | null>(null)

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ options, resolve })
    })
  }, [])

  const handleConfirm = useCallback(() => {
    state?.resolve(true)
    setState(null)
  }, [state])

  const handleCancel = useCallback(() => {
    state?.resolve(false)
    setState(null)
  }, [state])

  const ConfirmDialogElement = state ? (
    <ConfirmDialog
      open={true}
      title={state.options.title}
      message={state.options.message}
      danger={state.options.danger}
      confirmLabel={state.options.confirmLabel}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  ) : null

  return { confirm, ConfirmDialogElement }
}
