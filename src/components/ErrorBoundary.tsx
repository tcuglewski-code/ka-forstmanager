"use client"
import { Component, ErrorInfo, ReactNode } from "react"

interface Props {
  children: ReactNode
}
interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ hasError: true, error, errorInfo })
    // Auto-Report (fire-and-forget)
    fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        typ: "bug",
        severity: "blocker",
        text: `[AUTO] ${error.message}`,
        seite: typeof window !== "undefined" ? window.location.pathname : undefined,
        technicalContext: {
          errorStack: error.stack?.slice(0, 2000),
          componentStack: errorInfo.componentStack?.slice(0, 1000),
        },
      }),
    }).catch(() => {})
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] gap-4 p-8">
          <h2 className="text-lg font-semibold text-red-600">
            Etwas ist schiefgelaufen
          </h2>
          <p className="text-sm text-gray-500">
            Ein Fehlerbericht wurde automatisch gesendet.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded-lg"
            style={{ backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }}
          >
            Seite neu laden
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
