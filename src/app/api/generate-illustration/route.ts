import { NextRequest, NextResponse } from "next/server";
import { getStorage } from "firebase-admin/storage";
import { db } from "@/db";
import { verifySession, getCurrentUser } from "@/lib/session";

const STORAGE_BUCKET = process.env.STORAGE_BUCKET || "wuf-medical-records";

function buildPrompt(breed: string, customization?: string): string {
  const breedDesc = breed || "mixed breed puppy";
  const base = `Generate a cute cartoon illustration of a ${breedDesc} puppy sitting happily with a big smile. The puppy should have accurate breed-specific features and coloring. Slightly wavy fluffy fur. Simple clean sitting pose with exactly 4 legs. Flat illustration style, soft pastel colors, white background, mobile app mascot style.`;

  if (customization) {
    return `${base}\n\nAdditional customization: ${customization}`;
  }
  return base;
}

export async function POST(request: NextRequest) {
  await verifySession();
  const user = await getCurrentUser();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
  }

  const { breed, customization } = await request.json();

  try {
    // Call Gemini REST API directly for image generation
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildPrompt(breed, customization) }] }],
          generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: "Gemini API error", details: err }, { status: 500 });
    }

    const data = await res.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((p: { inlineData?: { mimeType: string } }) =>
      p.inlineData?.mimeType?.startsWith("image/")
    );

    if (!imagePart?.inlineData) {
      return NextResponse.json({ error: "No image generated" }, { status: 500 });
    }

    const rawBuffer = Buffer.from(imagePart.inlineData.data, "base64");

    // Remove white background via edge flood fill (preserves white fur)
    const sharp = (await import("sharp")).default;
    const img = sharp(rawBuffer);
    const { data: pixels, info } = await img.raw().ensureAlpha().toBuffer({ resolveWithObject: true });
    const w = info.width, h = info.height;

    const visited = new Uint8Array(w * h);
    const queue: [number, number][] = [];

    function isWhitish(idx: number) {
      return pixels[idx] > 235 && pixels[idx + 1] > 235 && pixels[idx + 2] > 235;
    }
    function px(x: number, y: number) { return (y * w + x) * 4; }

    // Seed from border pixels
    for (let x = 0; x < w; x++) {
      if (isWhitish(px(x, 0))) { queue.push([x, 0]); visited[x] = 1; }
      if (isWhitish(px(x, h - 1))) { queue.push([x, h - 1]); visited[(h - 1) * w + x] = 1; }
    }
    for (let y = 0; y < h; y++) {
      if (isWhitish(px(0, y))) { queue.push([0, y]); visited[y * w] = 1; }
      if (isWhitish(px(w - 1, y))) { queue.push([w - 1, y]); visited[y * w + w - 1] = 1; }
    }

    // BFS flood fill
    while (queue.length > 0) {
      const [x, y] = queue.shift()!;
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
        if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
        const fi = ny * w + nx;
        if (visited[fi]) continue;
        if (isWhitish(px(nx, ny))) { visited[fi] = 1; queue.push([nx, ny]); }
      }
    }

    // Make edge-connected white pixels transparent
    for (let i = 0; i < w * h; i++) {
      if (visited[i]) pixels[i * 4 + 3] = 0;
    }

    const processedBuffer = await sharp(pixels, { raw: { width: w, height: h, channels: 4 } })
      .png()
      .trim()
      .toBuffer();

    // Upload to Firebase Storage
    const timestamp = Date.now();
    const storagePath = `illustrations/${user.puppyId}/puppy-${timestamp}.png`;
    const bucket = getStorage().bucket(STORAGE_BUCKET);
    const blob = bucket.file(storagePath);

    await blob.save(processedBuffer, { contentType: "image/png" });

    const url = `https://storage.googleapis.com/${STORAGE_BUCKET}/${storagePath}`;

    // Update puppy doc
    await db.collection("puppies").doc(user.puppyId).update({
      illustrationUrl: url,
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Illustration generation error:", error);
    return NextResponse.json({ error: "Failed to generate illustration", details: String(error) }, { status: 500 });
  }
}
