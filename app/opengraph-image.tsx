import { ImageResponse } from "next/og";

export const alt = "BrainStats – AI-driven fotbollsanalys";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          padding: "72px",
          background: "linear-gradient(145deg, #050505 0%, #0a1a0f 55%, #050505 100%)",
          color: "#FAFAF8",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "4px",
            fontSize: 88,
            fontWeight: 800,
            letterSpacing: "-0.03em",
          }}
        >
          <span>Brain</span>
          <span style={{ color: "#18ff6d" }}>Stats</span>
        </div>

        <p
          style={{
            marginTop: 28,
            maxWidth: 760,
            fontSize: 36,
            lineHeight: 1.35,
            color: "#A9A9A9",
          }}
        >
          AI-driven fotbollsanalys — matcher, form, tabell och risker
        </p>
      </div>
    ),
    { ...size }
  );
}
