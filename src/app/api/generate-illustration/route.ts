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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
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

    const imageBuffer = Buffer.from(imagePart.inlineData.data, "base64");
    const mimeType = imagePart.inlineData.mimeType;
    const ext = mimeType === "image/png" ? "png" : "jpg";

    // Upload to Firebase Storage
    const timestamp = Date.now();
    const storagePath = `illustrations/${user.puppyId}/puppy-${timestamp}.${ext}`;
    const bucket = getStorage().bucket(STORAGE_BUCKET);
    const blob = bucket.file(storagePath);

    await blob.save(imageBuffer, { contentType: mimeType });

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
