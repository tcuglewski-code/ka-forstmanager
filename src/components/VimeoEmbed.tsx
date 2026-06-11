interface VimeoEmbedProps {
  videoId: string
  title: string
}

export function VimeoEmbed({ videoId, title }: VimeoEmbedProps) {
  const isPlaceholder = videoId === "PLACEHOLDER" || !/^\d+$/.test(videoId)

  if (isPlaceholder) {
    return (
      <div
        data-vimeo-id="PLACEHOLDER"
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "16 / 9",
          background: "#1A2E1A",
          borderRadius: 12,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          color: "rgba(247, 246, 240, 0.7)",
        }}
      >
        {/* Schaltplan-Hintergrund */}
        <svg
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            opacity: 0.35,
          }}
          viewBox="0 0 400 225"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
        >
          <path
            d="M0 60 H120 L150 90 H250 L280 60 H400 M0 165 H100 L130 135 H270 L300 165 H400"
            stroke="rgba(140, 170, 31, 0.35)"
            strokeWidth="1"
            strokeDasharray="4 8"
          />
          <circle cx="150" cy="90" r="3" fill="#8CAA1F" opacity="0.6" />
          <circle cx="280" cy="60" r="3" fill="#C5A55A" opacity="0.6" />
          <circle cx="130" cy="135" r="3" fill="#C5A55A" opacity="0.6" />
          <circle cx="300" cy="165" r="3" fill="#8CAA1F" opacity="0.6" />
        </svg>

        {/* Feldhub F-Monogram */}
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 52,
            height: 52,
            borderRadius: 14,
            background: "rgba(247, 246, 240, 0.06)",
            border: "1px solid rgba(247, 246, 240, 0.14)",
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: 20,
            fontWeight: 700,
            color: "#C5A55A",
          }}
        >
          F
        </div>
        <div
          style={{
            position: "relative",
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "rgba(247, 246, 240, 0.55)",
          }}
        >
          Video folgt in Kürze
        </div>
        <div
          style={{
            position: "relative",
            fontSize: 11,
            color: "rgba(247, 246, 240, 0.4)",
            maxWidth: "80%",
            textAlign: "center",
          }}
        >
          {title}
        </div>
      </div>
    )
  }

  return (
    <div
      data-vimeo-id={videoId}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "16 / 9",
        borderRadius: 12,
        overflow: "hidden",
        background: "#000",
      }}
    >
      <iframe
        src={`https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0`}
        title={title}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          border: 0,
        }}
      />
    </div>
  )
}
