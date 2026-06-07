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
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.35) 100%)",
          border: "1px dashed rgba(197, 165, 90, 0.4)",
          borderRadius: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          color: "rgba(244, 239, 230, 0.7)",
        }}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M23 7l-7 5 7 5V7z" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
        <div style={{ fontSize: 13, letterSpacing: "0.04em" }}>
          Video wird geladen …
        </div>
        <div style={{ fontSize: 11, opacity: 0.55, fontStyle: "italic" }}>
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
        borderRadius: 10,
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
