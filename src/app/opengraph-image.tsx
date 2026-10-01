import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { SITE_HOST } from "@/lib/site";

export const alt =
  "Discover Manipur: floating islands, cloud-caught hills and a thousand-year weave";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Brand tokens, inlined because the OG renderer has no access to the stylesheet. */
const LOKTAK_900 = "#052527";
const KANGLA_400 = "#ddbd55";
const CREAM_50 = "#faf6ec";
const CREAM_200 = "#e6dcc6";

export default async function OpengraphImage() {
  const photo = await readFile(join(process.cwd(), "public/file-uploads/lok1.jpg"));
  const photoSrc = `data:image/jpeg;base64,${photo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundColor: LOKTAK_900,
          color: CREAM_50,
        }}
      >
        {/* Photograph */}
        <img
          src={photoSrc}
          alt=""
          width={1200}
          height={630}
          style={{
            position: "absolute",
            inset: 0,
            width: "1200px",
            height: "630px",
            objectFit: "cover",
          }}
        />

        {/* Ink wash so the type always holds contrast */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage: `linear-gradient(100deg, ${LOKTAK_900} 24%, rgba(5,37,39,0.88) 52%, rgba(5,37,39,0.42) 100%)`,
          }}
        />

        {/* Content */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "72px 80px",
            width: "780px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div style={{ display: "flex", width: "64px", height: "4px", backgroundColor: KANGLA_400 }} />
            <div
              style={{
                display: "flex",
                fontSize: 22,
                letterSpacing: "0.26em",
                textTransform: "uppercase",
                color: CREAM_200,
              }}
            >
              Discover Manipur
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: 82,
                lineHeight: 1.02,
                letterSpacing: "-0.035em",
                fontWeight: 600,
              }}
            >
              Floating islands,
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 82,
                lineHeight: 1.02,
                letterSpacing: "-0.035em",
                fontWeight: 600,
                color: KANGLA_400,
              }}
            >
              cloud-caught hills.
            </div>
            <div
              style={{
                display: "flex",
                marginTop: "26px",
                fontSize: 30,
                lineHeight: 1.45,
                color: CREAM_200,
                maxWidth: "620px",
              }}
            >
              Local homestays, guided experiences, real food and an AI concierge for planning a
              journey through Manipur.
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div
              style={{
                display: "flex",
                padding: "10px 22px",
                borderRadius: "999px",
                border: `1px solid ${KANGLA_400}`,
                color: KANGLA_400,
                fontSize: 22,
              }}
            >
              {SITE_HOST}
            </div>
            <div style={{ display: "flex", fontSize: 22, color: CREAM_200 }}>
              The Land of Jewels
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
