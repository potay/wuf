import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import Anthropic from "@anthropic-ai/sdk";

function buildSystemPrompt(puppyName: string, breed: string): string {
  const puppyDesc = breed ? `${puppyName} (${breed})` : puppyName;
  return `You are a veterinary record parser for a puppy named ${puppyDesc}.
Extract structured data from uploaded vet documents and insurance policies.

Return a JSON object with these fields (omit any that aren't found):

{
  "type": "vet_visit" | "insurance_policy",
  "title": "short descriptive title for the record",
  "date": "YYYY-MM-DD",
  "category": "vet_visit" | "vaccination" | "lab_results" | "prescription" | "imaging" | "other",
  "vet": {
    "name": "vet clinic name",
    "phone": "phone number",
    "address": "full address",
    "provider": "individual vet name (e.g., Dr. Lisa Sether)"
  },
  "line_items": [
    {
      "description": "what was done",
      "cost": 99.00,
      "notes": "any relevant clinical notes about this item"
    }
  ],
  "total_cost": 142.22,
  "vaccinations": [
    {
      "name": "vaccine name",
      "date": "YYYY-MM-DD",
      "notes": "series info, e.g., '1 of 2'"
    }
  ],
  "medications": [
    {
      "name": "medication name",
      "dosage": "dosage info",
      "frequency": "how often",
      "notes": "what it treats"
    }
  ],
  "reminders": [
    {
      "title": "what needs to happen",
      "due_description": "when it's due (e.g., 'in 3-4 weeks', 'in 1 week')",
      "due_date": "YYYY-MM-DD if calculable from the visit date, otherwise null"
    }
  ],
  "insurance": {
    "provider": "insurance company name",
    "policy_number": "policy number",
    "start_date": "YYYY-MM-DD",
    "end_date": "YYYY-MM-DD",
    "premium": "$X per year",
    "deductible": "$X",
    "annual_limit": "$X",
    "coverage_percentage": "80%",
    "waiting_periods": [
      { "type": "illness", "eligible_date": "YYYY-MM-DD" },
      { "type": "orthopedic", "eligible_date": "YYYY-MM-DD" }
    ],
    "preventive_care_limits": [
      { "item": "wellness exams", "limit": "$100 for 2" }
    ]
  },
  "notes": "any other important information, follow-up instructions, warnings"
}

Return ONLY valid JSON, no markdown formatting.`;
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");
  const client = new Anthropic({ apiKey });

  const content: Anthropic.ContentBlockParam[] = [];

  if (file.type === "application/pdf") {
    content.push({
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: base64 },
    });
  } else if (file.type.startsWith("image/")) {
    const mediaType = file.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif";
    content.push({
      type: "image",
      source: { type: "base64", media_type: mediaType, data: base64 },
    });
  } else {
    return NextResponse.json({ error: "Unsupported file type for parsing" }, { status: 400 });
  }

  content.push({
    type: "text",
    text: "Parse this veterinary or pet insurance document and extract all relevant structured data.",
  });

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: buildSystemPrompt(user.puppyName, user.profile.breed || ""),
      messages: [{ role: "user", content }],
    });

    let responseText = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    // Strip markdown code blocks if present
    responseText = responseText.replace(/^```(?:json)?\s*/m, "").replace(/\s*```\s*$/m, "").trim();

    const parsed = JSON.parse(responseText);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Parse error:", error);
    return NextResponse.json(
      { error: "Failed to parse document", details: String(error) },
      { status: 500 }
    );
  }
}
