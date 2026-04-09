import { NextRequest, NextResponse } from "next/server";
import { getStorage } from "firebase-admin/storage";
import { verifySession } from "@/lib/session";
import { v4 as uuidv4 } from "uuid";
// Ensure firebase-admin is initialized
import "@/db";

const BUCKET_NAME = process.env.STORAGE_BUCKET || "wuf-medical-records";

export async function POST(request: NextRequest) {
  await verifySession();

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/heic",
    "image/heif",
    "image/webp",
  ];

  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "File type not allowed. Use PDF, JPEG, PNG, or HEIC." },
      { status: 400 }
    );
  }

  const maxSize = 20 * 1024 * 1024; // 20MB
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: "File too large. Maximum 20MB." },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop() || "bin";
  const storagePath = `medical-records/${uuidv4()}.${ext}`;

  const bucket = getStorage().bucket(BUCKET_NAME);
  const blob = bucket.file(storagePath);

  await blob.save(buffer, {
    contentType: file.type,
    metadata: {
      originalName: file.name,
    },
  });

  // Make the file publicly readable
  await blob.makePublic();

  const url = `https://storage.googleapis.com/${BUCKET_NAME}/${storagePath}`;

  return NextResponse.json({
    url,
    name: file.name,
    contentType: file.type,
    size: file.size,
  });
}
