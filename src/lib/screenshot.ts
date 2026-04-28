"use client"

export async function captureScreenshot(): Promise<string | null> {
  try {
    const html2canvas = (await import("html2canvas")).default
    const canvas = await html2canvas(document.body, {
      ignoreElements: (el) => {
        const tag = el.tagName?.toLowerCase()
        const type = (el as HTMLInputElement).type?.toLowerCase()
        const cls = (el as HTMLElement).className || ""
        return (
          (tag === "input" && (type === "password" || type === "hidden")) ||
          (typeof cls === "string" && cls.includes("sensitive"))
        )
      },
      scale: 0.75,
      useCORS: true,
      logging: false,
    })
    return canvas.toDataURL("image/jpeg", 0.8)
  } catch {
    return null
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
