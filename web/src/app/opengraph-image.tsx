import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Doqtri — living docs into executable mindmaps";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#090a0c",
          color: "#f3f5f8",
          padding: "64px 72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 36, opacity: 0.7 }}>
          Doqtri
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 1.05,
              maxWidth: 900,
            }}
          >
            Living docs into executable mindmaps.
          </div>
          <div style={{ fontSize: 28, color: "#a4acb8", maxWidth: 760 }}>
            Planned vs shipped — verified on Stellar.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 24,
            alignItems: "center",
            fontFamily: "monospace",
            fontSize: 20,
            color: "#3dd68c",
          }}
        >
          <span>Doc → Hash → Mindmap → Build → Stellar</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
