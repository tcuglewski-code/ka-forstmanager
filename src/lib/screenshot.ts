"use client"

export async function captureScreenshot(): Promise<{dataUrl: string | null; error: string | null}> {
  try {
    const html2canvas = (await import("html2canvas")).default
    const canvas = await html2canvas(document.documentElement, {
      allowTaint: true,
      useCORS: true,
      scale: 0.6,
      logging: false,
      windowWidth: document.documentElement.scrollWidth,
      windowHeight: document.documentElement.scrollHeight,
      ignoreElements: (el) => {
        const tag = el.tagName?.toLowerCase()
        const type = (el as HTMLInputElement).type?.toLowerCase()
        const cls = String((el as HTMLElement).className || "")
        return (
          (tag === "input" && (type === "password" || type === "hidden")) ||
          cls.includes("sensitive") ||
          tag === "iframe"
        )
      },
    })
    return { dataUrl: canvas.toDataURL("image/jpeg", 0.75), error: null }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[screenshot] html2canvas failed:", msg)
    return { dataUrl: null, error: msg }
  }
}

export async function uploadScreenshot(dataUrl: string): Promise<string | null> {
  try {
    const res = await fetch(dataUrl)
    const blob = await res.blob()
    const file = new File([blob], `debug-screenshot-${Date.now()}.jpg`, { type: "image/jpeg" })

    const form = new FormData()
    form.append("file", file)
    form.append("context", "debug-screenshot")

    const uploadRes = await fetch("/api/upload", {
      method: "POST",
      body: form,
    })

    if (!uploadRes.ok) return null
    const data = await uploadRes.json()
    return data.url || data.path || null
  } catch {
    return null
  }
}
