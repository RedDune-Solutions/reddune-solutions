import { ImageResponse } from "next/og";

// Route segment config — Next.js convention for opengraph-image
export const runtime = "edge";
export const alt = "Reddune Solutions — A resposta certa.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Oasis palette tokens
const CREAM = "#f7eedb";
const PEACH = "#f3c79b";
const APRICOT = "#e89968";
const INK = "#2a1410";
const DUNE = "#a8201a";
const EMBER = "#d6422a";
const FLAME = "#ff6b3f";

// Note: @vercel/og's Satori renderer only supports the following CSS
// `display` values: `flex`, `block`, `none`, `-webkit-box`. All children
// containers must set one explicitly (no implicit `inline-block`).

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px 96px",
          background: `linear-gradient(135deg, ${CREAM} 0%, ${PEACH} 55%, ${APRICOT} 100%)`,
          position: "relative",
          fontFamily: "sans-serif",
          color: INK,
        }}
      >
        {/* Dune blob — bottom right */}
        <div
          style={{
            position: "absolute",
            right: -120,
            bottom: -180,
            width: 720,
            height: 720,
            borderRadius: 9999,
            background: `radial-gradient(circle at 30% 30%, ${FLAME}, ${DUNE} 60%, ${INK} 100%)`,
            opacity: 0.92,
            display: "flex",
          }}
        />

        {/* Sun glow — top left */}
        <div
          style={{
            position: "absolute",
            left: -160,
            top: -220,
            width: 540,
            height: 540,
            borderRadius: 9999,
            background: `radial-gradient(circle, ${EMBER} 0%, ${APRICOT} 50%, transparent 70%)`,
            opacity: 0.55,
            display: "flex",
          }}
        />

        {/* Top eyebrow */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 18,
            letterSpacing: 6,
            textTransform: "uppercase",
            fontWeight: 600,
            color: INK,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 10,
              height: 10,
              background: DUNE,
              borderRadius: 2,
            }}
          />
          <div style={{ display: "flex" }}>Reddune Solutions</div>
        </div>

        {/* Main title block */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            maxWidth: 920,
          }}
        >
          <div
            style={{
              fontSize: 124,
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: -4,
              color: INK,
              display: "flex",
              flexWrap: "wrap",
              gap: "0 20px",
            }}
          >
            <div style={{ display: "flex" }}>A</div>
            <div style={{ display: "flex", fontStyle: "italic", fontWeight: 500, color: DUNE }}>
              resposta
            </div>
            <div style={{ display: "flex" }}>certa.</div>
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 30,
              fontWeight: 500,
              color: INK,
              opacity: 0.78,
              display: "flex",
            }}
          >
            Assistência técnica, web e recuperação de dados — Algarve.
          </div>
        </div>

        {/* Bottom strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 18,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: INK,
            fontWeight: 600,
          }}
        >
          <div style={{ display: "flex" }}>Fuseta · Algarve</div>
          <div style={{ display: "flex", color: DUNE }}>www.reddunesolutions.pt</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
